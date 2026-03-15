/* ═══════════════════════════════════════════════════════════════════════════
   OpenClaw — Frontend App Logic (Premium Edition)
   ═══════════════════════════════════════════════════════════════════════════ */

const API = (() => {
  const o = window.location.origin;
  return (o.includes('localhost') || o.includes('127.0')) ? 'http://localhost:8000' : o;
})();

/* ── STATE ─────────────────────────────────────────────────────────────── */
const S = {
  msgs:    [],
  level:   'intermediate',
  loading: false,
  theme:   localStorage.getItem('oc-theme') || 'dark',
  view:    'chat',
};

/* ── DATA ──────────────────────────────────────────────────────────────── */
const TICKER = [
  { s:'BTC',  p:'$84,250', c:'+2.4%', up:true  },
  { s:'ETH',  p:'$3,182',  c:'+1.8%', up:true  },
  { s:'SOL',  p:'$142',    c:'-0.9%', up:false },
  { s:'BNB',  p:'$580',    c:'+0.6%', up:true  },
  { s:'XRP',  p:'$0.58',   c:'+3.1%', up:true  },
  { s:'ADA',  p:'$0.47',   c:'-1.2%', up:false },
  { s:'DOGE', p:'$0.183',  c:'+5.3%', up:true  },
  { s:'AVAX', p:'$38.2',   c:'-2.1%', up:false },
  { s:'DOT',  p:'$8.94',   c:'+1.1%', up:true  },
  { s:'LINK', p:'$14.80',  c:'+2.9%', up:true  },
  { s:'MATIC',p:'$0.76',   c:'-0.7%', up:false },
  { s:'UNI',  p:'$11.40',  c:'+0.4%', up:true  },
];

const FACTS = [
  'Bitcoin has a fixed supply of <strong>21 million coins</strong> — making it mathematically scarce forever.',
  'On May 22, 2010, Laszlo Hanyecz paid <strong>10,000 BTC for 2 pizzas</strong>. Today that\'s ~$840 million.',
  'Ethereum\'s <strong>"Merge"</strong> in Sept 2022 cut its energy consumption by roughly 99.95%.',
  'The total value locked in DeFi protocols peaked at <strong>over $180 billion</strong> in late 2021.',
  'There are over <strong>20,000 cryptocurrencies</strong> tracked across global exchanges.',
  'The word <strong>"blockchain"</strong> doesn\'t appear once in Satoshi\'s original Bitcoin whitepaper.',
  'Vitalik Buterin proposed Ethereum at age <strong>19</strong> in a 2013 whitepaper.',
  'Beeple\'s NFT "Everydays" sold for <strong>$69.3 million</strong> at Christie\'s auction in 2021.',
];

const STARTERS = [
  { icon:'₿',  title:'Bitcoin basics',   q:'Explain Bitcoin — how it works, why it matters, and why it has value.' },
  { icon:'🌊', title:'Explore DeFi',     q:'What is DeFi? Explain decentralized exchanges, yield farming, and liquidity pools.' },
  { icon:'🔐', title:'Stay secure',      q:'What are the top crypto security threats and how do I protect myself?' },
  { icon:'📊', title:'Learn trading',    q:'Teach me crypto trading fundamentals — candlesticks, RSI, and risk management.' },
];

const CHIPS = [
  'Bitcoin halving?', 'Gas fees explained', 'What is a rug pull?',
  'How does staking work?', 'What are stablecoins?', 'Cold wallet vs hot wallet?',
];

