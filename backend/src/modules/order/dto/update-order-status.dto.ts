import { IsIn } from 'class-validator';

/**
 * Request body for PATCH /api/orders/:id/status.
 *
 * Restricts status values to the order lifecycle supported by the database and
 * frontend.
 */
export class UpdateOrderStatusDto {
  @IsIn([
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ])
  status: string;
}
