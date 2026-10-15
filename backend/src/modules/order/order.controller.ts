import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Headers,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};

/**
 * HTTP layer for order routes under /api/orders.
 *
 * All routes require a JWT and pass req.user.userId into OrderService so every
 * database operation is scoped to the logged-in user.
 */
@UseGuards(SupabaseAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly configService: ConfigService,
  ) {}

  /** POST /api/orders/webhooks/razorpay verifies the raw payload signature before database idempotency handling. */
  @Post('webhooks/razorpay')
  @UseGuards()
  async razorpayWebhook(
    @Req() req: { body: unknown; rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature?: string,
    @Headers('x-razorpay-event-id') eventId?: string,
  ) {
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret || !signature || !eventId || !req.rawBody) {
      throw new HttpException('Invalid webhook signature or headers', HttpStatus.BAD_REQUEST);
    }
    const expected = createHmac('sha256', secret).update(req.rawBody).digest();
    let supplied: Buffer;
    try { supplied = Buffer.from(signature, 'hex'); } catch { supplied = Buffer.alloc(0); }
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      throw new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST);
    }
    const payload = req.body as { event?: string; payload?: { payment?: { entity?: { order_id?: string } } } };
    const eventType = payload.event;
    const orderId = payload.payload?.payment?.entity?.order_id;
    if (
      (eventType !== 'payment.captured' && eventType !== 'payment.failed') ||
      !orderId
    ) {
      return { success: true, duplicate: false };
    }
    const duplicate = !(await this.orderService.processPaymentEvent(
      eventId,
      orderId,
      eventType,
    ));
    return { success: true, duplicate };
  }

  /**
   * GET /api/orders
   *
   * Returns the logged-in user's order history.
   */
  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const data = await this.orderService.findAll(userId);
    return {
      success: true,
      data,
      message: 'Orders retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/orders/:id
   *
   * Returns one order owned by the logged-in user.
   */
  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user.userId;
    const data = await this.orderService.findOne(userId, id);
    return {
      success: true,
      data,
      message: 'Order retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/orders
   *
   * Converts the current cart into an order and clears the cart.
   */
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const userId = req.user.userId;
    const data = await this.orderService.create(userId, createOrderDto);
    return {
      success: true,
      data,
      message: 'Order created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /api/orders/:id/status
   *
   * Updates order.status. Today this is user-accessible; add role checks before
   * using it for admin-only delivery operations.
   */
  @Patch(':id/status')
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const userId = req.user.userId;
    const data = await this.orderService.updateStatus(
      userId,
      id,
      updateOrderStatusDto,
    );
    return {
      success: true,
      data,
      message: 'Order status updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /api/orders/:id/cancel
   *
   * Marks an order as cancelled when business rules allow it.
   */
  @Patch(':id/cancel')
  async cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user.userId;
    const data = await this.orderService.cancel(userId, id);
    return {
      success: true,
      data,
      message: 'Order cancelled successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
