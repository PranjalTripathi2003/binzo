import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Coordinates Supabase Auth sessions and reads the matching public profile.
 * Auth credentials live in auth.users; public.users stores application profile
 * and role data linked by the same UUID.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  /** Creates an Auth account; the database trigger creates its public profile. */
  async register(dto: RegisterDto) {
    const { data, error } = await this.createAuthClient().auth.signUp({
      email: dto.email,
      password: dto.password,
      options: { data: { name: dto.name, phone: dto.phone } },
    });

    if (error) {
      const status = error.status === 422 ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
      throw new HttpException(error.message, status);
    }

    return {
      user: data.user ? this.toAuthUser(data.user) : null,
      access_token: data.session?.access_token ?? null,
      refresh_token: data.session?.refresh_token ?? null,
    };
  }

  /** Authenticates credentials through Supabase Auth and returns its session. */
  async login(dto: LoginDto) {
    const { data, error } = await this.createAuthClient().auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user || !data.session) {
      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    return {
      user: this.toAuthUser(data.user),
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  /** Refreshes an Auth session using Supabase's rotating refresh token. */
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException('Refresh token is required', HttpStatus.BAD_REQUEST);
    }

    const { data, error } = await this.createAuthClient().auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new HttpException('Invalid or expired session', HttpStatus.UNAUTHORIZED);
    }

    return {
      user: this.toAuthUser(data.user),
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  /** Reads a profile by the authenticated auth.users UUID. */
  async getMe(userId: string) {
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, email, name, phone, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      this.logger.warn(`Profile lookup failed for authenticated user ${userId}`);
      throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  /** Revokes the current Supabase Auth session using its bearer token. */
  async logout(accessToken: string) {
    if (!accessToken) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { error } = await this.supabaseService
      .getClient()
      .auth.admin.signOut(accessToken, 'local');

    if (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }

    return { message: 'Logged out successfully' };
  }

  private createAuthClient() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (!url || !key) {
      throw new HttpException(
        'Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private toAuthUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
    return {
      id: user.id,
      email: user.email ?? '',
      name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined,
    };
  }
}
