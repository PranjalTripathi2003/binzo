import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Passport JWT strategy used by protected controllers.
 *
 * Reads the Bearer token from the Authorization header, verifies it with
 * JWT_SECRET, and attaches a small user object to req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Converts the JWT payload into the request user shape used by controllers.
   *
   * Authenticated controllers read req.user.userId to scope database queries to
   * the logged-in user.
   */
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
