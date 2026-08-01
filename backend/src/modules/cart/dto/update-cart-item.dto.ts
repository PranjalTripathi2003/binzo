import { IsInt, Min } from 'class-validator';

/**
 * Request body for PATCH /api/cart/:id.
 *
 * Only quantity is editable from this endpoint.
 */
export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
