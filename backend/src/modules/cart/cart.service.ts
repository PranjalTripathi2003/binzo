import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

/**
 * Database logic for the cart_items table.
 *
 * cart_items links a user to selected product_variants. Most reads join through
 * product_variants to products so the frontend can render cart item names,
 * images, unit sizes, and prices from a single API response.
 */
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Reads all cart items for a user.
   *
   * Tables read:
   * - cart_items
   * - product_variants
   * - products
   */
  async getCart(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('cart_items')
      .select('*, product_variants(*, products(*), product_variant_images(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(
        `Error fetching cart for user ${userId}: ${error.message}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  /**
   * Adds a variant to the user's cart.
   *
   * If the same user already has the same variant_id, this updates quantity
   * instead of inserting a duplicate row. That matches the database unique
   * constraint on (user_id, variant_id).
   */
  async addToCart(userId: string, dto: AddToCartDto) {
    const { variant_id, quantity, note } = dto;

    const { data: existing, error: findError } = await this.supabaseService
      .getClient()
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('variant_id', variant_id)
      .maybeSingle();

    if (findError) {
      throw new HttpException(
        findError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      const { data: updated, error: updateError } = await this.supabaseService
        .getClient()
        .from('cart_items')
        .update({ quantity: newQuantity, note: note || existing.note })
        .eq('id', existing.id)
        .select('*, product_variants(*, products(*), product_variant_images(*))')
        .single();

      if (updateError) {
        throw new HttpException(
          updateError.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return updated;
    } else {
      const { data: inserted, error: insertError } = await this.supabaseService
        .getClient()
        .from('cart_items')
        .insert([{ user_id: userId, variant_id, quantity, note }])
        .select('*, product_variants(*, products(*), product_variant_images(*))')
        .single();

      if (insertError) {
        throw new HttpException(
          insertError.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return inserted;
    }
  }

  /**
   * Updates quantity for a single cart item.
   *
   * Both id and user_id are filtered so users can update only their own rows.
   */
  async updateQuantity(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ) {
    const { quantity } = dto;

    const { data, error } = await this.supabaseService
      .getClient()
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .select('*, product_variants(*, products(*))')
      .single();

    if (error) {
      this.logger.error(
        `Error updating cart item ${cartItemId}: ${error.message}`,
      );
      if (error.code === 'PGRST116') {
        throw new HttpException('Cart item not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Deletes one cart item owned by the user.
   */
  async removeFromCart(userId: string, cartItemId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(
        `Error removing cart item ${cartItemId}: ${error.message}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { success: true, message: 'Item removed from cart' };
  }

  /**
   * Removes all cart_items rows owned by the user.
   */
  async clearCart(userId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.logger.error(
        `Error clearing cart for user ${userId}: ${error.message}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { success: true, message: 'Cart cleared' };
  }
}
