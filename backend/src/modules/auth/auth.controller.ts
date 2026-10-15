import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';

/**
 * HTTP layer for authentication routes under /api/auth.
 *
 * The controller only parses requests and returns the standard response shape.
 * Database work stays in AuthService.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   *
   * Creates an auth.users account; a database trigger creates its profile row.
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
      message: 'User registered',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/auth/login
   *
   * Verifies credentials with Supabase Auth and returns its session.
   */
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: result,
      message: 'Logged in',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/auth/me
   *
   * Returns the public profile for the verified Supabase Auth identity.
   */
  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  async me(@Req() req: { user: { userId: string } }) {
    const user = await this.authService.getMe(req.user.userId);
    return { success: true, data: user };
  }

  /**
   * POST /api/auth/refresh
   *
   * Rotates a Supabase Auth refresh token and returns the new session.
   */
  @Post('refresh')
  async refresh(@Body('refresh_token') refresh_token: string) {
    const result = await this.authService.refresh(refresh_token);
    return { success: true, data: result };
  }

  /**
   * POST /api/auth/logout
   *
   * Revokes the current Supabase Auth session.
   */
  @UseGuards(SupabaseAuthGuard)
  @Post('logout')
  async logout(@Req() req: { supabaseAccessToken: string }) {
    const result = await this.authService.logout(req.supabaseAccessToken);
    return { success: true, data: result };
  }
}
