import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
   * Updates editable fields on an existing product and, when supplied, its
   * variants.
   *
   * Tables touched: products and product_variants. Existing variant ids in the
   * payload are updated, new variants are inserted, and omitted existing
   * variants are removed from this product.
   */
  async update(id: string, dto: UpdateProductDto): Promise<ProductWithVariants> {
    await this.findOne(id);

    const { variants, ...productFields } = dto;

    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .update(productFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!variants) {
      return this.findOne(id);
    }

    const existingVariants = await this.getVariantsForProduct(id);
    const existingVariantIds = new Set(
      existingVariants.map((variant) => variant.id),
    );
    const submittedExistingIds = variants
      .map((variant) => variant.id)
      .filter((variantId): variantId is string => Boolean(variantId));

    const variantsToDelete = existingVariants
      .filter((variant) => !submittedExistingIds.includes(variant.id))
      .map((variant) => variant.id);

    if (variantsToDelete.length > 0) {
      const { error: deleteError } = await this.supabaseService
        .getClient()
        .from('product_variants')
        .delete()
        .eq('product_id', id)
        .in('id', variantsToDelete);

      if (deleteError) {
        throw new HttpException(
          deleteError.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    for (const variant of variants) {
      const { id: variantId, ...variantFields } = variant;

      if (variantId && existingVariantIds.has(variantId)) {
        const { error: updateError } = await this.supabaseService
          .getClient()
          .from('product_variants')
          .update(variantFields)
          .eq('id', variantId)
          .eq('product_id', id);

        if (updateError) {
          throw new HttpException(
            updateError.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        continue;
      }

      const { error: insertError } = await this.supabaseService
        .getClient()
        .from('product_variants')
        .insert([{ ...variantFields, product_id: id }]);

      if (insertError) {
        throw new HttpException(
          insertError.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return this.findOne((data as ProductRow).id);
  }

  /**
   * Reads product_variants rows owned by one product.
   *
   * Used by update() to detect removed variants before applying edits.
   */
  private async getVariantsForProduct(productId: string): Promise<ProductVariantRow[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data as ProductVariantRow[];
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

  /**
   * Uploads a product image to Supabase Storage 'products' bucket.
   *
   * The file is stored at products/<timestamp>-<filename> to prevent collisions.
   * Returns the public URL that can be saved into product_variants.image_url.
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    const { error } = await this.supabaseService
      .getClient()
      .storage
      .from('products')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new HttpException(
        `Image upload failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { data: urlData } = this.supabaseService
      .getClient()
      .storage
      .from('products')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl };
  }
}
