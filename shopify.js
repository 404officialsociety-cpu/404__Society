export async function shopify(env, query, variables = {}) {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) throw new Error('shopify_not_configured');
  const v = env.SHOPIFY_API_VERSION || '2025-07';
  const r = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/${v}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_ACCESS_TOKEN },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error('shopify_error');
  return j.data;
}
