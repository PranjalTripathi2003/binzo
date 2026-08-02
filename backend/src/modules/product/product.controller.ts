import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

/**
 * HTTP layer for product catalog routes under /api/products.
 *
 * Public GET routes require no auth. Mutating routes (POST, PATCH, DELETE)
 * and the image-upload route are protected by JWT + RolesGuard('admin').
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
   * POST /api/products  [Admin only]
   *
   * Creates a product row and its product_variants rows.
   * Tables touched: products, product_variants.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
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
   * PATCH /api/products/:id  [Admin only]
   *
   * Updates product metadata and optional variants in one edit flow.
   * Tables touched: products, product_variants.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const data = await this.productService.update(id, dto);
    return {
      success: true,
      data,
      message: 'Product updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/products/:id  [Admin only]
   *
   * Deletes a product. Product variants are removed by database cascade.
   * Tables touched: products (cascade: product_variants).
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
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

  /**
   * POST /api/products/upload-image  [Admin only]
   *
   * Accepts a multipart/form-data file upload, stores the image in the
   * Supabase Storage 'products' bucket, and returns its public URL.
   *
   * The returned url can be saved into product_variants.image_url.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const data = await this.productService.uploadImage(file);
    return {
      success: true,
      data,
      message: 'Image uploaded successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
