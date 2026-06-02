import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DeviceAuthDto } from './dto/device-auth.dto';
import { InternalUserLoginDto } from './dto/internal-user-login.dto';
import { MqttAuthDto } from './dto/mqtt-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { InternalUserJwtAuthGuard } from './guards/internal-user-jwt-auth.guard';
import type { AuthenticatedInternalUserRequest } from './guards/internal-user-jwt-auth.guard';
import type { InternalUserAuthResponse } from './internal-user-auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('device')
  authenticateDevice(
    @Body() dto: DeviceAuthDto,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    return this.authService.authenticateDevice(dto);
  }

  @Post('mqtt')
  @HttpCode(200)
  validateMqttConnection(
    @Body() dto: MqttAuthDto,
  ): Promise<{ result: 'allow'; is_superuser: false }> {
    return this.authService.validateMqttConnection(dto);
  }

  @Post('internal/login')
  @HttpCode(200)
  authenticateInternalUser(
    @Body() dto: InternalUserLoginDto,
  ): Promise<InternalUserAuthResponse> {
    return this.authService.authenticateInternalUser(dto);
  }

  @Post('internal/refresh')
  @HttpCode(200)
  refreshInternalUserToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<InternalUserAuthResponse> {
    return this.authService.refreshInternalUserToken(dto);
  }

  @Post('internal/logout')
  @UseGuards(InternalUserJwtAuthGuard)
  @HttpCode(204)
  async logoutInternalUser(
    @Req() request: AuthenticatedInternalUserRequest,
  ): Promise<void> {
    await this.authService.logoutInternalUser(request.user!.sub);
  }
}
