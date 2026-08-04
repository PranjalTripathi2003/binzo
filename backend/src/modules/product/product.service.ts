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

type ProductImageRow = {
  id: string;
  product_id: string;
  image_url: string;
  position: number;
  created_at: string;
};

type ProductVariantImageRow = {
  id: string;
  variant_id: string;
  image_url: string;
  position: number;
  created_at: string;
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
  product_variants: (ProductVariantRow & {
    product_variant_images?: ProductVariantImageRow[];
  })[];
  product_images: ProductImageRow[];
};

/**
 * Database logic for products, product_images, and product_variants.
 *
 * products stores the catalog item itself. product_variants stores purchasable
 * units such as 500ml, 1L, or 1kg with price, stock, and image_url.
 * product_images stores the product-level gallery used by cards and details.
 */
@Injectable()
export class ProductService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Reads all products with their nested variants and product gallery images.
   *
   * The relation select `product_variants(*)` is what gives the frontend enough
   * data to show prices and unit sizes; `product_images(*)` gives the frontend
   * card/detail gallery images without extra requests.
   */
  async findAll(
    categoryId?: string,
    search?: string,
  ): Promise<ProductWithVariants[]> {
    let query = this.supabaseService
      .getClient()
      .from('products')
      .select(
        '*, product_variants(*, product_variant_images(*)), product_images(*)',
      )
      .order('name', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search?.trim()) {
      const escaped = search.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(
        `name.ilike.${escaped}%,name.ilike.% ${escaped}%,description.ilike.${escaped}%,description.ilike.% ${escaped}%`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data as ProductWithVariants[];
  }

  /**
   * Reads one product by UUID with all variants and product gallery images.
   *
   * Used by the product detail page. PGRST116 means no matching row.
   */
  async findOne(id: string): Promise<ProductWithVariants> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .select(
        '*, product_variants(*, product_variant_images(*)), product_images(*)',
      )
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
   * Creates a product plus its gallery images and variants.
   *
   * The product must be inserted first so Supabase generates products.id. That
   * id is then copied into product_images.product_id and each
   * product_variants.product_id.
   */
  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductWithVariants> {
    const { variants, image_urls, ...productData } = createProductDto;

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

    const variantImageUrls = new Map<number, string[]>();
    const variantsWithProductId = variants.map((variant, index) => {
      const { image_urls, ...variantFields } = variant;
      variantImageUrls.set(index, image_urls ?? []);

      return {
        ...variantFields,
        product_id: product.id,
      };
    });

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

    await Promise.all(
      (productVariants ?? []).map((variant, index) =>
        this.replaceVariantImages(
          variant.id,
          variantImageUrls.get(index) ?? [],
        ),
      ),
    );

    if (image_urls && image_urls.length > 0) {
      await this.replaceProductImages(product.id, image_urls);
    }

    return this.findOne(product.id);
  }

  /**
   * Updates editable fields on an existing product and, when supplied, its
   * variants.
   *
   * Tables touched: products, product_images, and product_variants. image_urls
   * replaces the gallery. Existing variant ids in the payload are updated, new
   * variants are inserted, and omitted existing variants are removed.
   */
  async update(
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductWithVariants> {
    await this.findOne(id);

    const { variants, image_urls, ...productFields } = dto;

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
      if (image_urls) {
        await this.replaceProductImages(id, image_urls);
      }
      return this.findOne(id);
    }

    if (image_urls) {
      await this.replaceProductImages(id, image_urls);
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
      const { id: variantId, image_urls, ...variantFields } = variant;

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
        if (image_urls) {
          await this.replaceVariantImages(variantId, image_urls);
        }
        continue;
      }

      const { data: insertedVariant, error: insertError } =
        await this.supabaseService
          .getClient()
          .from('product_variants')
          .insert([{ ...variantFields, product_id: id }])
          .select()
          .single();

      if (insertError) {
        throw new HttpException(
          insertError.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (image_urls) {
        await this.replaceVariantImages(
          (insertedVariant as ProductVariantRow).id,
          image_urls,
        );
      }
    }

    return this.findOne((data as ProductRow).id);
  }

  /**
   * Replaces the product_variant_images gallery for one variant.
   *
   * Tables touched: product_variant_images. Used when admins create or edit
   * variant-specific image sets.
   */
  private async replaceVariantImages(
    variantId: string,
    imageUrls: string[],
  ): Promise<void> {
    const { error: deleteError } = await this.supabaseService
      .getClient()
      .from('product_variant_images')
      .delete()
      .eq('variant_id', variantId);

    if (deleteError) {
      throw new HttpException(
        deleteError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const rows = imageUrls
      .filter((imageUrl) => imageUrl.trim().length > 0)
      .map((imageUrl, index) => ({
        variant_id: variantId,
        image_url: imageUrl,
        position: index,
      }));

    if (rows.length === 0) {
      return;
    }

    const { error: insertError } = await this.supabaseService
      .getClient()
      .from('product_variant_images')
      .insert(rows);

    if (insertError) {
      throw new HttpException(
        insertError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Replaces the product_images gallery for one product.
   *
   * Tables touched: product_images. Existing rows are deleted then reinserted
   * with fresh positions so the frontend can render the uploaded order.
   */
  private async replaceProductImages(
    productId: string,
    imageUrls: string[],
  ): Promise<void> {
    const { error: deleteError } = await this.supabaseService
      .getClient()
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      throw new HttpException(
        deleteError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const rows = imageUrls
      .filter((imageUrl) => imageUrl.trim().length > 0)
      .map((imageUrl, index) => ({
        product_id: productId,
        image_url: imageUrl,
        position: index,
      }));

    if (rows.length === 0) {
      return;
    }

    const { error: insertError } = await this.supabaseService
      .getClient()
      .from('product_images')
      .insert(rows);

    if (insertError) {
      throw new HttpException(
        insertError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reads product_variants rows owned by one product.
   *
   * Used by update() to detect removed variants before applying edits.
   */
  private async getVariantsForProduct(
    productId: string,
  ): Promise<ProductVariantRow[]> {
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
      .storage.from('products')
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
      .storage.from('products')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl };
  }
}
