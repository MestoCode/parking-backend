export const INTERNAL_USER_TOKEN_TYPE = 'internal_user';
export const INTERNAL_USER_REFRESH_TOKEN_TYPE = 'internal_user_refresh';
export const INTERNAL_USER_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
export const INTERNAL_USER_REFRESH_TOKEN_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60;

const INTERNAL_USER_ROLES = new Set(['admin', 'operator']);

export type InternalUserJwtPayload = {
  sub: string;
  type: typeof INTERNAL_USER_TOKEN_TYPE;
  role: string;
  phoneNumber: string;
};

export type InternalUserRefreshTokenPayload = {
  sub: string;
  type: typeof INTERNAL_USER_REFRESH_TOKEN_TYPE;
};

export type InternalUserAuthResponse = {
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: {
    id: string;
    phoneNumber: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export function isInternalUserRole(role: string): boolean {
  return INTERNAL_USER_ROLES.has(role);
}
