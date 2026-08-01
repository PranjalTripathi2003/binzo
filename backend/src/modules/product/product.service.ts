import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';

type ProductVariantRow = {
  id: string;
  product_id: string;
  unit: string;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
  note: string | null;
};

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  brand: string | null;
  created_at: string;
  updated_at: string;
};

type ProductWithVariants = ProductRow & {
  product_variants: ProductVariantRow[];
};

/**
 * Database logic for products and product_variants.
 *
 * products stores the catalog item itself. product_variants stores purchasable
 * units such as 500ml, 1L, or 1kg with price, stock, and image_url.
 */
@Injectable()
export class ProductService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Reads all products with their nested variants.
   *
   * The relation select `product_variants(*)` is what gives the frontend enough
   * data to show prices, unit sizes, and product images without extra requests.
   */
  async findAll(categoryId?: string): Promise<ProductWithVariants[]> {
    let query = this.supabaseService
      .getClient()
      .from('products')
      .select('*, product_variants(*)')
      .order('name', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    const { data, error } = await query;
    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data as ProductWithVariants[];
  }

  /**
   * Reads one product by UUID with all variants.
   *
   * Used by the product detail page. PGRST116 means no matching row.
   */
  async findOne(id: string): Promise<ProductWithVariants> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .returns<ProductWithVariants>()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  /**
   * Creates a product plus its variants.
   *
   * The product must be inserted first so Supabase generates products.id. That
   * id is then copied into each variant as product_variants.product_id.
   */
  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductWithVariants> {
    const { variants, ...productData } = createProductDto;

    const createResult = (await this.supabaseService
      .getClient()
      .from('products')
      .insert([productData])
      .select()
      .single()) as {
      data: ProductRow | null;
      error: { message: string } | null;
    };

    if (createResult.error || !createResult.data) {
      throw new HttpException(
        createResult.error?.message ?? 'Product was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const product = createResult.data;

    const variantsWithProductId = variants.map((variant) => ({
      ...variant,
      product_id: product.id,
    }));

    const { data: productVariants, error: productVariantError } =
      await this.supabaseService
        .getClient()
        .from('product_variants')
        .insert(variantsWithProductId)
        .select()
        .returns<ProductVariantRow[]>();

    if (productVariantError) {
      throw new HttpException(
        productVariantError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      ...product,
      product_variants: productVariants,
    };
  }

  /**
   * Deletes a product by UUID.
   *
   * findOne() verifies the product exists first. product_variants rows are
   * deleted automatically because the migration uses ON DELETE CASCADE.
   */
  async remove(id: string): Promise<{ success: true }> {
    await this.findOne(id);

    const { error } = await this.supabaseService
      .getClient()
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { success: true };
  }
}
