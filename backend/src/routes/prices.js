const express = require('express');
const router = express.Router();
const { getMarketOverview, getPrices } = require('../services/coingecko');

/**
 * GET /api/prices/market
 * Returns BNB + top crypto market overview
 */
router.get('/market', async (req, res) => {
  try {
    const data = await getMarketOverview();
    res.json({ success: true, prices: data });
  } catch (err) {
    res.status(500).json({ error: 'Price fetch failed.', detail: err.message });
  }
});

/**
 * GET /api/prices/:ids
 * ids = comma-separated coingecko IDs
 */
router.get('/:ids', async (req, res) => {
  const ids = req.params.ids.split(',').slice(0, 20); // max 20
  try {
    const data = await getPrices(ids);
    res.json({ success: true, prices: data });
  } catch (err) {
    res.status(500).json({ error: 'Price fetch failed.', detail: err.message });
  }
});

module.exports = router;