const TOPICS = [
  { id:'btc',       icon:'₿',  name:'Bitcoin',     desc:'BTC fundamentals',     prompt:'Explain Bitcoin from scratch — origin, how it works, and why it matters.' },
  { id:'eth',       icon:'⬡',  name:'Ethereum',    desc:'Smart contracts',      prompt:'Teach me about Ethereum, smart contracts, the EVM, and Solidity basics.' },
  { id:'blockchain',icon:'🔗', name:'Blockchain',  desc:'Core technology',      prompt:'How does blockchain actually work? Explain consensus mechanisms, nodes, and immutability.' },
  { id:'defi',      icon:'🌊', name:'DeFi',         desc:'Decentralized finance',prompt:'Deep dive into DeFi: DEXes, AMMs, yield farming, liquidity pools, and impermanent loss.' },
  { id:'nfts',      icon:'🖼', name:'NFTs',         desc:'Digital ownership',    prompt:'What are NFTs? How do they work on-chain, and what actually gives them value?' },
  { id:'wallets',   icon:'💼', name:'Wallets',      desc:'Keys & custody',       prompt:'Explain crypto wallets: hot vs cold, hardware wallets, seed phrases, and security best practices.' },
  { id:'trading',   icon:'📊', name:'Trading',      desc:'Charts & analysis',    prompt:'Teach crypto trading basics: candlestick charts, RSI, MACD, support/resistance, and risk management.' },
  { id:'security',  icon:'🔐', name:'Security',     desc:'Stay safe on-chain',   prompt:'What are the most critical crypto security risks and how do I protect my assets?' },
  { id:'mining',    icon:'⛏', name:'Mining',       desc:'PoW explained',        prompt:'How does proof-of-work mining work? Explain hash rate, difficulty, and compare PoW vs PoS.' },
  { id:'layer2',    icon:'🔄', name:'Layer 2',      desc:'Scaling solutions',    prompt:'What are Layer 2 solutions? Explain Optimistic rollups, zkEVM, Arbitrum, and Optimism.' },
  { id:'web3',      icon:'🌐', name:'Web3',         desc:'The next internet',    prompt:'What is Web3? How does it differ from Web2, and what can it enable?' },
  { id:'tokenomics',icon:'💎', name:'Tokenomics',   desc:'Token economics',      prompt:'Explain tokenomics: supply schedules, inflation, token burning, vesting, and value accrual.' },
];

const LEARN_PATHS = [
  { icon:'🚀', title:'CRYPTO 101', desc:'Start from absolute zero. What crypto is, how it works, and why it exists.', level:'BEGINNER', q:'Give me a complete beginner introduction to cryptocurrency and blockchain.' },
  { icon:'₿',  title:'BITCOIN DEEP DIVE', desc:'The origin, mechanics, and philosophy of the world\'s first cryptocurrency.', level:'BEGINNER → INTERMEDIATE', q:'Give me a comprehensive deep dive into Bitcoin: history, mining, halvings, and future.' },
  { icon:'⬡',  title:'ETHEREUM & SMART CONTRACTS', desc:'How Ethereum works, smart contract development, and the EVM in depth.', level:'INTERMEDIATE', q:'Teach me Ethereum: smart contracts, the EVM, gas, Solidity basics, and the ecosystem.' },
  { icon:'🌊', title:'DEFI MASTERY', desc:'Decentralized exchanges, lending protocols, yield strategies, and real risks.', level:'INTERMEDIATE → ADVANCED', q:'Give me a full DeFi masterclass: AMMs, lending, yield farming, risk management.' },
  { icon:'🔐', title:'CRYPTO SECURITY', desc:'Wallets, keys, opsec, common attack vectors, and how to stay safe.', level:'ALL LEVELS', q:'Comprehensive crypto security guide: wallets, seed phrases, phishing, smart contract audits.' },
  { icon:'📊', title:'TRADING & ANALYSIS', desc:'Technical analysis, on-chain metrics, and professional trading mindset.', level:'INTERMEDIATE', q:'Teach me professional crypto trading: TA, on-chain analysis, risk management, psychology.' },
  { icon:'🔄', title:'LAYER 2 & SCALING', desc:'Why blockchains struggle to scale and how L2s solve the trilemma.', level:'ADVANCED', q:'Explain the blockchain scalability trilemma and how Layer 2 solutions like rollups solve it.' },
  { icon:'🌐', title:'WEB3 & THE FUTURE', desc:'DAOs, identity, NFTs, and the decentralized internet of tomorrow.', level:'INTERMEDIATE', q:'Explore Web3: DAOs, decentralized identity, NFTs beyond art, and real-world use cases.' },
];

