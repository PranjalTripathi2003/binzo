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
   * Verifies an active refresh token, matches its bcrypt hash,
   * and rotates it by generating a new access/refresh pair.
   */
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException('Refresh token is required', HttpStatus.BAD_REQUEST);
    }

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'default-refresh-secret';

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      this.logger.error('Invalid refresh token signature/expiry: ' + (err as Error).message);
      throw new HttpException('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
    }

    const userId = payload.sub;
    const email = payload.email;

    if (!userId || !email) {
      throw new HttpException('Invalid refresh token payload', HttpStatus.UNAUTHORIZED);
    }

    // Fetch active refresh tokens for the user
    const { data: records, error } = await this.supabaseService
      .getClient()
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('revoked', false);

    if (error) {
      this.logger.error('Error fetching refresh tokens: ' + error.message);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!records || records.length === 0) {
      throw new HttpException('No session found', HttpStatus.UNAUTHORIZED);
    }

    // Compare bcrypt hashes to locate the matched token session
    let matchedRecord: any = null;
    for (const record of records) {
      const isMatch = await bcrypt.compare(refreshToken, record.token_hash);
      if (isMatch) {
        if (new Date(record.expires_at) > new Date()) {
          matchedRecord = record;
          break;
        }
      }
    }

    if (!matchedRecord) {
      throw new HttpException('Invalid or expired session', HttpStatus.UNAUTHORIZED);
    }

    // Generate new access and refresh tokens
    const tokens = await this.generateTokens(userId, email);

    // Rotate token hash in DB
    const newTokenHash = await bcrypt.hash(tokens.refresh_token, 10);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await this.supabaseService
      .getClient()
      .from('refresh_tokens')
      .update({
        token_hash: newTokenHash,
        expires_at: newExpiresAt,
        created_at: new Date(),
      })
      .eq('id', matchedRecord.id);

    if (updateError) {
      this.logger.error('Failed to rotate refresh token: ' + updateError.message);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return tokens;
  }


  /**
   * Fetches the full user profile from the users table.
   *
   * Called by GET /api/auth/me so the frontend receives name, email, phone, etc.
   * rather than only the fields that were embedded in the JWT payload.
   */
  async getMe(userId: string) {
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, email, name, phone, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
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
