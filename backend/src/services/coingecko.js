const axios = require('axios');

const BASE = 'https://api.coingecko.com/api/v3';
const HEADERS = process.env.COINGECKO_API_KEY
  ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
  : {};

// In-memory price cache (60s TTL)
const cache = new Map();
const CACHE_TTL = 60 * 1000;

function cached(key, fn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return Promise.resolve(entry.data);
  return fn().then(data => { cache.set(key, { data, ts: Date.now() }); return data; });
}

/**
 * Get prices + 24h change for a list of coingecko IDs
 * Returns: { [id]: { usd, usd_24h_change } }
 */
async function getPrices(ids) {
  if (!ids || ids.length === 0) return {};
  const key = ids.sort().join(',');
  return cached(`prices:${key}`, async () => {
    const { data } = await axios.get(`${BASE}/simple/price`, {
      params: { ids: key, vs_currencies: 'usd', include_24hr_change: true },
      headers: HEADERS,
      timeout: 8000,
    });
    return data;
  });
}

/**
 * Get BNB price specifically
 */
async function getBnbPrice() {
  const data = await getPrices(['binancecoin']);
  return data?.binancecoin?.usd || 0;
}

/**
 * Enrich wallet holdings with live USD prices
 * tokens: [{ symbol, balance, meta: { id } }]
 */
async function enrichWithPrices(bnbBalance, tokenHoldings) {
  const ids = ['binancecoin', ...tokenHoldings.map(t => t.meta.id)].filter(Boolean);
  const prices = await getPrices(ids).catch(() => ({}));

  const bnbPrice = prices?.binancecoin?.usd || 0;
  const bnbUsd = bnbBalance * bnbPrice;

  const enriched = tokenHoldings.map(t => {
    const priceData = prices[t.meta.id] || {};
    const usdPrice = priceData.usd || 0;
    const change24h = priceData.usd_24h_change || 0;
    return {
      ...t,
      usdPrice,
      usdValue: t.balance * usdPrice,
      change24h: parseFloat(change24h.toFixed(2)),
    };
  }).filter(t => t.usdValue > 0 || t.balance > 0);

  const totalUsd =
    bnbUsd + enriched.reduce((sum, t) => sum + t.usdValue, 0);

  return {
    bnbBalance,
    bnbPrice,
    bnbUsd,
    tokenHoldings: enriched,
    totalUsd,
    bnbChange24h: prices?.binancecoin?.usd_24h_change || 0,
  };
}

/**
 * Top movers / market data for dashboard
 */
async function getMarketOverview() {
  return cached('market:overview', async () => {
    const { data } = await axios.get(`${BASE}/simple/price`, {
      params: {
        ids: 'binancecoin,bitcoin,ethereum,tether,pancakeswap-token',
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
      },
      headers: HEADERS,
      timeout: 8000,
    });
    return data;
  });
}

module.exports = { getPrices, getBnbPrice, enrichWithPrices, getMarketOverview };
