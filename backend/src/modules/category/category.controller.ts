import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const data = await this.categoryService.update(id, updateCategoryDto);
    return {
      success: true,
      data,
      message: 'Category updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

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
