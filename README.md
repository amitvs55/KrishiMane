# 🌿 KrishiMane

> Premium Cold-Pressed Natural Oils — Modern Website + LangGraph AI Advisor

A full-stack web application built with **Next.js 14** (frontend) and **FastAPI + LangGraph** (backend), fully containerised with **Docker**.

---

## 🏗 Project Structure

```
KrishiMane/
├── frontend/          ← Next.js 14 (App Router, TypeScript)
│   ├── src/
│   │   ├── app/       ← layout.tsx, page.tsx, globals.css
│   │   └── components/← Navbar, Hero, ProductsTab, AnalysisTab, ChatWidget
│   ├── public/        ← bg-hero.png + product images
│   └── Dockerfile
├── backend/           ← Python FastAPI + LangGraph
│   ├── agent.py       ← LangGraph intent classifier + Gemini advisor
│   ├── main.py        ← FastAPI SSE streaming /chat endpoint
│   ├── requirements.txt
│   ├── .env           ← ⚠️ Add your GOOGLE_API_KEY here
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🚀 Quick Start (Docker)

### 1. Add your Google API key

Open `backend/.env` and replace the placeholder:
```
GOOGLE_API_KEY=your_actual_key_here
```
> Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 2. Start Docker Desktop

Make sure Docker Desktop is running on your machine.

### 3. Build & run

```bash
docker compose build
docker compose up
```

### 4. Open in browser

| Service | URL |
|---|---|
| 🌐 Website | http://localhost:3000 |
| 🤖 API docs | http://localhost:8000/docs |

---

## 🤖 AI Advisor (LangGraph)

The floating **AI Advisor** button (🤖) opens a chat panel powered by:

- **LangGraph** — routes intent → `product_recommender` | `health_advisor` | `general_qa`
- **Google Gemini 1.5 Flash** — generates streaming responses
- **SSE streaming** — tokens appear in real-time

### Example questions
- *"Which oil is best for heart health?"*
- *"Compare Sunflower vs Coconut oil"*
- *"Best oil for deep frying?"*
- *"Which oil is good for hair?"*

---

## 📦 Features

| Feature | Details |
|---|---|
| 🎨 Design | Earthy palette (deep green + gold), Playfair Display + Inter |
| 📦 Products Tab | 4 product cards with hover animations |
| 📊 Analysis Tab | Nutritional bars + infographic + sourcing grid |
| 🤖 AI Chat | LangGraph + Gemini, SSE streaming, suggestion chips |
| 📱 Responsive | Mobile + desktop |
| 🐳 Docker | Multi-stage builds, health checks |

---

## 🛠 Development (without Docker)

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your API key
uvicorn main:app --reload --port 8000
```
