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
import { AuthGuard } from '@nestjs/passport';

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
   * Creates a user row and refresh-token row through AuthService.
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
   * Verifies credentials and returns access/refresh tokens.
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
   * Returns the user identity decoded by JwtStrategy; no database read happens
   * here yet.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    // JwtStrategy validate attaches userId and email to request.user
    return { success: true, data: req.user };
  }

  /**
   * POST /api/auth/refresh
   *
   * Placeholder route for refreshing expired access tokens.
   */
  @Post('refresh')
  async refresh(@Body('refresh_token') refresh_token: string) {
    // TODO: implement refresh flow in AuthService
    const result = await this.authService.refresh(refresh_token);
    return { success: true, data: result };
  }

  /**
   * POST /api/auth/logout
   *
   * Deletes refresh token rows for the logged-in user.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: any) {
    // TODO: clear stored refresh token
    const userId = req.user?.userId;
    const result = await this.authService.logout(userId);
    return { success: true, data: result };
  }
}
