import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

/**
 * Wires category API routes and categories table logic.
 */
@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
