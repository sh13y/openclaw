"""
OpenClaw Crypto Educator - Backend API
Free AI using Groq (free tier) with Ollama local fallback
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
import os
import asyncio
from pathlib import Path

app = FastAPI(title="OpenClaw Crypto Educator API", version="1.0.0")

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── STATIC FILES ─────────────────────────────────────────────────────────────
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
if (FRONTEND_DIR / "static").exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")

# ─── CONFIG ───────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")          # Free at console.groq.com
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama3-8b-8192"                        # Free Groq model

OLLAMA_URL   = "http://localhost:11434/api/chat"        # Local Ollama fallback
OLLAMA_MODEL = "llama3"

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
def get_system_prompt(level: str = "intermediate") -> str:
    level_guides = {
        "beginner":     "Use very simple language, everyday analogies, zero jargon. Explain every technical term the first time you use it.",
        "intermediate": "Assume basic blockchain/crypto knowledge. Use proper terminology but still explain nuanced concepts clearly.",
        "advanced":     "Use technical language freely. Discuss protocol internals, cryptography, code snippets, and advanced DeFi mechanics.",
    }
    guide = level_guides.get(level, level_guides["intermediate"])
    return f"""You are OpenClaw, an expert and enthusiastic crypto & blockchain educator AI.
You help users learn everything about: Bitcoin, Ethereum, altcoins, DeFi, NFTs, Web3, trading,
blockchain technology, wallets, security, smart contracts, Layer 2, DAOs, tokenomics, and more.

Teaching level: {level.upper()}
{guide}

Rules:
- Be encouraging, engaging, and clear
- Use **bold** for key terms, `code` for technical items
- Use bullet points and numbered lists for clarity
- Provide real examples and analogies
- For financial topics always add: "This is educational content, not financial advice."
- Keep responses focused (200-400 words unless more depth is asked)
- Occasionally use relevant emoji to keep it engaging
- If asked non-crypto questions, gently redirect: "I'm specialized in crypto education!"
"""

# ─── MODELS ───────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    level: Optional[str] = "intermediate"
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    reply: str
    provider: str
    model: str

# ─── AI PROVIDERS ─────────────────────────────────────────────────────────────
async def call_groq(messages: list, system: str) -> dict:
    """Call Groq free API (llama3-8b-8192 — free tier, no credit card needed)"""
    if not GROQ_API_KEY:
        raise ValueError("No GROQ_API_KEY set")
    
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "max_tokens": 1024,
        "temperature": 0.7,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json=payload
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "reply": data["choices"][0]["message"]["content"],
            "provider": "groq",
            "model": GROQ_MODEL
        }

async def call_ollama(messages: list, system: str) -> dict:
    """Call local Ollama (completely free, runs on your machine)"""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(OLLAMA_URL, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return {
            "reply": data["message"]["content"],
            "provider": "ollama",
            "model": OLLAMA_MODEL
        }

async def call_openrouter_free(messages: list, system: str) -> dict:
    """OpenRouter free models fallback (free tier available)"""
    OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
    if not OPENROUTER_KEY:
        raise ValueError("No OPENROUTER_API_KEY")
    
    payload = {
        "model": "meta-llama/llama-3-8b-instruct:free",
        "messages": [{"role": "system", "content": system}] + messages,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"},
            json=payload
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "reply": data["choices"][0]["message"]["content"],
            "provider": "openrouter",
            "model": "llama-3-8b-free"
        }

# ─── ROUTES ───────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    """Serve frontend"""
    return FileResponse("../frontend/index.html")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "OpenClaw Crypto Educator"}

@app.get("/api/providers")
async def check_providers():
    """Check which AI providers are available"""
    providers = []
    
    if GROQ_API_KEY:
        providers.append({"name": "Groq", "model": GROQ_MODEL, "status": "configured", "free": True})
    
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get("http://localhost:11434/api/tags")
            if r.status_code == 200:
                providers.append({"name": "Ollama (Local)", "model": OLLAMA_MODEL, "status": "running", "free": True})
    except:
        providers.append({"name": "Ollama (Local)", "model": OLLAMA_MODEL, "status": "not running", "free": True})
    
    if os.getenv("OPENROUTER_API_KEY"):
        providers.append({"name": "OpenRouter", "model": "llama-3-8b-free", "status": "configured", "free": True})
    
    return {"providers": providers}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Main chat endpoint — tries providers in order: Groq → Ollama → OpenRouter"""
    messages = [m.dict() for m in req.messages]
    system   = get_system_prompt(req.level or "intermediate")
    
    errors = []
    
    # 1. Try Groq (fastest free option)
    if GROQ_API_KEY:
        try:
            return await call_groq(messages, system)
        except Exception as e:
            errors.append(f"Groq: {e}")
    
    # 2. Try local Ollama
    try:
        return await call_ollama(messages, system)
    except Exception as e:
        errors.append(f"Ollama: {e}")
    
    # 3. Try OpenRouter free
    try:
        return await call_openrouter_free(messages, system)
    except Exception as e:
        errors.append(f"OpenRouter: {e}")
    
    raise HTTPException(
        status_code=503,
        detail=f"No AI provider available. Errors: {'; '.join(errors)}. "
               f"Set GROQ_API_KEY env var (free at console.groq.com) or run Ollama locally."
    )

