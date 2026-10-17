import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DELIVERY_MINUTES,
  getOrderDeliveryTimeline,
  MAX_DELIVERY_MINUTES,
  MIN_DELIVERY_MINUTES,
} from './delivery';

const createdAt = '2026-10-17T10:00:00.000Z';
const order = (status: string, deliveryEtaMinutes?: number | string | null) => ({
  status,
  created_at: createdAt,
  delivery_eta_minutes: deliveryEtaMinutes,
});
const toMs = (seconds: number) => new Date(createdAt).getTime() + seconds * 1_000;

describe('getOrderDeliveryTimeline', () => {
  it('uses the default ETA and permits cancellation while pending', () => {
    expect(getOrderDeliveryTimeline(order('pending'), toMs(0))).toEqual({
      promisedMinutes: DEFAULT_DELIVERY_MINUTES,
      remainingMinutes: DEFAULT_DELIVERY_MINUTES,
      progress: 0,
      computedStatus: 'pending',
      canCancel: true,
    });
  });

  it.each([
    ['preparing', 3, 'preparing', true],
    ['pending', 6, 'packed', false],
    ['pending', 9, 'out_for_delivery', false],
    ['pending', 15, 'success', false],
  ] as const)(
    'computes %s after %s seconds as %s',
    (status, seconds, computedStatus, canCancel) => {
      const timeline = getOrderDeliveryTimeline(order(status, 15), toMs(seconds));
      expect(timeline.computedStatus).toBe(computedStatus);
      expect(timeline.canCancel).toBe(canCancel);
    },
  );

  it('keeps cancelled orders cancelled and prevents cancellation', () => {
    const timeline = getOrderDeliveryTimeline(order('cancelled', 10), toMs(3));
    expect(timeline.computedStatus).toBe('cancelled');
    expect(timeline.canCancel).toBe(false);
  });

  it('clamps ETA values to the supported minimum and maximum', () => {
    expect(getOrderDeliveryTimeline(order('pending', 1), toMs(0)).promisedMinutes)
      .toBe(MIN_DELIVERY_MINUTES);
    expect(getOrderDeliveryTimeline(order('pending', 90), toMs(0)).promisedMinutes)
      .toBe(MAX_DELIVERY_MINUTES);
  });
});
