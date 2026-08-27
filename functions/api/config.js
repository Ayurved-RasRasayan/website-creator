/**
 * Cloudflare Pages Function - /api/config
 * Serves site configuration from environment variables ONLY.
 * ALL values come from wrangler.toml [vars] or Cloudflare Dashboard.
 * No hardcoded fallbacks - env vars are the single source of truth.
 *
 * The USD -> NPR exchange rate is fetched live from open.er-api.com
 * (free, no API key, updates daily) and cached at the edge for 1 hour.
 * If the live fetch fails, it falls back to EXCHANGE_RATE_TO_NPR env var.
 */

async function getLiveExchangeRate(fallbackRate) {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      // Cache the upstream response at Cloudflare's edge for 1 hour
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!res.ok) return fallbackRate;

    const data = await res.json();
    const rate = data?.rates?.NPR;
    if (typeof rate === 'number' && rate > 0) {
      return rate;
    }
    return fallbackRate;
  } catch (e) {
    return fallbackRate;
  }
}

export async function onRequest(context) {
  const { env } = context;

  const fallbackRate = parseFloat(env.EXCHANGE_RATE_TO_NPR) || 133.50;
  const liveRate = await getLiveExchangeRate(fallbackRate);

  const config = {
    siteName: env.SITE_NAME || "",
    tagline: env.SITE_TAGLINE || "",
    copyright: env.SITE_COPYRIGHT || `\u00a9 ${new Date().getFullYear()}. All rights reserved.`,
    contact: {
      email: env.CONTACT_EMAIL || "",
      phone: env.CONTACT_PHONE || "",
      city: env.ADDRESS_CITY || "",
      province: env.ADDRESS_PROVINCE || "",
      country: env.ADDRESS_COUNTRY || "",
    },
    currency: {
      default: env.DEFAULT_CURRENCY || "USD",
      exchangeRateToNPR: liveRate,
    },
  };

  return new Response(JSON.stringify(config), {
    headers: {
      "Content-Type": "application/json",
      // Short edge cache so the displayed rate stays fresh throughout the day
      "Cache-Control": "public, max-age=300",
      // Intentionally left as '*' (unlike the other API functions): this
      // endpoint only returns public, non-sensitive site info (name,
      // contact details, exchange rate), so allowing any origin to read
      // it is not a security concern. See functions/_lib/cors.js for the
      // restricted helper used by the auth/inquiry/blog endpoints.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
