export type PurchaseEventPayload = {
  currency: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaPurchase(payload: PurchaseEventPayload) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  window.fbq("track", "Purchase", {
    currency: payload.currency,
    value: Number(payload.total.toFixed(2)),
    contents: payload.items.map((item) => ({
      id: item.id,
      quantity: item.quantity
    })),
    content_name: payload.items.map((item) => item.name).join(", "),
    content_type: "product",
    num_items: payload.items.reduce((sum, item) => sum + item.quantity, 0)
  });
}
