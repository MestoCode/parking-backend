import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { FastifyRequest } from 'fastify';
import { User } from '../../../database/model/user.model';
import {
  INTERNAL_USER_TOKEN_TYPE,
  InternalUserJwtPayload,
  isInternalUserRole,
} from '../internal-user-auth';

export type AuthenticatedInternalUserRequest = FastifyRequest & {
  user?: InternalUserJwtPayload;
};

@Injectable()
export class InternalUserJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedInternalUserRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verifyInternalUserToken(token);
    const user = await this.userModel.findOne({
      where: {
        id: payload.sub,
        isVerified: true,
      },
    });

    if (!user || !isInternalUserRole(user.role)) {
      throw new UnauthorizedException('Invalid internal user token');
    }

    request.user = {
      ...payload,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };

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

  private async verifyInternalUserToken(
    token: string,
  ): Promise<InternalUserJwtPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<InternalUserJwtPayload>(token);
      if (payload.type !== INTERNAL_USER_TOKEN_TYPE || !payload.sub) {
        throw new UnauthorizedException('Invalid internal user token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid internal user token');
    }
  }
}