const GLOSSARY = [
  { term:'Address', def:'A unique identifier on a blockchain, like a bank account number, used to send and receive crypto.', cat:'BASICS' },
  { term:'Altcoin', def:'Any cryptocurrency other than Bitcoin. Ethereum, Solana, and Cardano are all altcoins.', cat:'BASICS' },
  { term:'AMM', def:'Automated Market Maker — a DEX protocol that uses mathematical formulas to price assets instead of order books.', cat:'DEFI' },
  { term:'APY', def:'Annual Percentage Yield — the real return on investment including compounding interest over one year.', cat:'DEFI' },
  { term:'Bear Market', def:'A prolonged period of declining prices, typically defined as a 20%+ drop from recent highs.', cat:'TRADING' },
  { term:'Block', def:'A batch of validated transactions bundled together and added permanently to the blockchain.', cat:'BLOCKCHAIN' },
  { term:'Bull Market', def:'A sustained period of rising prices and positive market sentiment.', cat:'TRADING' },
  { term:'Cold Wallet', def:'A hardware device or paper wallet that stores private keys offline, protecting against remote hacks.', cat:'SECURITY' },
  { term:'DAO', def:'Decentralized Autonomous Organization — a group governed by smart contracts and token-holder votes.', cat:'WEB3' },
  { term:'DeFi', def:'Decentralized Finance — financial services like lending and trading built on blockchain without intermediaries.', cat:'DEFI' },
  { term:'DEX', def:'Decentralized Exchange — a peer-to-peer trading platform that operates without a central authority.', cat:'DEFI' },
  { term:'EVM', def:'Ethereum Virtual Machine — the runtime environment that executes smart contracts on Ethereum and compatible chains.', cat:'ETHEREUM' },
  { term:'Gas', def:'A fee paid to compensate for the computing energy required to process transactions on Ethereum.', cat:'ETHEREUM' },
  { term:'Halving', def:'A Bitcoin event (every ~4 years) that cuts the block reward in half, reducing new supply issuance.', cat:'BITCOIN' },
  { term:'Hash Rate', def:'A measure of the total computational power being used to mine and process transactions on a PoW network.', cat:'MINING' },
  { term:'Hot Wallet', def:'A software wallet connected to the internet — convenient for transactions but more vulnerable to attacks.', cat:'SECURITY' },
  { term:'Impermanent Loss', def:'Temporary loss of value experienced by liquidity providers when token prices diverge from when they deposited.', cat:'DEFI' },
  { term:'Layer 2', def:'A secondary framework built on top of a blockchain to increase transaction speed and reduce fees.', cat:'SCALING' },
  { term:'Liquidity Pool', def:'A smart contract holding tokens that enables automated trading on decentralized exchanges.', cat:'DEFI' },
  { term:'Mempool', def:'The "waiting room" where unconfirmed transactions sit before miners include them in a block.', cat:'BLOCKCHAIN' },
  { term:'NFT', def:'Non-Fungible Token — a unique, indivisible digital asset on a blockchain that proves ownership.', cat:'NFT' },
  { term:'Private Key', def:'A secret cryptographic key that gives full control over a wallet. Never share it with anyone.', cat:'SECURITY' },
  { term:'Proof of Stake', def:'A consensus mechanism where validators lock up crypto as collateral to validate transactions.', cat:'BLOCKCHAIN' },
  { term:'Proof of Work', def:'A consensus mechanism where miners compete to solve cryptographic puzzles to add blocks.', cat:'BLOCKCHAIN' },
  { term:'Rollup', def:'A Layer 2 scaling technique that bundles transactions off-chain and posts compressed data on-chain.', cat:'SCALING' },
  { term:'Rug Pull', def:'An exit scam where developers abandon a project and drain liquidity, leaving investors with worthless tokens.', cat:'SECURITY' },
  { term:'Seed Phrase', def:'A 12 or 24-word backup that can restore your entire wallet. Guard it like cash.', cat:'SECURITY' },
  { term:'Smart Contract', def:'Self-executing code on a blockchain that automatically enforces terms when conditions are met.', cat:'ETHEREUM' },
  { term:'Stablecoin', def:'A cryptocurrency designed to maintain a stable value, often pegged 1:1 to a fiat currency.', cat:'DEFI' },
  { term:'Staking', def:'Locking up crypto to participate in network validation and earn rewards in return.', cat:'DEFI' },
  { term:'Tokenomics', def:'The economics of a token: supply, distribution, inflation, burning, and incentive structures.', cat:'BASICS' },
  { term:'TVL', def:'Total Value Locked — the total amount of crypto deposited in a DeFi protocol\'s smart contracts.', cat:'DEFI' },
  { term:'Wallet', def:'Software or hardware that stores cryptographic keys and allows you to send/receive cryptocurrency.', cat:'BASICS' },
  { term:'Web3', def:'The vision of a decentralized internet built on blockchain technology, owned by users rather than corporations.', cat:'WEB3' },
  { term:'Yield Farming', def:'The practice of moving crypto across DeFi protocols to maximize returns from fees and incentive tokens.', cat:'DEFI' },
  { term:'zkEVM', def:'Zero-Knowledge Ethereum Virtual Machine — a Layer 2 that uses ZK proofs for privacy and scalability.', cat:'SCALING' },
];

