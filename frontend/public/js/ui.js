/**
 * OpenClaw UI Renderer
 * Pure DOM manipulation — no framework needed
 */

const TOKEN_COLORS = {
  BNB:   { color: '#f0b90b', bg: 'rgba(240,185,11,0.12)' },
  USDT:  { color: '#26a17b', bg: 'rgba(38,161,123,0.12)' },
  USDC:  { color: '#2775ca', bg: 'rgba(39,117,202,0.12)' },
  BUSD:  { color: '#f0b90b', bg: 'rgba(240,185,11,0.10)' },
  CAKE:  { color: '#d1884f', bg: 'rgba(209,136,79,0.12)' },
  ETH:   { color: '#627eea', bg: 'rgba(98,126,234,0.12)' },
  DOT:   { color: '#e6007a', bg: 'rgba(230,0,122,0.12)'  },
  MATIC: { color: '#8247e5', bg: 'rgba(130,71,229,0.12)' },
  SOL:   { color: '#9945ff', bg: 'rgba(153,69,255,0.12)' },
  AVAX:  { color: '#e84142', bg: 'rgba(232,65,66,0.12)'  },
  LINK:  { color: '#375bd2', bg: 'rgba(55,91,210,0.12)'  },
  SHIB:  { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)' },
};

function getTokenStyle(symbol) {
  return TOKEN_COLORS[symbol] || { color: '#4a7a8a', bg: 'rgba(74,122,138,0.10)' };
}

function fmt(n, decimals = 2) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtUsd(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return '$' + fmt(n / 1000000, 2) + 'M';
  if (n >= 1000) return '$' + fmt(n, 2);
  return '$' + fmt(n, 2);
}

function timeAgo(iso) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function shortHash(hash) {
  return hash ? hash.slice(0, 8) + '…' + hash.slice(-6) : '—';
}

