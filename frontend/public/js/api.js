/**
 * OpenClaw API Client
 */

const API_BASE = '/api';

const Api = {
  /**
   * Scan a wallet address
   */
  async scanWallet(address) {
    const res = await fetch(`${API_BASE}/wallet/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Scan failed');
    return data;
  },

  /**
   * Get AI analysis of a wallet
   */
  async analyzeWallet(walletData, analysis, question) {
    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletData, analysis, question }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI request failed');
    return data.response;
  },

  /**
   * Multi-turn AI chat
   */
  async chat(messages, walletData, analysis) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, walletData, analysis }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Chat failed');
    return data.response;
  },

  /**
   * Get market prices
   */
  async getMarket() {
    const res = await fetch(`${API_BASE}/prices/market`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.prices;
  },

  /**
   * Health check
   */
  async health() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return null;
    }
  },
};
