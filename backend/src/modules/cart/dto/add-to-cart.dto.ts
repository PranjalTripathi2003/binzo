import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * Request body for POST /api/cart.
 *
 * variant_id must be an existing product_variants.id. quantity must stay
 * positive because cart_items.quantity has a database CHECK constraint.
 */
export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  variant_id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}
