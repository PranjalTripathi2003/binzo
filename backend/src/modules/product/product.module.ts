import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SupabaseModule } from '../supabase/supabase.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

/**
 * Wires product API routes and product/product_variants database logic.
 *
 * MulterModule is configured with memoryStorage so uploaded files are kept in
 * memory (as Buffer) and passed directly to SupabaseService.storage.upload()
 * without writing to disk first.
 *
 * SupabaseModule is imported so RolesGuard can be injected (it needs
 * SupabaseService to read the user's role from public.users).
 */
@Module({
  imports: [
    SupabaseModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
