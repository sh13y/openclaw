# 🦾 OpenClaw — Crypto AI Educator

> A full-stack AI-powered cryptocurrency education platform. **100% Free AI** using Groq, Ollama, or OpenRouter.

---

## 📁 Project Structure

```
openclaw/
├── backend/
│   ├── main.py              ← FastAPI backend (Python)
│   ├── requirements.txt     ← Python dependencies
│   └── .env.example         ← Environment config template
│
├── frontend/
│   ├── index.html           ← Main HTML page
│   └── static/
│       ├── css/style.css    ← Full stylesheet
│       └── js/app.js        ← Frontend JavaScript
│
├── README.md
└── start.sh                 ← One-click startup script
```

---

## 🚀 Quick Start

### Step 1 — Get a FREE AI API Key (choose one)

#### Option A: Groq ⭐ Recommended (fastest, free forever)
1. Go to **https://console.groq.com**
2. Sign up (free, no credit card)
3. Create an API key
4. Copy it

#### Option B: Ollama (fully local, no internet needed)
1. Install from **https://ollama.com**
2. Run: `ollama pull llama3`
3. That's it — no key needed!

#### Option C: OpenRouter (free tier models)
1. Go to **https://openrouter.ai**
2. Sign up and get a free API key

---

### Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and paste your Groq key:
```
GROQ_API_KEY=gsk_your_key_here
```

---

### Step 3 — Install & Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**

---

### Step 4 — Open Frontend

**Option A — Simple (open directly):**
```bash
open frontend/index.html
# Or double-click frontend/index.html in your file manager
```

**Option B — Serve with Python:**
```bash
cd frontend
python -m http.server 3000
# Open http://localhost:3000
```

**Option C — Full stack (backend serves frontend):**
```bash
# In backend/main.py, the root "/" route serves the frontend
uvicorn main:app --reload --port 8000
# Open http://localhost:8000
```

---

## 🎓 Features

| Feature | Details |
|---------|---------|
| 💬 AI Chat | Multi-turn conversation with memory |
| 📚 12 Topics | Bitcoin, ETH, DeFi, NFTs, Trading, Security + more |
| 🎯 3 Levels | Beginner / Intermediate / Advanced |
| 📊 Ticker | Live-style crypto price ticker |
| 🌙 Dark/Light | Theme toggle |
| 📱 Responsive | Mobile-friendly with sidebar drawer |
| 💡 Crypto Facts | Auto-rotating educational facts |
| ⚡ Fast | Groq llama3 responds in < 1 second |

---

## 🤖 AI Providers

The backend tries providers in order:
1. **Groq** (if `GROQ_API_KEY` set) — fastest, free
2. **Ollama** (if running locally) — completely offline
3. **OpenRouter** (if `OPENROUTER_API_KEY` set) — free tier models

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve frontend |
| GET | `/health` | Health check |
| GET | `/api/topics` | Get topic list |
| GET | `/api/providers` | Check AI providers |
| POST | `/api/chat` | Send chat message |

### Chat Request Body:
```json
{
  "messages": [
    { "role": "user", "content": "What is Bitcoin?" }
  ],
  "level": "beginner"
}
```

### Chat Response:
```json
{
  "reply": "Bitcoin is a decentralized digital currency...",
  "provider": "groq",
  "model": "llama3-8b-8192"
}
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Python, FastAPI, Uvicorn |
| AI (Free) | Groq / Ollama / OpenRouter |
| HTTP Client | httpx (async) |
| Font | Syne + Space Mono |

---

## 📝 Customization

**Change AI model** — in `backend/main.py`:
```python
GROQ_MODEL = "llama3-8b-8192"        # Fast & free
# GROQ_MODEL = "mixtral-8x7b-32768"  # More capable, still free
# GROQ_MODEL = "llama3-70b-8192"     # Most capable on Groq free tier
```

**Add topics** — in `backend/main.py`, extend the `/api/topics` list.

**Change theme colors** — in `frontend/static/css/style.css`, edit the `:root` CSS variables.

---

## ⚠️ Disclaimer

OpenClaw provides **educational content only**. Nothing on this platform constitutes financial advice. Always do your own research before making investment decisions.

---

*Built with ❤️ — 100% Free, Open Source*
