import { HttpException } from '@nestjs/common';
import { OrderService } from './order.service';

describe('OrderService checkout and payment safety', () => {
  const rpc = jest.fn();
  const from = jest.fn();
  const client = { rpc, from };
  const service = new OrderService({ getClient: () => client } as never);

  beforeEach(() => jest.clearAllMocks());

  it('delegates checkout to the atomic database transaction', async () => {
    const order = { id: 'order-1' };
    rpc.mockResolvedValue({ data: order, error: null });
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: order, error: null }),
    };
    from.mockReturnValue(query);
    await service.create('user-1', {});
    expect(rpc).toHaveBeenCalledWith('checkout_order', {
      p_user_id: 'user-1', p_address_id: null, p_delivery_eta_minutes: 15,
    });
  });

  it('rejects checkout when the database reports an empty cart or insufficient stock', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Insufficient stock' } });
    await expect(service.create('user-1', {})).rejects.toBeInstanceOf(HttpException);
  });

  it('delegates verified payment events to the idempotent database operation', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(service.processPaymentEvent('evt-1', 'order-1', 'payment.captured')).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith('process_razorpay_payment', {
      p_event_id: 'evt-1', p_order_id: 'order-1', p_signature_valid: true, p_event_type: 'payment.captured',
    });
  });

  it('rejects duplicate payment events without confirming twice', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(service.processPaymentEvent('evt-1', 'order-1', 'payment.captured')).resolves.toBe(false);
  });

  it('rejects invalid order transitions from delivered back to placed', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'order-1', status: 'delivered' });
    await expect(service.updateStatus('user-1', 'order-1', { status: 'pending' }))
      .rejects.toBeInstanceOf(HttpException);
  });

  it('rejects cancellation of a delivered order', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'order-1', status: 'delivered' });
    await expect(service.cancel('user-1', 'order-1')).rejects.toBeInstanceOf(HttpException);
  });
});
