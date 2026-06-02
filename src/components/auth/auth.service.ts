import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { OtpVerification } from '../../database/model/otp-verification.model';
import { User } from '../../database/model/user.model';
import { DevicesService } from '../devices/devices.service';
import { DeviceAuthDto } from './dto/device-auth.dto';
import { InternalUserLoginDto } from './dto/internal-user-login.dto';
import { MqttAuthDto } from './dto/mqtt-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  INTERNAL_USER_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  INTERNAL_USER_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  INTERNAL_USER_REFRESH_TOKEN_TYPE,
  INTERNAL_USER_TOKEN_TYPE,
  InternalUserAuthResponse,
  InternalUserJwtPayload,
  InternalUserRefreshTokenPayload,
  isInternalUserRole,
} from './internal-user-auth';

const DEVICE_TOKEN_EXPIRES_IN_SECONDS = 60 * 60;
const REFRESH_TOKEN_HASH_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(OtpVerification)
    private readonly otpVerificationModel: typeof OtpVerification,
  ) {}

  async authenticateDevice(
    dto: DeviceAuthDto,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const device = await this.devicesService.findActiveByDeviceId(dto.deviceId);
    if (!device) {
      throw new UnauthorizedException('Invalid device credentials');
    }

    const isSecretValid = await bcrypt.compare(
      dto.deviceSecret,
      device.hashedSecret,
    );
    if (!isSecretValid) {
      throw new UnauthorizedException('Invalid device credentials');
    }

    await this.devicesService.updateLastSeen(device.deviceId);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: device.deviceId,
        type: 'device',
      },
      {
        expiresIn: DEVICE_TOKEN_EXPIRES_IN_SECONDS,
      },
    );

    return {
      accessToken,
      expiresIn: DEVICE_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  async validateMqttConnection(
    dto: MqttAuthDto,
  ): Promise<{ result: 'allow'; is_superuser: false }> {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        type: string;
      }>(dto.password);
    } catch {
      throw new UnauthorizedException('Invalid MQTT credentials');
    }

    if (payload.type !== 'device' || payload.sub !== dto.username) {
      throw new UnauthorizedException('Invalid MQTT credentials');
    }

    const device = await this.devicesService.findActiveByDeviceId(dto.username);
    if (!device) {
      throw new UnauthorizedException('Device is inactive or does not exist');
    }

    await this.devicesService.updateLastSeen(device.deviceId);

    return {
      result: 'allow',
      is_superuser: false,
    };
  }

  async authenticateInternalUser(
    dto: InternalUserLoginDto,
  ): Promise<InternalUserAuthResponse> {
    const username = dto.username?.trim().toLowerCase();
    const password = dto.password?.trim();
    if (username || password) {
      if (!username || !password) {
        throw new UnauthorizedException('Invalid internal user credentials');
      }

      const user = await this.findVerifiedInternalUserByEmail(username);
      if (!user.passwordHash) {
        throw new UnauthorizedException('Invalid internal user credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid internal user credentials');
      }

      return this.issueInternalUserTokens(user);
    }

    const phoneNumber = dto.phoneNumber?.trim();
    const code = dto.code?.trim();
    if (!phoneNumber || !code) {
      throw new UnauthorizedException('Invalid internal user credentials');
    }

    const user = await this.findVerifiedInternalUserByPhoneNumber(phoneNumber);
    await this.consumeOtp(phoneNumber, code);

    return this.issueInternalUserTokens(user);
  }

  async refreshInternalUserToken(
    dto: RefreshTokenDto,
  ): Promise<InternalUserAuthResponse> {
    const refreshToken = dto.refreshToken?.trim();
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let payload: InternalUserRefreshTokenPayload;
    try {
      payload =
        await this.jwtService.verifyAsync<InternalUserRefreshTokenPayload>(
          refreshToken,
        );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== INTERNAL_USER_REFRESH_TOKEN_TYPE || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.findVerifiedInternalUserById(payload.sub);
    if (!user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueInternalUserTokens(user);
  }

  async logoutInternalUser(userId: string): Promise<void> {
    await this.userModel.update(
      { refreshToken: null },
      {
        where: {
          id: userId,
        },
      },
    );
  }

  private async findVerifiedInternalUserByPhoneNumber(
    phoneNumber: string,
  ): Promise<User> {
    const user = await this.userModel.findOne({
      where: {
        phoneNumber,
        isVerified: true,
      },
    });

    if (!user || !isInternalUserRole(user.role)) {
      throw new UnauthorizedException('Invalid internal user credentials');
    }

    return user;
  }

  private async findVerifiedInternalUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: {
        email,
        isVerified: true,
      },
    });

    if (!user || !isInternalUserRole(user.role)) {
      throw new UnauthorizedException('Invalid internal user credentials');
    }

    return user;
  }

  private async findVerifiedInternalUserById(userId: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: {
        id: userId,
        isVerified: true,
      },
    });

    if (!user || !isInternalUserRole(user.role)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }

  private async consumeOtp(phoneNumber: string, code: string): Promise<void> {
    const otp = await this.otpVerificationModel.findOne({
      where: {
        phoneNumber,
        code,
        isUsed: false,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    await otp.update({ isUsed: true });
  }

  private async issueInternalUserTokens(
    user: User,
  ): Promise<InternalUserAuthResponse> {
    const accessPayload: InternalUserJwtPayload = {
      sub: user.id,
      type: INTERNAL_USER_TOKEN_TYPE,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };
    const refreshPayload: InternalUserRefreshTokenPayload = {
      sub: user.id,
      type: INTERNAL_USER_REFRESH_TOKEN_TYPE,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: INTERNAL_USER_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: INTERNAL_USER_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
      }),
    ]);

    await user.update({
      refreshToken: await bcrypt.hash(refreshToken, REFRESH_TOKEN_HASH_ROUNDS),
    });

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: INTERNAL_USER_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      refreshExpiresIn: INTERNAL_USER_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
