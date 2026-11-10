import { ApiError, ApiOrder, request, requestKey } from './api';
import { readLocal, saveLocal } from './storage';

export interface OrderPayload {
  orderType: 'online' | 'counter'; expectedTotal: number;
  items: { foodId: number; quantity: number }[];
  pickupAt?: string; note?: string; paymentMethod?: 'cash'; requestKey?: string;
}
export interface PendingOrder { payload: OrderPayload; result?: { order: ApiOrder } }
const journalKey = (owner: number, type: string) => `order:${owner}:${type}`;
export const pendingOrder = (owner: number, type: string) => readLocal<PendingOrder>(journalKey(owner, type));
export const acknowledgeOrder = (owner: number, type: string) => saveLocal(journalKey(owner, type), null);
const running = new Map<string, Promise<{ order: ApiOrder }>>();

// A persisted payload is always retried verbatim, including after restart or a 401.
export function submitOrder(owner: number, token: string, payload: OrderPayload): Promise<{ order: ApiOrder }> {
  const key = journalKey(owner, payload.orderType);
  if (running.has(key)) return running.get(key)!;
  const run = async () => {
    let pending = await pendingOrder(owner, payload.orderType);
    if (!pending) {
      pending = { payload: { ...payload, requestKey: requestKey() } };
      await saveLocal(key, pending); // Never send unless recovery data is durable.
    }
    if (pending.result) return pending.result;
    try {
      const result = await request<{ order: ApiOrder }>('/api/orders', token, { method: 'POST', body: JSON.stringify(pending.payload) });
      await saveLocal(key, { ...pending, result });
      return result;
    } catch (error) {
      // Only definitive validation/transaction rejection permits a new checkout.
      if (error instanceof ApiError && [400, 409].includes(error.status)) await saveLocal(key, null);
      throw error;
    }
  };
  const promise = run().finally(() => running.delete(key));
  running.set(key, promise);
  return promise;
}