/* ── INIT ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(S.theme);
  buildTicker();
  buildSidebar();
  buildWelcome();
  buildLearn();
  buildGlossary();
  checkProvider();

  let fi = 0;
  showFact(fi);
  setInterval(() => { fi = (fi + 1) % FACTS.length; showFact(fi); }, 12000);

  // Input
  const box = el('inputBox');
  box.addEventListener('input', onInput);
  box.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.addEventListener('click', () => setView(t.dataset.view));
  });

  // Level
  document.querySelectorAll('.lv-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.lv-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      S.level = b.dataset.lv;
    });
  });
});

/* ── HELPERS ───────────────────────────────────────────────────────────── */
const el = id => document.getElementById(id);
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── TICKER ────────────────────────────────────────────────────────────── */
function buildTicker() {
  const all = [...TICKER, ...TICKER];
  el('tickerTrack').innerHTML = all.map(t =>
    `<div class="t-item"><span class="t-sym">${t.s}</span><span class="t-px">${t.p}</span><span class="${t.up?'t-up':'t-dn'}">${t.c}</span></div>`
  ).join('');
}

/* ── SIDEBAR ───────────────────────────────────────────────────────────── */
function buildSidebar() {
  el('topicGrid').innerHTML = TOPICS.map(t =>
    `<div class="topic-card" id="tc-${t.id}" onclick="pickTopic('${t.id}','${esc(t.prompt)}')">
       <span class="tc-icon">${t.icon}</span>
       <span class="tc-text">
         <span class="tc-name">${t.name}</span>
         <span class="tc-desc">${t.desc}</span>
       </span>
     </div>`
  ).join('');
}

function pickTopic(id, prompt) {
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('active'));
  const card = el(`tc-${id}`);
  if (card) card.classList.add('active');
  closeSidebar();
  setView('chat');
  ask(prompt);
}

/* ── WELCOME ───────────────────────────────────────────────────────────── */
function buildWelcome() {
  el('starterGrid').innerHTML = STARTERS.map(s =>
    `<div class="st-card" onclick="ask(${JSON.stringify(s.q)})">
       <span class="st-icon">${s.icon}</span>
       <span class="st-title">${s.title}</span>
       <span class="st-q">${s.q}</span>
     </div>`
  ).join('');
  el('chipsRow').innerHTML = CHIPS.map(c =>
    `<button class="chip" onclick="ask(${JSON.stringify(c)})">${c}</button>`
  ).join('');
}

/* ── FACT ──────────────────────────────────────────────────────────────── */
function showFact(i) {
  const box = el('factBox');
  if (!box) return;
  box.style.opacity = '0';
  setTimeout(() => { box.innerHTML = `<p class="fact-body">${FACTS[i]}</p>`; box.style.opacity = '1'; }, 350);
}

/* ── LEARN ─────────────────────────────────────────────────────────────── */
function buildLearn() {
  el('learnGrid').innerHTML = LEARN_PATHS.map(p =>
    `<div class="learn-card" onclick="startLearnPath(${JSON.stringify(p.q)})">
       <span class="lc-icon">${p.icon}</span>
       <div class="lc-title">${p.title}</div>
       <div class="lc-desc">${p.desc}</div>
       <div class="lc-level">${p.level}</div>
       <span class="lc-arrow">→</span>
     </div>`
  ).join('');
}

function startLearnPath(q) {
  setView('chat');
  ask(q);
}

