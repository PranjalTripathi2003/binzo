import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';

/**
 * Wires authentication dependencies.
 *
 * Exposes the AuthController routes and Supabase Auth session operations.
 */
@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
