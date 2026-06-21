import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * TODO: Implement GET /api/products
   * Description: Fetches all products, optionally filtered by a query parameter 'categoryId'.
   * Requirements:
   * 1. Use the `@Get()` decorator.
   * 2. Use `@Query('categoryId')` to extract the category ID query parameter if present.
   * 3. Call `this.productService.findAll(categoryId)`.
   * 4. Return standard response wrapper: `{ success: true, data, message, timestamp }`
   */
  async findAll() {
    // YOUR CODE HERE
    return null;
  }

  /**
   * TODO: Implement GET /api/products/:id
   * Description: Fetches a single product by ID.
   * Requirements:
   * 1. Use the `@Get(':id')` decorator.
   * 2. Use `@Param('id')` to extract the ID parameter.
   * 3. Call `this.productService.findOne(id)`.
   * 4. Return standard response wrapper.
   */
  async findOne() {
    // YOUR CODE HERE
    return null;
  }

  /**
   * TODO: Implement POST /api/products
   * Description: Creates a new product and its variants.
   * Requirements:
   * 1. Use the `@Post()` decorator.
   * 2. Use `@Body()` to extract the 'CreateProductDto'.
   * 3. Call `this.productService.create(createProductDto)`.
   * 4. Return standard response wrapper.
   */
  async create() {
    // YOUR CODE HERE
    return null;
  }

  /**
   * TODO: Implement DELETE /api/products/:id
   * Description: Deletes a product.
   * Requirements:
   * 1. Use the `@Delete(':id')` decorator.
   * 2. Use `@Param('id')` to extract the ID.
   * 3. Call `this.productService.remove(id)`.
   * 4. Return standard response wrapper.
   */
  async remove() {
    // YOUR CODE HERE
    return null;
  }
}
