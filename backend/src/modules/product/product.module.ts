import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

/**
 * Wires product API routes and product/product_variants database logic.
 */
@Module({
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