/* ── GLOSSARY ──────────────────────────────────────────────────────────── */
function buildGlossary() {
  const sorted = [...GLOSSARY].sort((a,b) => a.term.localeCompare(b.term));
  el('glosGrid').innerHTML = sorted.map(g =>
    `<div class="glos-item" data-term="${g.term.toLowerCase()}">
       <div class="glos-term">${g.term}</div>
       <div class="glos-def">${g.def}</div>
       <span class="glos-cat">${g.cat}</span>
     </div>`
  ).join('');
}

function filterGlossary(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.glos-item').forEach(item => {
    const term = item.dataset.term || '';
    const text = item.textContent.toLowerCase();
    item.classList.toggle('hidden', q.length > 0 && !text.includes(q));
  });
}

/* ── VIEWS ─────────────────────────────────────────────────────────────── */
function setView(v) {
  S.view = v;
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
  const target = el(`view${v.charAt(0).toUpperCase() + v.slice(1)}`);
  if (target) target.classList.add('active');
}

/* ── PROVIDER CHECK ────────────────────────────────────────────────────── */
async function checkProvider() {
  try {
    const r = await fetch(`${API}/api/providers`);
    const d = await r.json();
    const active = d.providers?.find(p => p.status === 'configured' || p.status === 'running');
    const dot = document.querySelector('.pill-dot');
    const txt = el('pillText');
    const eng = el('engineVal');
    if (active) {
      dot.classList.remove('off'); txt.classList.remove('off');
      txt.textContent = 'AI ONLINE';
      eng.textContent = `${active.name} · Free`;
    } else {
      dot.classList.add('off'); txt.classList.add('off');
      txt.textContent = 'SETUP NEEDED';
      eng.textContent = 'no provider';
    }
  } catch {
    const dot = document.querySelector('.pill-dot');
    const txt = el('pillText');
    if (dot) dot.classList.add('off');
    if (txt) { txt.classList.add('off'); txt.textContent = 'OFFLINE'; }
    if (el('engineVal')) el('engineVal').textContent = 'backend offline';
  }
}

/* ── CHAT ──────────────────────────────────────────────────────────────── */
function ask(text) {
  setView('chat');
  el('inputBox').value = text;
  sendMessage();
}

