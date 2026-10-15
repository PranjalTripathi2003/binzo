import { OrderController } from './order.controller';

describe('Razorpay webhook signature validation', () => {
  it('rejects an invalid signature before processing the event', async () => {
    const orderService = { processPaymentEvent: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue('webhook-secret') };
    const controller = new OrderController(orderService as never, configService as never);
    const rawBody = Buffer.from('{"event":"payment.captured"}');

    await expect(controller.razorpayWebhook(
      { body: { event: 'payment.captured' }, rawBody },
      '00'.repeat(32),
      'evt-1',
    )).rejects.toThrow('Invalid webhook signature');
    expect(orderService.processPaymentEvent).not.toHaveBeenCalled();
  });
});
