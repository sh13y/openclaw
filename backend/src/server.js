require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const walletRoutes = require('./routes/wallet');
const aiRoutes = require('./routes/ai');
const priceRoutes = require('./routes/prices');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Global rate limiter
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please wait.' },
}));

// AI endpoint gets stricter limit
app.use('/api/ai', rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'AI rate limit reached. Wait 1 minute.' },
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/wallet', walletRoutes);
app.use('/api/ai',     aiRoutes);
app.use('/api/prices', priceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      groq:       !!process.env.GROQ_API_KEY,
      bscscan:    !!process.env.BSCSCAN_API_KEY,
      coingecko:  true,
    }
  });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🦀  OpenClaw backend running on http://localhost:${PORT}`);
  console.log(`    Groq key:      ${process.env.GROQ_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`    BscScan key:   ${process.env.BSCSCAN_API_KEY ? '✅' : '❌ missing'}\n`);
});
