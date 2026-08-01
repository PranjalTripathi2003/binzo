import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

/**
 * Wires cart API routes and cart_items database logic.
 *
 * Exporting CartService lets other modules reuse cart behavior if checkout or
 * promotions need direct cart access later.
 */
@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