async function sendMessage() {
  if (S.loading) return;
  const box  = el('inputBox');
  const text = box.value.trim();
  if (!text) return;

  removeWelcome();
  S.loading = true;
  box.value = '';
  resizeTA();
  el('sendBtn').disabled = true;
  el('metaCount').textContent = '0 / 1200';

  S.msgs.push({ role:'user', content:text });
  addBubble('user', text);
  const typing = addTyping();

  try {
    const res = await fetch(`${API}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ messages: S.msgs.slice(-20), level: S.level }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || `Server error ${res.status}`);
    }
    const data  = await res.json();
    const reply = data.reply || 'Something went wrong. Please try again.';
    S.msgs.push({ role:'assistant', content:reply });
    typing.remove();
    if (data.provider) el('engineVal').textContent = `${data.provider} · ${data.model}`;
    addBubble('assistant', reply);
  } catch(e) {
    typing.remove();
    addError(e.message);
  }

  S.loading = false;
  el('sendBtn').disabled = false;
  box.focus();
  scrollDown();
}

function removeWelcome() {
  const w = el('welcomeScreen');
  if (w) { w.style.animation = 'fade-up .2s ease reverse'; setTimeout(() => w.remove(), 180); }
}

function newChat() {
  S.msgs = [];
  const wrap = el('msgsWrap');
  wrap.innerHTML = `<div id="welcomeScreen" class="welcome">
    <div class="wlc-orb">
      <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="45" cy="45" r="43" stroke="#e8a020" stroke-width="1" opacity="0.25"/>
        <circle cx="45" cy="45" r="33" stroke="#e8a020" stroke-width="0.5" opacity="0.15"/>
        <path d="M29 66C29 66 25 51 32 40C35.5 34 45 55 45 55C45 55 45 34 54 29C60 25.5 58.5 46 54 57" stroke="#e8a020" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M45 55C46.5 59 48 65 45 67C42 69 40 65.5 41.5 62" stroke="#e8a020" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <circle cx="45" cy="20" r="4.5" fill="#e8a020"/>
      </svg>
    </div>
    <h1 class="wlc-title">OpenClaw</h1>
    <p class="wlc-italic">Crypto intelligence, explained.</p>
    <p class="wlc-body">Ask me anything about Bitcoin, Ethereum, DeFi, NFTs, trading, wallets, and more. I adapt to your level.</p>
    <div class="starter-grid" id="starterGrid"></div>
    <div class="chips-row" id="chipsRow"></div>
  </div>`;
  buildWelcome();
  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('active'));
  closeSidebar();
  setView('chat');
}

/* ── MESSAGE RENDER ────────────────────────────────────────────────────── */
function addBubble(role, content) {
  const wrap   = el('msgsWrap');
  const time   = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const isFinancial = /\b(price|invest|buy|sell|profit|return|portfolio|trade)\b/i.test(content);
  const div    = document.createElement('div');
  div.className = `msg-row ${role}`;
  const bodyHTML = role === 'assistant' ? md(content) : `<p>${esc(content)}</p>`;
  const disc  = (role === 'assistant' && isFinancial)
    ? `<div class="disclaimer">⚠ Educational content only — not financial advice.</div>` : '';
  div.innerHTML = `
    <div class="av">${role === 'assistant' ? 'OC' : '👤'}</div>
    <div class="bubble-wrap">
      <div class="bubble">${bodyHTML}${disc}</div>
      <span class="msg-time">${time}</span>
    </div>`;
  wrap.appendChild(div);
  scrollDown();
  return div;
}

function addTyping() {
  const wrap = el('msgsWrap');
  const div  = document.createElement('div');
  div.className = 'msg-row assistant typing-msg';
  div.innerHTML = `<div class="av">OC</div><div class="bubble-wrap"><div class="bubble"><div class="typing-dots"><div class="td"></div><div class="td"></div><div class="td"></div></div></div></div>`;
  wrap.appendChild(div);
  scrollDown();
  return div;
}

function addError(msg) {
  const wrap = el('msgsWrap');
  const div  = document.createElement('div');
  div.className = 'msg-row assistant err-bubble';
  div.innerHTML = `<div class="av">OC</div><div class="bubble-wrap"><div class="bubble">
    <strong style="color:var(--red)">⚠ Connection Error</strong><br><br>
    ${esc(msg)}<br><br>
    <small style="color:var(--t3);font-family:var(--f-mono);font-size:11px">
      Start backend: <code>cd backend && uvicorn main:app --reload</code><br>
      Add your free key: <code>GROQ_API_KEY</code> in <code>backend/.env</code>
    </small>
  </div></div>`;
  wrap.appendChild(div);
  scrollDown();
}

/* ── MARKDOWN ──────────────────────────────────────────────────────────── */
function md(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_,lang,code) =>
      `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[hupb])/, '<p>')
    .replace(/([^>p])$/, '$1</p>');
}

/* ── INPUT ─────────────────────────────────────────────────────────────── */
function onInput(e) {
  resizeTA();
  const n = e.target.value.length;
  const c = el('metaCount');
  c.textContent = `${n} / 1200`;
  c.classList.toggle('warn', n > 1100);
}
function resizeTA() {
  const b = el('inputBox');
  b.style.height = 'auto';
  b.style.height = Math.min(b.scrollHeight, 140) + 'px';
}

/* ── THEME ─────────────────────────────────────────────────────────────── */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : '');
  el('themeBtn').textContent = t === 'light' ? '●' : '◐';
  S.theme = t;
  localStorage.setItem('oc-theme', t);
}
function toggleTheme() { applyTheme(S.theme === 'dark' ? 'light' : 'dark'); }

/* ── SIDEBAR MOBILE ────────────────────────────────────────────────────── */
function toggleSidebar() {
  const sb = el('sidebar');
  sb.classList.contains('open') ? closeSidebar() : openSidebar();
}
function openSidebar() {
  el('sidebar').classList.add('open');
  el('mobOverlay').classList.add('show');
}
function closeSidebar() {
  el('sidebar').classList.remove('open');
  el('mobOverlay').classList.remove('show');
}

/* ── UTILS ─────────────────────────────────────────────────────────────── */
function scrollDown() {
  const w = el('msgsWrap');
  if (w) w.scrollTo({ top: w.scrollHeight, behavior: 'smooth' });
}
