import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type CartItem = {
  id: string;
  variant_id: string;
  quantity: number;
  note?: string | null;
  product_variants: ProductVariantRelation;
};

type ProductVariantRelation =
  | { price: string | number }
  | { price: string | number }[]
  | null;

type OrderRow = {
  id: string;
  status: string;
};

type SupabaseQueryResult<T> = {
  data: T | null;
  error: {
    code?: string;
    message: string;
  } | null;
};

/**
 * Database logic for orders and order_items.
 *
 * Checkout flow:
 * 1. Read cart_items for the user.
 * 2. Calculate total_amount from product_variants.price.
 * 3. Insert one orders row.
 * 4. Insert one order_items row per cart item.
 * 5. Clear cart_items for that user.
 */
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Reads all orders owned by a user, newest first.
   *
   * Joins addresses, order_items, product_variants, and products so the frontend
   * can render an order history view without follow-up requests.
   */
  async findAll(userId: string): Promise<unknown> {
    const response = (await this.supabaseService
      .getClient()
      .from('orders')
      .select(
        '*, addresses(*), order_items(*, product_variants(*, products(*)))',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })) as SupabaseQueryResult<
      unknown[]
    >;
    const data = response.data;
    const error = response.error;

    if (error) {
      this.logger.error(
        `Error fetching orders for user ${userId}: ${error.message}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Reads one order owned by a user.
   *
   * Filtering by both id and user_id prevents a user from fetching someone
   * else's order if they guess an order UUID.
   */
  async findOne(userId: string, orderId: string): Promise<unknown> {
    const response = (await this.supabaseService
      .getClient()
      .from('orders')
      .select(
        '*, addresses(*), order_items(*, product_variants(*, products(*)))',
      )
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()) as SupabaseQueryResult<unknown>;
    const data = response.data;
    const error = response.error;

    if (error) {
      this.logger.error(`Error fetching order ${orderId}: ${error.message}`);
      if (error.code === 'PGRST116') {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Creates an order from the user's cart.
   *
   * This method intentionally performs several database writes. If inserting
   * order_items fails after creating the order, it deletes the new order to
   * avoid leaving an empty order behind.
   */
  async create(userId: string, dto: CreateOrderDto): Promise<unknown> {
    if (dto.address_id) {
      await this.validateAddress(userId, dto.address_id);
    }

    const cartItems = await this.getCartItems(userId);
    if (cartItems.length === 0) {
      throw new HttpException('Cart is empty', HttpStatus.BAD_REQUEST);
    }

    const totalAmount = cartItems.reduce((total, item) => {
      const price = this.getVariantPrice(item.product_variants);
      return total + price * item.quantity;
    }, 0);

    const orderResponse = (await this.supabaseService
      .getClient()
      .from('orders')
      .insert([
        {
          user_id: userId,
          address_id: dto.address_id,
          total_amount: totalAmount,
          delivery_eta_minutes: dto.delivery_eta_minutes ?? 15,
        },
      ])
      .select()
      .single()) as SupabaseQueryResult<OrderRow>;
    const order = orderResponse.data;
    const orderError = orderResponse.error;

    if (orderError) {
      this.logger.error(
        `Error creating order for user ${userId}: ${orderError.message}`,
      );
      throw new HttpException(
        orderError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!order) {
      throw new HttpException(
        'Order was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price_at_purchase: this.getVariantPrice(item.product_variants),
      note: item.note,
    }));

    const itemsResponse = (await this.supabaseService
      .getClient()
      .from('order_items')
      .insert(orderItems)) as SupabaseQueryResult<unknown>;
    const itemsError = itemsResponse.error;

    if (itemsError) {
      await this.supabaseService
        .getClient()
        .from('orders')
        .delete()
        .eq('id', order.id);
      this.logger.error(
        `Error creating order items for order ${order.id}: ${itemsError.message}`,
      );
      throw new HttpException(
        itemsError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const clearCartResponse = (await this.supabaseService
      .getClient()
      .from('cart_items')
      .delete()
      .eq('user_id', userId)) as SupabaseQueryResult<unknown>;
    const clearCartError = clearCartResponse.error;

    if (clearCartError) {
      this.logger.error(
        `Error clearing cart for user ${userId}: ${clearCartError.message}`,
      );
      throw new HttpException(
        clearCartError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.findOne(userId, order.id);
  }

  /**
   * Updates order.status for one order owned by the user.
   */
  async updateStatus(
    userId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<unknown> {
    await this.findOne(userId, orderId);

    const response = (await this.supabaseService
      .getClient()
      .from('orders')
      .update({ status: dto.status })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select(
        '*, addresses(*), order_items(*, product_variants(*, products(*)))',
      )
      .single()) as SupabaseQueryResult<unknown>;
    const data = response.data;
    const error = response.error;

    if (error) {
      this.logger.error(`Error updating order ${orderId}: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Cancels an order unless it is already packed, picked, delivered, or cancelled.
   */
  async cancel(userId: string, orderId: string): Promise<unknown> {
    const order = (await this.findOne(userId, orderId)) as OrderRow;

    if (
      ['packed', 'out_for_delivery', 'delivered', 'success', 'cancelled'].includes(
        order.status,
      )
    ) {
      throw new HttpException(
        'Orders cannot be cancelled once packed for delivery',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.updateStatus(userId, orderId, { status: 'cancelled' });
  }

  /**
   * Reads the current cart rows needed to build order_items.
   */
  private async getCartItems(userId: string): Promise<CartItem[]> {
    const response = (await this.supabaseService
      .getClient()
      .from('cart_items')
      .select('id, variant_id, quantity, note, product_variants(price)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })) as SupabaseQueryResult<
      CartItem[]
    >;
    const data = response.data;
    const error = response.error;

    if (error) {
      this.logger.error(
        `Error fetching cart for order creation: ${error.message}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data ?? [];
  }

  /**
   * Normalizes Supabase relation output into a number.
   *
   * Depending on relation typing, product_variants can appear as an object,
   * array, or null, so this helper safely extracts the first price.
   */
  private getVariantPrice(productVariants: ProductVariantRelation): number {
    const variant = Array.isArray(productVariants)
      ? productVariants[0]
      : productVariants;
    return Number(variant?.price ?? 0);
  }

  /**
   * Confirms the selected address belongs to the logged-in user.
   *
   * This prevents creating an order with another user's address_id.
   */
  private async validateAddress(userId: string, addressId: string) {
    const response = (await this.supabaseService
      .getClient()
      .from('addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single()) as SupabaseQueryResult<unknown>;
    const error = response.error;

    if (error) {
      if (error.code === 'PGRST116') {
        throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
