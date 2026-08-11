export const MIN_DELIVERY_MINUTES = 5;
export const MAX_DELIVERY_MINUTES = 30;
export const DEFAULT_DELIVERY_MINUTES = 15;

const DELIVERY_MINUTES_KEY = "delivery_minutes";

export type TimedOrder = {
  status: string;
  created_at: string;
  delivery_eta_minutes?: number | string | null;
};

export type DeliveryTimeline = {
  promisedMinutes: number;
  remainingMinutes: number;
  progress: number;
  computedStatus: "pending" | "preparing" | "packed" | "out_for_delivery" | "success" | "cancelled";
  canCancel: boolean;
};

const clampDeliveryMinutes = (minutes: number) =>
  Math.min(MAX_DELIVERY_MINUTES, Math.max(MIN_DELIVERY_MINUTES, minutes));

export function getStoredDeliveryMinutes(): number {
  const storedMinutes = sessionStorage.getItem(DELIVERY_MINUTES_KEY);
  if (storedMinutes) {
    const parsed = Number(storedMinutes);
    if (Number.isFinite(parsed)) {
      return clampDeliveryMinutes(parsed);
    }
  }

  const minutes =
    Math.floor(
      Math.random() * (MAX_DELIVERY_MINUTES - MIN_DELIVERY_MINUTES + 1),
    ) + MIN_DELIVERY_MINUTES;
  sessionStorage.setItem(DELIVERY_MINUTES_KEY, String(minutes));
  return minutes;
}

export function getOrderDeliveryTimeline(
  order: TimedOrder,
  now = Date.now(),
): DeliveryTimeline {
  const promisedMinutes = clampDeliveryMinutes(
    Number(order.delivery_eta_minutes ?? DEFAULT_DELIVERY_MINUTES),
  );
  const createdAt = new Date(order.created_at).getTime();
  const elapsedMs = Math.max(0, now - createdAt);
  // Demo timing: the UI displays minutes, but each displayed minute ticks down
  // once per second so orders complete quickly during local testing.
  const totalMs = promisedMinutes * 1_000;
  const progress = Math.min(1, elapsedMs / totalMs);
  const remainingMinutes = Math.max(1, Math.ceil((totalMs - elapsedMs) / 1_000));

  if (order.status === "cancelled") {
    return {
      promisedMinutes,
      remainingMinutes,
      progress,
      computedStatus: "cancelled",
      canCancel: false,
    };
  }

  if (order.status === "success" || order.status === "delivered" || progress >= 1) {
    return {
      promisedMinutes,
      remainingMinutes: 1,
      progress: 1,
      computedStatus: "success",
      canCancel: false,
    };
  }

  if (order.status === "out_for_delivery" || progress >= 0.6) {
    return {
      promisedMinutes,
      remainingMinutes,
      progress,
      computedStatus: "out_for_delivery",
      canCancel: false,
    };
  }

  if (order.status === "packed" || progress >= 0.4) {
    return {
      promisedMinutes,
      remainingMinutes,
      progress,
      computedStatus: "packed",
      canCancel: false,
    };
  }

  if (order.status === "preparing" || progress >= 0.2) {
    return {
      promisedMinutes,
      remainingMinutes,
      progress,
      computedStatus: "preparing",
      canCancel: true,
    };
  }

  return {
    promisedMinutes,
    remainingMinutes,
    progress,
    computedStatus: "pending",
    canCancel: true,
  };
}
