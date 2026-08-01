import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Database logic for the categories table.
 *
 * Categories are top-level catalog groups such as Dairy, Fruits, and Snacks.
 * Products reference categories through products.category_id.
 */
@Injectable()
export class CategoryService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Reads every category, ordered alphabetically by name for the homepage grid.
   */
  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  /**
   * Reads a single category by UUID.
   *
   * Supabase returns PGRST116 when .single() finds no row; this maps that to a
   * proper 404 so the API response is meaningful.
   */
  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  /**
   * Inserts a category row.
   *
   * The database enforces categories.slug uniqueness. Error code 23505 means
   * the slug already exists.
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .insert([createCategoryDto])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new HttpException(
          'Category slug already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  /**
   * Updates an existing category row.
   *
   * findOne() is called first to give a clean 404 before running the update.
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    const { data, error } = await this.supabaseService
      .getClient()
      .from('categories')
      .update(updateCategoryDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new HttpException(
          'Category slug already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  /**
   * Deletes a category row.
   *
   * The migration sets products.category_id ON DELETE CASCADE, so deleting a
   * category also deletes all products and variants under it.
   */
  async remove(id: string) {
    await this.findOne(id);

    const { error } = await this.supabaseService
      .getClient()
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { success: true, message: 'Category deleted successfully' };
  }
}
