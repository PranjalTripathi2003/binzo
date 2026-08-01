import { IsOptional, IsString } from 'class-validator';

/**
 * Request body for POST /api/orders.
 *
 * address_id is optional so early checkout can work before saved addresses are
 * fully implemented.
 */
export class CreateOrderDto {
  @IsString()
  @IsOptional()
  address_id?: string;
}
