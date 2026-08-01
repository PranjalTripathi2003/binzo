import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

/**
 * HTTP layer for cart routes under /api/cart.
 *
 * All routes require a JWT. The decoded userId scopes every cart database query
 * so one user cannot read or edit another user's cart_items rows.
 */
@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * GET /api/cart
   *
   * Returns the logged-in user's cart with product and variant details.
   */
  @Get()
  async getCart(@Req() req: any) {
    const userId = req.user.userId;
    const data = await this.cartService.getCart(userId);
    return {
      success: true,
      data,
      message: 'Cart retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/cart
   *
   * Adds a variant to the cart, or increases quantity when that variant is
   * already present for the user.
   */
  @Post()
  async addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    const userId = req.user.userId;
    const data = await this.cartService.addToCart(userId, dto);
    return {
      success: true,
      data,
      message: 'Item added to cart',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /api/cart/:id
   *
   * Changes the quantity on a single cart_items row owned by the user.
   */
  @Patch(':id')
  async updateQuantity(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = req.user.userId;
    const data = await this.cartService.updateQuantity(userId, id, dto);
    return {
      success: true,
      data,
      message: 'Cart item updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/cart/:id
   *
   * Removes one cart_items row owned by the user.
   */
  @Delete(':id')
  async removeFromCart(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const data = await this.cartService.removeFromCart(userId, id);
    return {
      success: true,
      data,
      message: 'Cart item removed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/cart
   *
   * Clears every cart_items row owned by the user.
   */
  @Delete()
  async clearCart(@Req() req: any) {
    const userId = req.user.userId;
    const data = await this.cartService.clearCart(userId);
    return {
      success: true,
      data,
      message: 'Cart cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
