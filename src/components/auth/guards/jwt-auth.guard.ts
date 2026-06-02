import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { DevicesService } from '../../devices/devices.service';

type DeviceJwtPayload = {
  sub: string;
  type: 'device';
};

type AuthenticatedDeviceRequest = FastifyRequest & {
  user?: DeviceJwtPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly devicesService: DevicesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedDeviceRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verifyDeviceToken(token);
    const device = await this.devicesService.findActiveByDeviceId(payload.sub);
    if (!device) {
      throw new UnauthorizedException('Device is inactive or does not exist');
    }

    await this.devicesService.updateLastSeen(device.deviceId);
    request.user = payload;

    return true;
  }

  private extractBearerToken(request: FastifyRequest): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }

  private async verifyDeviceToken(token: string): Promise<DeviceJwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<DeviceJwtPayload>(token);
      if (payload.type !== 'device' || !payload.sub) {
        throw new UnauthorizedException('Invalid device token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid device token');
    }
  }
}