const UI = {

  showError(msg) {
    const el = document.getElementById('errorBanner');
    if (!el) return;
    el.textContent = '⚠ ' + msg;
    el.classList.remove('hidden');
    setTimeout(() => {
      if (el) el.classList.add('hidden');
    }, 6000);
  },

  hideError() {
    const el = document.getElementById('errorBanner');
    if (el) el.classList.add('hidden');
  },

  setScanLoading(loading) {
    const btn = document.getElementById('scanBtn');
    const txt = document.getElementById('scanBtnText');
    if (!btn || !txt) return;
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
    txt.textContent = loading ? 'SCANNING...' : 'SCAN WALLET';
  },

  setStatusDot(status) {
    const dot = document.getElementById('statusDot');
    if (!dot) return;
    dot.className = 'status-dot';
    if (status === 'error') dot.classList.add('error');
  },

  updateMarketTicker(prices) {
    if (!prices) return;
    function setPrice(id, cgId, label) {
      const el = document.getElementById(id);
      if (!el || !prices[cgId]) return;
      const p = prices[cgId].usd;
      const ch = prices[cgId].usd_24h_change || 0;
      el.textContent = '$' + fmt(p, p > 100 ? 0 : 2);
      el.className = 'price ' + (ch >= 0 ? 'up' : 'down');
    }
    setPrice('bnbPrice', 'binancecoin');
    setPrice('btcPrice', 'bitcoin');
    setPrice('ethPrice', 'ethereum');
  },

  renderHoldings(wallet) {
    const list = document.getElementById('holdingsList');
    const empty = document.getElementById('holdingsEmpty');
    const count = document.getElementById('holdingsCount');
    
    if (!list || !empty || !count) return;

    const rows = [];

    // BNB first
    if (wallet.bnbBalance > 0) {
      const style = getTokenStyle('BNB');
      const ch = wallet.bnbChange24h || 0;
      rows.push(`
        <div class="holding-row bnb-row">
          <div class="token-icon" style="background:${style.bg};color:${style.color};border-color:${style.color}44">BNB</div>
          <div class="token-info">
            <div class="token-symbol">BNB</div>
            <div class="token-balance">${fmt(wallet.bnbBalance, 4)} BNB</div>
          </div>
          <div>
            <div class="token-usd">${fmtUsd(wallet.bnbUsd)}</div>
            <div class="token-change ${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '+' : ''}${fmt(ch, 2)}%</div>
          </div>
        </div>
      `);
    }

    for (const t of wallet.tokenHoldings || []) {
      const style = getTokenStyle(t.symbol);
      const ch = t.change24h || 0;
      rows.push(`
        <div class="holding-row">
          <div class="token-icon" style="background:${style.bg};color:${style.color};border-color:${style.color}44">${t.symbol.slice(0,3)}</div>
          <div class="token-info">
            <div class="token-symbol">${t.symbol}</div>
            <div class="token-balance">${fmt(t.balance, 4)} ${t.symbol}</div>
          </div>
          <div>
            <div class="token-usd">${fmtUsd(t.usdValue)}</div>
            <div class="token-change ${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '+' : ''}${fmt(ch, 2)}%</div>
          </div>
        </div>
      `);
    }

    if (rows.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      count.textContent = '0 tokens';
    } else {
      empty.classList.add('hidden');
      list.innerHTML = rows.join('');
      count.textContent = rows.length + ' tokens';
    }
  },

  renderStats(wallet) {
    const total = document.getElementById('statTotal');
    const bnb = document.getElementById('statBnb');
    const tokens = document.getElementById('statTokens');
    const txs = document.getElementById('statTxs');
    const lastScan = document.getElementById('lastScan');
    
    if (total) total.textContent = fmtUsd(wallet.totalUsd);
    if (bnb) bnb.textContent = fmt(wallet.bnbBalance, 4) + ' BNB';
    if (tokens) tokens.textContent = (wallet.tokenHoldings?.length || 0) + '';
    if (txs) txs.textContent = (wallet.txCount || 0).toLocaleString();
    if (lastScan) lastScan.textContent = 'last scan: ' + new Date(wallet.scannedAt).toLocaleTimeString();
  },

  renderRisk(analysis) {
    const risk = analysis.risk;
    const badge = document.getElementById('riskBadge');
    const fill  = document.getElementById('riskBarFill');
    const score = document.getElementById('riskScore');
    const breakdown = document.getElementById('riskBreakdown');
    const flags = document.getElementById('flagsList');
    
    if (!badge || !fill || !score || !breakdown || !flags) return;

    badge.textContent = risk.level;
    badge.className = 'risk-badge ' + risk.level.toLowerCase();
    badge.classList.remove('hidden');

    const color = risk.level === 'LOW' ? '#00ff88' : risk.level === 'MEDIUM' ? '#ffaa00' : '#ff3355';
    fill.style.width = risk.score + '%';
    fill.style.background = color;
    score.textContent = risk.score + '/100';

    // Breakdown pills
    const bd = analysis.breakdown || {};
    breakdown.innerHTML = [
      bd.bnb > 0       ? `<span class="breakdown-pill">BNB ${bd.bnb}%</span>` : '',
      bd.stablecoins > 0 ? `<span class="breakdown-pill">Stables ${bd.stablecoins}%</span>` : '',
      bd.defi > 0      ? `<span class="breakdown-pill">DeFi ${bd.defi}%</span>` : '',
      bd.other > 0     ? `<span class="breakdown-pill">Other ${bd.other}%</span>` : '',
    ].join('');

    // Flags
    flags.innerHTML = (analysis.flags || [])
      .map(f => `<div class="flag-item">⚠ ${f}</div>`)
      .join('');
  },

  renderTxs(txs) {
    const list = document.getElementById('txList');
    if (!list) return;
    if (!txs || txs.length === 0) {
      list.innerHTML = '<div class="empty-state small"><p>No transactions found</p></div>';
      return;
    }
    list.innerHTML = txs.map(tx => `
      <div class="tx-row">
        <div class="tx-dot ${tx.status}"></div>
        <div class="tx-hash">
          <a href="https://bscscan.com/tx/${tx.hash}" target="_blank" rel="noopener">${shortHash(tx.hash)}</a>
        </div>
        <div class="tx-val">${fmt(tx.value, 4)} BNB</div>
        <div class="tx-time">${timeAgo(tx.timestamp)}</div>
      </div>
    `).join('');
  },

  addChatMsg(text, role, label) {
    const chat = document.getElementById('chatMessages');
    if (!chat) return null;
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if (role === 'ai') {
      div.innerHTML = `<div class="msg-label">${label || 'OPENCLAW'}</div><div class="msg-text">${text}</div>`;
    } else {
      div.innerHTML = `<div class="msg-text">${text}</div>`;
    }
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  },

  addLoadingMsg() {
    const div = this.addChatMsg('', 'ai loading', 'OPENCLAW · THINKING');
    return div;
  },

  updateMsgText(div, text) {
    if (!div) return;
    const el = div.querySelector('.msg-text');
    if (el) el.textContent = text;
    if (div.classList) div.classList.remove('loading');
    const chat = document.getElementById('chatMessages');
    if (chat) chat.scrollTop = 99999;
  },
};
