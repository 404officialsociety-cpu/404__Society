import { hmacB64 } from './util.js';
export const cfBase = env => env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
export const cfHeaders = env => ({
  'content-type': 'application/json',
  'x-client-id': env.CASHFREE_APP_ID,
  'x-client-secret': env.CASHFREE_SECRET_KEY,
  'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01'
});
export async function cfGetOrder(env, id) {
  const r = await fetch(`${cfBase(env)}/orders/${encodeURIComponent(id)}`, { headers: cfHeaders(env) });
  if (!r.ok) throw new Error('cashfree_lookup_failed');
  return r.json();
}
// Server-side verification: asks Cashfree directly, never trusts the browser.
export async function settle(env, id, failedHint = false) {
  const raw = await env.ORDERS.get('order:' + id);
  if (!raw) return null;
  const o = JSON.parse(raw);
  if (['PAID', 'REFUNDED', 'CANCELLED'].includes(o.orderStatus)) return o;
  const cf = await cfGetOrder(env, id);
  if (cf.order_status === 'PAID' && Math.round(Number(cf.order_amount) * 100) === Math.round(o.total * 100)) {
    o.paymentStatus = 'PAID'; o.orderStatus = 'PAID';
  } else if (['EXPIRED', 'TERMINATED', 'TERMINATION_REQUESTED'].includes(cf.order_status) || failedHint) {
    o.paymentStatus = 'PAYMENT_FAILED'; o.orderStatus = 'PAYMENT_FAILED';
  } else return o;
  o.updatedAt = new Date().toISOString();
  await env.ORDERS.put('order:' + id, JSON.stringify(o));
  return o;
}
export { hmacB64 };
