import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

/**
 * Makes the Supabase database client injectable across every feature module.
 *
 * Any service that needs to query Supabase should inject SupabaseService instead
 * of creating its own client. This keeps database credentials and client options
 * in one place.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService, SupabaseAuthGuard],
  exports: [SupabaseService, SupabaseAuthGuard],
})
export class SupabaseModule {}
