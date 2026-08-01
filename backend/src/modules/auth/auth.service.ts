import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

/**
 * Database and token logic for authentication.
 *
 * Tables touched:
 * - users: stores account profile fields and the local password_hash.
 * - refresh_tokens: stores hashed refresh tokens for logout/rotation support.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Creates a new account.
   *
   * Flow:
   * 1. Checks users.email for an existing account.
   * 2. Hashes the plaintext password with bcrypt.
   * 3. Inserts the user into users.
   * 4. Generates JWT access/refresh tokens.
   * 5. Stores a hashed refresh token in refresh_tokens.
   *
   * Schema note: the main migration currently creates users without a
   * password_hash column, and refresh_tokens exists in a Supabase snippet.
   * Move those into a migration before relying on auth in a fresh database.
   */
  async register(dto: RegisterDto) {
    const { email, password, name } = dto;

    // Prevent duplicate accounts before attempting the insert.
    const { data: existing, error: findErr } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (findErr) {
      throw new HttpException(
        findErr.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (existing) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error: passwordHashInsertError } =
      await this.supabaseService
        .getClient()
        .from('users')
        .insert([
          {
            email,
            name,
            password_hash,
          },
        ])
        .select()
        .single();

    if (passwordHashInsertError) {
      this.logger.error(
        'Failed to insert user: ' + passwordHashInsertError.message,
      );
      throw new HttpException(
        passwordHashInsertError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const tokens = await this.generateTokens(user.id, user.email);

    const token_hash = await bcrypt.hash(tokens.refresh_token, 10);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data: refreshTokenInsertData, error: refreshTokenInsertError } =
      await this.supabaseService
        .getClient()
        .from('refresh_tokens')
        .insert([
          {
            user_id: user.id,
            token_hash,
            expires_at,
          },
        ])
        .single();
    if (refreshTokenInsertError) {
      throw new HttpException(
        refreshTokenInsertError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { user, ...tokens };
  }

  /**
   * Looks up a user by email and compares the submitted password with the
   * bcrypt password_hash stored in users.
   */
  async validateUser(email: string, password: string) {
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      this.logger.error('Error fetching user: ' + error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!user) return null;

    const match = await bcrypt.compare(password, user.password_hash || '');
    if (!match) return null;
    return user;
  }

  /**
   * Signs in an existing user.
   *
   * After validateUser succeeds, this creates a fresh access token and refresh
   * token, then inserts a hashed refresh token row for later logout/rotation.
   */
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user)
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    const tokens = await this.generateTokens(user.id, user.email);

    const token_hash = await bcrypt.hash(tokens.refresh_token, 10);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const {
      data: loginRefreshTokenHashData,
      error: loginRefreshTokenHashError,
    } = await this.supabaseService
      .getClient()
      .from('refresh_tokens')
      .insert([
        {
          user_id: user.id,
          token_hash,
          expires_at,
        },
      ]);
    if (loginRefreshTokenHashError) {
      throw new HttpException(
        loginRefreshTokenHashError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      user,
      ...tokens,
    };
  }

  /**
   * Builds the two tokens the frontend stores after login/register.
   *
   * access_token is signed by Nest JwtService with JWT_SECRET. refresh_token is
   * signed separately with JWT_REFRESH_SECRET and lasts 7 days.
   */
  async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const access_token = await this.jwtService.signAsync(payload);

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'default-refresh-secret';
    const refresh_token = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

    return { access_token, refresh_token };
  }

  /**
   * Placeholder for refresh-token rotation.
   *
   * Intended flow:
   * 1. Verify the refresh JWT.
   * 2. Find the user's active refresh_tokens rows.
   * 3. bcrypt.compare() the submitted token against token_hash.
   * 4. Issue new tokens and revoke/replace the old hash.
   */
  async refresh(_refreshToken: string) {
    const { data: refreshTokenHash, error: refreshTokenHashError } =
      await this.supabaseService
        .getClient()
        .from('refresh_tokens')
        .select('*')
        .eq('token_hash', _refreshToken)
        .single();

    if (refreshTokenHash) {
      throw new HttpException(
        refreshTokenHash.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return { success: true };
  }

  /**
   * Logs out a user by deleting their refresh token rows.
   *
   * This does not invalidate already-issued access tokens; they remain valid
   * until their JWT expiry.
   */
  async logout(userId: string) {
    if (!userId) {
      throw new HttpException(
        'User ID is required for logout',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { error } = await this.supabaseService
      .getClient()
      .from('refresh_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Logout failed for user ${userId}: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Logged out successfully' };
  }
}
