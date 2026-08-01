import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Owns the single Supabase client used by the backend.
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env, creates a
 * service-role client, and exposes it through getClient() for database modules.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.error(
        'Supabase URL or Service Role Key is missing in environment variables.',
      );
      throw new Error('Supabase credentials are not configured properly.');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    this.logger.log('Supabase client initialized successfully.');
  }

  /**
   * Returns the configured Supabase client.
   *
   * Services call this before selecting/inserting/updating/deleting rows in
   * tables such as categories, products, cart_items, orders, and order_items.
   */
  getClient(): SupabaseClient {
    return this.supabaseClient;
  }
}
