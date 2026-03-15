/**
 * OpenClaw App
 * Main application controller
 */

let state = {
  walletData: null,
  analysis: null,
  chatHistory: [],
};

// ── Init ──────────────────────────────────────

async function init() {
  // Check backend health
  const health = await Api.health();
  if (!health) {
    UI.showError('Cannot connect to backend. Make sure the server is running on port 3001.');
    UI.setStatusDot('error');
    return;
  }

  // Load market prices
  try {
    const prices = await Api.getMarket();
    UI.updateMarketTicker(prices);
  } catch {}

  // Refresh prices every 60s
  setInterval(async () => {
    try {
      const prices = await Api.getMarket();
      UI.updateMarketTicker(prices);
    } catch {}
  }, 60000);
}

// ── Wallet scan ───────────────────────────────

async function scanWallet() {
  const input = document.getElementById('walletInput');
  if (!input) return UI.showError('Input element not found');
  
  const address = input.value.trim();
  if (!address) { UI.showError('Please enter a wallet address.'); return; }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    UI.showError('Invalid address format. Must be 0x followed by 40 hex characters.');
    return;
  }

  UI.hideError();
  UI.setScanLoading(true);

  const loadMsg = UI.addChatMsg('', 'ai loading', 'OPENCLAW · SCANNING');
  if (loadMsg) UI.updateMsgText(loadMsg, 'Scanning wallet on BNB Chain...');

  try {
    const result = await Api.scanWallet(address);
    state.walletData = { ...result.wallet, address };
    state.analysis = result.analysis;
    state.chatHistory = [];

    UI.renderHoldings(state.walletData);
    UI.renderStats(state.walletData);
    UI.renderRisk(state.analysis);
    UI.renderTxs(state.walletData.recentTxs);

    // Auto AI analysis
    const aiMsg = UI.addLoadingMsg();
    try {
      const aiText = await Api.analyzeWallet(state.walletData, state.analysis);
      UI.updateMsgText(aiMsg, aiText);
      state.chatHistory.push({ role: 'user', content: 'Analyze this wallet.' });
      state.chatHistory.push({ role: 'assistant', content: aiText });
    } catch (e) {
      // If AI analysis fails, show basic summary
      const summary = 
        `Scan complete. Found ${result.wallet.tokenHoldings?.length || 0} tokens. ` +
        `Total portfolio: $${result.wallet.totalUsd?.toFixed(2)}. ` +
        `Risk: ${result.analysis?.risk?.label || 'Unknown'}. ` +
        `Chat is still available for detailed analysis.`;
      UI.updateMsgText(aiMsg, summary);
      console.log('AI analysis error:', e.message);
    }

  } catch (err) {
    UI.showError(err.message);
    if (loadMsg) UI.updateMsgText(loadMsg, '⚠ ' + err.message);
    UI.setStatusDot('error');
  } finally {
    UI.setScanLoading(false);
  }
}

// ── Chat ──────────────────────────────────────

async function sendChat() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  
  if (!input || !sendBtn) return;
  
  const q = input.value.trim();
  if (!q) return;

  input.value = '';
  sendBtn.disabled = true;

  UI.addChatMsg(q, 'user');
  state.chatHistory.push({ role: 'user', content: q });

  const loadMsg = UI.addLoadingMsg();

  try {
    const reply = await Api.chat(state.chatHistory, state.walletData, state.analysis);
    UI.updateMsgText(loadMsg, reply);
    state.chatHistory.push({ role: 'assistant', content: reply });

    // Keep history manageable
    if (state.chatHistory.length > 30) {
      state.chatHistory = state.chatHistory.slice(-20);
    }
  } catch (err) {
    UI.updateMsgText(loadMsg, '⚠ ' + err.message);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

// ── Event listeners ───────────────────────────

const scanBtn = document.getElementById('scanBtn');
if (scanBtn) scanBtn.addEventListener('click', scanWallet);

const walletInput = document.getElementById('walletInput');
if (walletInput) walletInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') scanWallet();
});

const chatSend = document.getElementById('chatSend');
if (chatSend) chatSend.addEventListener('click', sendChat);

const chatInput = document.getElementById('chatInput');
if (chatInput) chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChat();
});

// Chain selector (placeholder for future multi-chain)
document.querySelectorAll('.chain-btn:not([disabled])').forEach(btn => {
  if (btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.chain-btn').forEach(b => {
        if (b && b.classList) b.classList.remove('active');
      });
      if (this && this.classList) this.classList.add('active');
    });
  }
});

// ── Boot ──────────────────────────────────────
init();
