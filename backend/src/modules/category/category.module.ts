import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

/**
 * Wires category API routes and categories table logic.
 *
 * SupabaseModule is imported so RolesGuard (used on mutating routes) can
 * inject SupabaseService to read the user's role from public.users.
 */
@Module({
  imports: [SupabaseModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
