const express = require('express');
const router = express.Router();
const { scanWallet } = require('../services/bscscan');
const { enrichWithPrices } = require('../services/coingecko');
const { analyzeWallet } = require('../services/riskEngine');

/**
 * Validate a BSC/ETH wallet address
 */
function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * POST /api/wallet/scan
 * Body: { address: "0x..." }
 * Returns: full wallet data + prices + risk analysis
 */
router.post('/scan', async (req, res) => {
  const { address } = req.body;

  if (!address) return res.status(400).json({ error: 'Wallet address is required.' });
  if (!isValidAddress(address)) return res.status(400).json({ error: 'Invalid wallet address format. Must be 0x + 40 hex chars.' });
  if (!process.env.BSCSCAN_API_KEY || process.env.BSCSCAN_API_KEY === 'your-bscscan-key-here') {
    return res.status(503).json({ error: 'BscScan API key not configured. Add BSCSCAN_API_KEY to .env' });
  }

  try {
    console.log(`[SCAN] ${address}`);

    // Step 1: Get raw on-chain data
    const rawData = await scanWallet(address);

    // Step 2: Enrich with live prices
    const priced = await enrichWithPrices(rawData.bnbBalance, rawData.tokenHoldings);

    // Step 3: Risk analysis
    const analysis = analyzeWallet({
      bnbBalance: priced.bnbBalance,
      bnbUsd: priced.bnbUsd,
      tokenHoldings: priced.tokenHoldings,
      totalUsd: priced.totalUsd,
      txCount: rawData.txCount,
    });

    res.json({
      success: true,
      address,
      wallet: {
        bnbBalance: priced.bnbBalance,
        bnbPrice: priced.bnbPrice,
        bnbUsd: priced.bnbUsd,
        bnbChange24h: priced.bnbChange24h,
        tokenHoldings: priced.tokenHoldings,
        totalUsd: priced.totalUsd,
        txCount: rawData.txCount,
        recentTxs: rawData.recentTxs,
        scannedAt: rawData.scannedAt,
      },
      analysis,
    });

  } catch (err) {
    console.error('[SCAN ERROR]', err.message);
    if (err.message.includes('NOTOK') || err.message.includes('Invalid')) {
      return res.status(400).json({ error: 'Invalid wallet or BscScan API error.', detail: err.message });
    }
    res.status(500).json({ error: 'Scan failed.', detail: err.message });
  }
});

/**
 * GET /api/wallet/validate/:address
 * Quick address validation check
 */
router.get('/validate/:address', (req, res) => {
  const { address } = req.params;
  res.json({ valid: isValidAddress(address), address });
});

module.exports = router;