@app.get("/api/topics")
async def get_topics():
    """Return crypto learning topics"""
    return {"topics": [
        {"id": "bitcoin",    "icon": "₿",  "name": "Bitcoin",      "desc": "BTC fundamentals",      "prompt": "Explain Bitcoin — how it works, its history, and why it matters."},
        {"id": "ethereum",   "icon": "⬡",  "name": "Ethereum",     "desc": "Smart contracts",        "prompt": "Teach me about Ethereum, smart contracts, and the EVM in depth."},
        {"id": "blockchain", "icon": "🔗", "name": "Blockchain",   "desc": "Core technology",        "prompt": "How does blockchain technology actually work? Explain consensus, nodes, and immutability."},
        {"id": "defi",       "icon": "🌊", "name": "DeFi",         "desc": "Decentralized finance",  "prompt": "What is DeFi? Explain DEXes, AMMs, yield farming, and liquidity pools."},
        {"id": "nfts",       "icon": "🖼", "name": "NFTs",         "desc": "Digital ownership",      "prompt": "What are NFTs, how do they work on-chain, and what gives them value?"},
        {"id": "wallets",    "icon": "💼", "name": "Wallets",      "desc": "Keys & custody",         "prompt": "Explain crypto wallets — hot vs cold, hardware wallets, seed phrases, and security."},
        {"id": "trading",    "icon": "📊", "name": "Trading",      "desc": "Charts & strategies",    "prompt": "Teach me crypto trading basics — candlesticks, RSI, MACD, and risk management."},
        {"id": "security",   "icon": "🔐", "name": "Security",     "desc": "Stay safe on-chain",     "prompt": "What are the biggest crypto security threats and how do I protect myself?"},
        {"id": "mining",     "icon": "⛏", "name": "Mining",       "desc": "Proof of Work",          "prompt": "How does crypto mining work? Compare Proof of Work vs Proof of Stake."},
        {"id": "layer2",     "icon": "🔄", "name": "Layer 2",      "desc": "Scaling solutions",      "prompt": "What are Layer 2 solutions? Explain rollups, Optimism, Arbitrum, and zkEVM."},
        {"id": "web3",       "icon": "🌐", "name": "Web3",         "desc": "Next internet",          "prompt": "What is Web3, how does it differ from Web2, and what can it enable?"},
        {"id": "tokenomics", "icon": "💎", "name": "Tokenomics",   "desc": "Token economics",        "prompt": "What is tokenomics? Explain supply, inflation, burning, vesting, and value accrual."},
    ]}
