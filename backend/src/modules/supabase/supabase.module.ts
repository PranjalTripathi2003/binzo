import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

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
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
