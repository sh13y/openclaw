const axios = require('axios');

// Etherscan API V2 - BSC uses chainID 56
const ETHERSCAN_API = 'https://api.etherscan.io/api';
const CHAIN_ID = '56'; // BNB Smart Chain
const KEY = process.env.BSCSCAN_API_KEY || 'YourApiKeyToken';

// Known token metadata for display (symbol → coingecko id)
const TOKEN_META = {
  BNB:   { id: 'binancecoin',    color: '#f0b90b' },
  USDT:  { id: 'tether',         color: '#26a17b' },
  USDC:  { id: 'usd-coin',       color: '#2775ca' },
  BUSD:  { id: 'binance-usd',    color: '#f0b90b' },
  CAKE:  { id: 'pancakeswap-token', color: '#d1884f' },
  ETH:   { id: 'ethereum',       color: '#627eea' },
  DOT:   { id: 'polkadot',       color: '#e6007a' },
  ADA:   { id: 'cardano',        color: '#0033ad' },
  XRP:   { id: 'ripple',         color: '#00aae4' },
  DOGE:  { id: 'dogecoin',       color: '#c2a633' },
  SHIB:  { id: 'shiba-inu',      color: '#ff6b35' },
  LINK:  { id: 'chainlink',      color: '#375bd2' },
  MATIC: { id: 'matic-network',  color: '#8247e5' },
  SOL:   { id: 'solana',         color: '#9945ff' },
  AVAX:  { id: 'avalanche-2',    color: '#e84142' },
};

/**
 * Fetch BNB balance for a wallet
 */
async function getBnbBalance(address) {
  const { data } = await axios.get(ETHERSCAN_API, {
    params: {
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
      chainid: CHAIN_ID,
      apikey: KEY,
    },
    timeout: 8000,
  });
  if (data.status !== '1') throw new Error(data.message || 'Etherscan API error');
  return parseFloat(data.result) / 1e18;
}

/**
 * Fetch BEP-20 token balances for a wallet
 */
async function getTokenBalances(address) {
  const { data } = await axios.get(ETHERSCAN_API, {
    params: {
      module: 'account',
      action: 'tokentx',
      address,
      startblock: 0,
      endblock: 99999999,
      sort: 'desc',
      chainid: CHAIN_ID,
      apikey: KEY,
    },
    timeout: 10000,
  });

  if (data.status !== '1') return [];

  // Deduplicate tokens, keep latest balance signal per contract
  const seen = new Map();
  for (const tx of data.result) {
    if (!seen.has(tx.contractAddress)) {
      seen.set(tx.contractAddress, {
        contractAddress: tx.contractAddress,
        symbol: tx.tokenSymbol,
        name: tx.tokenName,
        decimals: parseInt(tx.tokenDecimal),
      });
    }
  }
  return [...seen.values()];
}

/**
 * Fetch actual token balance for a specific contract
 */
async function getTokenBalance(address, contractAddress, decimals) {
  const { data } = await axios.get(ETHERSCAN_API, {
    params: {
      module: 'account',
      action: 'tokenbalance',
      contractaddress: contractAddress,
      address,
      tag: 'latest',
      chainid: CHAIN_ID,
      apikey: KEY,
    },
    timeout: 6000,
  });
  if (data.status !== '1') return 0;
  return parseFloat(data.result) / Math.pow(10, decimals);
}

/**
 * Get transaction count (nonce) — signals wallet activity
 */
async function getTxCount(address) {
  const { data } = await axios.get(ETHERSCAN_API, {
    params: {
      module: 'proxy',
      action: 'eth_getTransactionCount',
      address,
      tag: 'latest',
      chainid: CHAIN_ID,
      apikey: KEY,
    },
    timeout: 6000,
  });
  return parseInt(data.result, 16) || 0;
}

/**
 * Get recent transactions (last 10)
 */
async function getRecentTxs(address) {
  const { data } = await axios.get(ETHERSCAN_API, {
    params: {
      module: 'account',
      action: 'txlist',
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 10,
      sort: 'desc',
      chainid: CHAIN_ID,
      apikey: KEY,
    },
    timeout: 8000,
  });
  if (data.status !== '1') return [];
  return data.result.map(tx => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: parseFloat(tx.value) / 1e18,
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    status: tx.txreceipt_status === '1' ? 'success' : 'fail',
    gasUsed: parseInt(tx.gasUsed),
  }));
}

/**
 * Main wallet scan — assembles full wallet data
 */
async function scanWallet(address) {
  // Run BNB balance + token list + tx count in parallel
  const [bnbBalance, tokenList, txCount, recentTxs] = await Promise.allSettled([
    getBnbBalance(address),
    getTokenBalances(address),
    getTxCount(address),
    getRecentTxs(address),
  ]);

  const bnb = bnbBalance.status === 'fulfilled' ? bnbBalance.value : 0;
  const tokens = tokenList.status === 'fulfilled' ? tokenList.value : [];
  const nonce = txCount.status === 'fulfilled' ? txCount.value : 0;
  const txs = recentTxs.status === 'fulfilled' ? recentTxs.value : [];

  // Fetch balances for top 10 tokens (limit API calls)
  const topTokens = tokens.slice(0, 10);
  const balanceResults = await Promise.allSettled(
    topTokens.map(t => getTokenBalance(address, t.contractAddress, t.decimals))
  );

  const tokenHoldings = topTokens
    .map((t, i) => ({
      symbol: t.symbol,
      name: t.name,
      contractAddress: t.contractAddress,
      balance: balanceResults[i].status === 'fulfilled' ? balanceResults[i].value : 0,
      meta: TOKEN_META[t.symbol] || { id: t.symbol.toLowerCase(), color: '#888' },
    }))
    .filter(t => t.balance > 0);

  return {
    address,
    bnbBalance: bnb,
    tokenHoldings,
    txCount: nonce,
    recentTxs: txs,
    scannedAt: new Date().toISOString(),
  };
}

module.exports = { scanWallet, TOKEN_META };
