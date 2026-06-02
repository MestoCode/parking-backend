import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { OtpVerification } from '../../database/model/otp-verification.model';
import { User } from '../../database/model/user.model';
import { DevicesModule } from '../devices/devices.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InternalUserJwtAuthGuard } from './guards/internal-user-jwt-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    DevicesModule,
    SequelizeModule.forFeature([User, OtpVerification]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, InternalUserJwtAuthGuard],
  exports: [JwtModule, AuthService, JwtAuthGuard, InternalUserJwtAuthGuard],
})
export class AuthModule {}
