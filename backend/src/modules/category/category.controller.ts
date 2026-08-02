import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * HTTP layer for grocery category routes under /api/categories.
 *
 * Public catalog pages call the GET routes. Create/update/delete are admin-style
 * operations and currently have no guard, so add auth/roles before exposing them.
 */
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /api/categories
   *
   * Returns all category rows sorted by name.
   */
  @Get()
  async findAll() {
    const data = await this.categoryService.findAll();
    return {
      success: true,
      data,
      message: 'Categories retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/categories/:id
   *
   * Returns one category row or a 404 from CategoryService.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.categoryService.findOne(id);
    return {
      success: true,
      data,
      message: 'Category retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/categories  [Admin only]
   *
   * Inserts a new category row. The slug must be unique.
   * Tables touched: categories.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.categoryService.create(createCategoryDto);
    return {
      success: true,
      data,
      message: 'Category created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /api/categories/:id  [Admin only]
   *
   * Updates editable category fields after verifying the category exists.
   * Tables touched: categories.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const data = await this.categoryService.update(id, updateCategoryDto);
    return {
      success: true,
      data,
      message: 'Category updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/categories/:id  [Admin only]
   *
   * Deletes a category. Database cascade rules delete its products too.
   * Tables touched: categories (cascade: products, product_variants).
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.categoryService.remove(id);
    return {
      success: true,
      data,
      message: 'Category deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
