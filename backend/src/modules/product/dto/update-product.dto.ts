import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * One product_variants row to create or update while editing a product.
 *
 * id is optional so the same payload can keep existing variants and add new
 * variants. Omitted existing ids are removed from the product.
 */
export class UpdateProductVariantDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsInt()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];

  @IsString()
  @IsOptional()
  note?: string;
}

/**
 * Request body for updating an existing product row.
 *
 * All fields are optional. Product fields update the products table;
 * image_urls replace product_images rows; variants update product_variants rows
 * for the same product.
 */
export class UpdateProductDto {
  @IsString()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  @IsOptional()
  variants?: UpdateProductVariantDto[];
}
