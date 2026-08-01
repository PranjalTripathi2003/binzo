import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

/**
 * HTTP layer for product catalog routes under /api/products.
 *
 * Controllers keep the API response shape consistent. ProductService owns the
 * Supabase queries against products and product_variants.
 */
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * GET /api/products
   *
   * Returns products with nested variants. Optional categoryId filters the list
   * for category browsing.
   */

  @Get()
  async findAll(@Query('categoryId') categoryId: string) {
    const data = await this.productService.findAll(categoryId);
    return {
      success: true,
      data,
      message: 'Products retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/products/:id
   *
   * Returns one product with variants for the product detail page.
   */

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.productService.findOne(id);
    return {
      success: true,
      data,
      message: 'Product retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/products
   *
   * Creates a product row and its product_variants rows.
   */

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.productService.create(createProductDto);
    return {
      success: true,
      data,
      message: 'Product and its variants created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/products/:id
   *
   * Deletes a product. Product variants are removed by database cascade.
   */

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.productService.remove(id);
    return {
      success: true,
      data,
      message: 'Product deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
