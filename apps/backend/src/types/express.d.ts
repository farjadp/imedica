import type { AccessTokenPayload } from '@imedica/shared';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware after JWT verification. */
      user?: AccessTokenPayload;
      /** The raw refresh token ID extracted from the httpOnly cookie (for logout). */
      refreshTokenId?: string;
    }
  }
}

export {};
