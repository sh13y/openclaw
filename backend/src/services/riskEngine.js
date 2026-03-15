/**
 * OpenClaw Risk Engine
 * Scores a wallet's risk based on on-chain data
 */

/**
 * Calculate diversification score (0-100)
 * High score = well diversified
 */
function diversificationScore(holdings) {
  if (!holdings || holdings.length === 0) return 0;
  const total = holdings.reduce((s, h) => s + (h.usdValue || 0), 0);
  if (total === 0) return 0;

  // Herfindahl-Hirschman Index (concentration measure)
  const hhi = holdings.reduce((s, h) => {
    const share = (h.usdValue || 0) / total;
    return s + share * share;
  }, 0);

  // 1/hhi normalized: 1 = full concentration, 1/n = perfectly even
  return Math.round((1 - hhi) * 100);
}

/**
 * Detect concentration risk
 */
function concentrationRisk(holdings, bnbUsd, totalUsd) {
  const risks = [];
  if (totalUsd === 0) return risks;

  const bnbShare = bnbUsd / totalUsd;
  if (bnbShare > 0.7) risks.push({ type: 'concentration', asset: 'BNB', share: Math.round(bnbShare * 100) });

  for (const h of holdings) {
    const share = h.usdValue / totalUsd;
    if (share > 0.5 && h.symbol !== 'USDT' && h.symbol !== 'USDC' && h.symbol !== 'BUSD') {
      risks.push({ type: 'concentration', asset: h.symbol, share: Math.round(share * 100) });
    }
  }
  return risks;
}

/**
 * Detect stablecoin ratio (higher = safer / less upside)
 */
function stablecoinAnalysis(holdings, totalUsd) {
  const stables = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FRAX'];
  const stableUsd = holdings
    .filter(h => stables.includes(h.symbol))
    .reduce((s, h) => s + (h.usdValue || 0), 0);
  return {
    stableUsd,
    stableRatio: totalUsd > 0 ? Math.round((stableUsd / totalUsd) * 100) : 0,
  };
}

/**
 * Flag suspicious patterns
 */
function suspiciousFlags(txCount, totalUsd, holdings) {
  const flags = [];
  if (txCount === 0 && totalUsd > 100) flags.push('Wallet has funds but zero transactions — possible fresh wallet or sweeper target.');
  if (totalUsd > 50000 && txCount < 5) flags.push('Large balance with very few transactions — unusual activity pattern.');
  const memeTokens = holdings.filter(h => ['SHIB', 'DOGE', 'PEPE', 'FLOKI', 'BONK'].includes(h.symbol));
  if (memeTokens.length > 2) flags.push(`High meme token exposure: ${memeTokens.map(t => t.symbol).join(', ')}.`);
  return flags;
}

/**
 * Overall risk level
 */
function overallRisk(divScore, concentrationRisks, stableRatio, totalUsd) {
  let score = 50; // baseline

  // Diversification — good = lower risk
  score -= (divScore - 50) * 0.3;

  // Concentration — bad
  score += concentrationRisks.length * 15;

  // Too many stables = low risk (but also low growth)
  if (stableRatio > 80) score -= 20;
  if (stableRatio < 10 && totalUsd > 1000) score += 10;

  // Low total value = relatively lower risk
  if (totalUsd < 500) score -= 10;
  if (totalUsd > 100000) score += 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score < 30) return { score, level: 'LOW', label: '🟢 Low Risk' };
  if (score < 60) return { score, level: 'MEDIUM', label: '🟡 Medium Risk' };
  return { score, level: 'HIGH', label: '🔴 High Risk' };
}

/**
 * Main function: analyze full wallet
 */
function analyzeWallet({ bnbBalance, bnbUsd, tokenHoldings, totalUsd, txCount }) {
  const allHoldings = [
    { symbol: 'BNB', usdValue: bnbUsd },
    ...tokenHoldings,
  ];

  const divScore = diversificationScore(allHoldings);
  const concRisks = concentrationRisk(tokenHoldings, bnbUsd, totalUsd);
  const { stableUsd, stableRatio } = stablecoinAnalysis(tokenHoldings, totalUsd);
  const flags = suspiciousFlags(txCount || 0, totalUsd, tokenHoldings);
  const risk = overallRisk(divScore, concRisks, stableRatio, totalUsd);

  // Portfolio breakdown by category
  const stables = ['USDT', 'USDC', 'BUSD', 'DAI'];
  const defi = ['CAKE', 'UNI', 'SUSHI', 'AAVE', 'COMP'];
  const meme = ['SHIB', 'DOGE', 'PEPE', 'FLOKI'];

  const breakdown = {
    bnb: Math.round((bnbUsd / totalUsd) * 100) || 0,
    stablecoins: stableRatio,
    defi: Math.round((tokenHoldings.filter(h => defi.includes(h.symbol)).reduce((s, h) => s + h.usdValue, 0) / totalUsd) * 100) || 0,
    other: 0,
  };
  breakdown.other = Math.max(0, 100 - breakdown.bnb - breakdown.stablecoins - breakdown.defi);

  return {
    risk,
    diversificationScore: divScore,
    concentrationRisks: concRisks,
    stableRatio,
    stableUsd,
    flags,
    breakdown,
    insights: generateInsights(risk, divScore, stableRatio, concRisks, totalUsd),
  };
}

function generateInsights(risk, divScore, stableRatio, concRisks, totalUsd) {
  const insights = [];
  if (divScore > 70) insights.push('Well diversified portfolio across multiple assets.');
  else if (divScore < 30) insights.push('Portfolio heavily concentrated in 1-2 assets.');
  if (stableRatio > 50) insights.push('Over half the portfolio is in stablecoins — low volatility but limited upside.');
  if (stableRatio < 5 && totalUsd > 500) insights.push('Minimal stablecoin buffer — consider holding some USDT/USDC for stability.');
  if (concRisks.length > 0) insights.push(`High concentration in: ${concRisks.map(r => r.asset).join(', ')}.`);
  if (totalUsd > 10000) insights.push('Significant portfolio value — consider hardware wallet storage.');
  return insights;
}

module.exports = { analyzeWallet };
