const express = require('express');
const router = express.Router();
const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama3-8b-8192'; // free, fast model on Groq

function getGroqKey() {
  return process.env.GROQ_API_KEY;
}

const SYSTEM_PROMPT = `You are OpenClaw, an elite AI crypto wallet analyst specializing in BNB Chain and Binance Smart Chain (BSC).

Your personality:
- Sharp, direct, technical — like a seasoned on-chain analyst
- Concise: under 100 words unless asked for detail
- Use concrete numbers from the wallet data provided
- Flag risks clearly but without panic
- Never give financial advice ("buy/sell X") — give analysis only
- If wallet data is unavailable, say so and offer general crypto knowledge

Your expertise:
- BSC/BNB Chain on-chain analysis
- DeFi protocols (PancakeSwap, Venus, Alpaca Finance)
- Token risk assessment
- Portfolio diversification
- Wallet security

Always reference specific wallet data when available. Be a trusted analyst, not a chatbot.`;

/**
 * Call Groq API (OpenAI-compatible format)
 */
async function callGroq(messages, maxTokens = 400) {
  const key = getGroqKey();
  if (!key || key.includes('your-groq-key')) {
    throw new Error('Groq API key not configured. Add GROQ_API_KEY to .env');
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return response.data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[GROQ API ERROR]', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

/**
 * Build wallet context string for the system prompt
 */
function buildWalletContext(walletData, analysis) {
  if (!walletData) return '';

  const tokens = walletData.tokenHoldings
    ?.map(t => `  * ${t.symbol}: ${t.balance?.toFixed(4)} ($${t.usdValue?.toFixed(2) || '?'}, ${t.change24h >= 0 ? '+' : ''}${t.change24h}% 24h)`)
    .join('\n') || '  None found';

  return `

WALLET DATA:
  Address: ${walletData.address || 'unknown'}
  BNB: ${walletData.bnbBalance?.toFixed(4)} ($${walletData.bnbUsd?.toFixed(2)}, ${walletData.bnbChange24h >= 0 ? '+' : ''}${walletData.bnbChange24h?.toFixed(1)}% 24h)
  Total Portfolio: $${walletData.totalUsd?.toFixed(2)}
  Transactions: ${walletData.txCount}

  Token Holdings:
${tokens}

RISK ANALYSIS:
  Overall Risk: ${analysis?.risk?.label || 'N/A'} (score: ${analysis?.risk?.score}/100)
  Diversification: ${analysis?.diversificationScore}/100
  Stablecoin Ratio: ${analysis?.stableRatio}%
  Concentration Risks: ${analysis?.concentrationRisks?.map(r => `${r.asset} (${r.share}%)`).join(', ') || 'None'}
  Flags: ${analysis?.flags?.join(' | ') || 'None'}`;
}

/**
 * Generate a basic analysis response when Groq is unavailable
 */
function generateFallbackAnalysis(walletData, analysis) {
  const tokens = walletData.tokenHoldings?.length || 0;
  const portfolio = walletData.totalUsd?.toFixed(2) || '0.00';
  const risk = analysis?.risk?.label || 'Unknown';
  
  return `
**Wallet Scan Complete**

Portfolio Value: $${portfolio}
Holdings: ${tokens} tokens
Risk Level: ${risk}
BNB Balance: ${walletData.bnbBalance?.toFixed(4)} BNB

The wallet has been successfully scanned. Check the portfolio analysis panel for detailed breakdown. Use the chat feature to ask specific questions about this wallet.
  `.trim();
}

/**
 * POST /api/ai/analyze
 * Body: { walletData, analysis, question }
 */
router.post('/analyze', async (req, res) => {
  const { walletData, analysis, question } = req.body;

  // Validate input
  if (!walletData) {
    return res.status(400).json({ error: 'Wallet data is required for analysis.' });
  }

  try {
    // Try Groq API if key is configured
    if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your-groq-key')) {
      const walletContext = buildWalletContext(walletData, analysis);
      const systemContent = SYSTEM_PROMPT + walletContext;
      const userMessage = question || 'Give me a full analysis of this wallet including risk assessment, notable holdings, and key recommendations.';

      try {
        const reply = await callGroq([
          { role: 'system', content: systemContent },
          { role: 'user', content: userMessage },
        ], 400);

        return res.json({ success: true, response: reply });
      } catch (groqErr) {
        console.warn('[GROQ UNAVAILABLE] Using fallback analysis:', groqErr.message);
      }
    }

    // Fallback: Generate analysis from wallet data
    const fallback = generateFallbackAnalysis(walletData, analysis);
    return res.json({ success: true, response: fallback, fallback: true });

  } catch (err) {
    console.error('[ANALYZE ERROR]', err.message);
    // Still return fallback instead of error
    const fallback = generateFallbackAnalysis(walletData, analysis);
    res.json({ success: true, response: fallback, fallback: true });
  }
});

/**
 * POST /api/ai/chat
 * Body: { messages: [{role, content}], walletData?, analysis? }
 */
router.post('/chat', async (req, res) => {
  const { messages, walletData, analysis } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  const walletContext = buildWalletContext(walletData, analysis);
  const systemContent = SYSTEM_PROMPT + walletContext;

  const validMessages = messages
    .filter(m => m.role && m.content && ['user', 'assistant'].includes(m.role))
    .slice(-20);

  try {
    // Try Groq if available
    if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your-groq-key')) {
      try {
        const reply = await callGroq([
          { role: 'system', content: systemContent },
          ...validMessages,
        ], 350);

        return res.json({ success: true, response: reply });
      } catch (groqErr) {
        console.warn('[GROQ CHAT UNAVAILABLE] Using fallback:', groqErr.message);
      }
    }

    // Fallback response
    const lastUserMsg = validMessages.filter(m => m.role === 'user').pop()?.content || '';
    let fallbackReply = 'I\'m currently analyzing this wallet offline. ';
    
    if (lastUserMsg.toLowerCase().includes('risk')) {
      fallbackReply += `The portfolio risk level is ${analysis?.risk?.label || 'moderate'}. `;
    }
    if (lastUserMsg.toLowerCase().includes('token')) {
      fallbackReply += `The wallet holds ${walletData.tokenHoldings?.length || 0} tokens. `;
    }
    if (lastUserMsg.toLowerCase().includes('value') || lastUserMsg.toLowerCase().includes('balance')) {
      fallbackReply += `Total portfolio value is $${walletData.totalUsd?.toFixed(2) || '0.00'}. `;
    }
    
    fallbackReply += 'For more detailed analysis, please try the main scan feature.';

    res.json({ success: true, response: fallbackReply, fallback: true });

  } catch (err) {
    console.error('[CHAT ERROR]', err.message);
    res.status(500).json({ error: 'Chat temporarily unavailable. Please try again later.' });
  }
});

module.exports = router;
