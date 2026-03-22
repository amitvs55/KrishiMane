# KrishiMane — Project Guide

## What is this?

KrishiMane is a full-stack e-commerce platform for premium cold-pressed natural oils from Indian farms. It features a Next.js frontend, FastAPI backend with AI advisor (Google Gemini via LangGraph), and Docker containerization.

## Quick Start

```bash
# Everything runs in Docker
docker compose build
docker compose up
# Frontend: http://localhost:3000
# Backend API docs: http://localhost:8000/docs
```

**Test credentials:**
- Admin: `admin@krishimane.com` / `admin123`
- Customer: Register any email (min 6 char password)

## Architecture

```
frontend/  → Next.js 16 (TypeScript, App Router, React 19)
backend/   → FastAPI + SQLAlchemy + LangGraph AI
docker-compose.yml → Orchestrates both services
```

### Backend (port 8000)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI routes: auth, products, orders, chat (SSE) |
| `models.py` | SQLAlchemy ORM: User, Product, ProductVariant, Order, OrderItem |
| `database.py` | SQLAlchemy engine/session setup (SQLite default) |
| `auth.py` | JWT (HS256, 24h expiry) + bcrypt password hashing |
| `agent.py` | LangGraph AI advisor with Gemini 1.5 Flash, intent classification |
| `seed.py` | Creates admin user + seeds product catalog on startup |
| `start.sh` | Entry point: runs seed.py then uvicorn |

**API endpoints:** `/auth/register`, `/auth/login`, `/auth/me`, `/products`, `/products/{slug}`, `/orders` (CRUD), `/orders/{id}/status` (admin), `/chat` (SSE stream)

### Frontend (port 3000)

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Home — hero + product grid + AI chat |
| `src/app/login/` | Login form |
| `src/app/register/` | Registration form |
| `src/app/cart/` | Shopping cart with qty controls |
| `src/app/checkout/` | 4-step checkout (address → review → payment → confirm) |
| `src/components/` | Navbar, Hero, ProductsTab, AnalysisTab, ChatWidget |
| `src/context/` | AuthContext (JWT), CartContext (localStorage) |

### Docker

- **Backend**: `python:3.11-slim`, runs `start.sh` (seed + uvicorn)
- **Frontend**: Multi-stage Node 20 Alpine build, standalone output
- **Health check**: Backend `/health` endpoint polled every 10s
- **Network**: `krishimane-network` bridge

## Key Design Decisions

- **SQLite for dev** — swap to PostgreSQL via `DATABASE_URL` env var for production
- **JWT in localStorage** — 24-hour expiry, no refresh tokens yet
- **Cart in localStorage** — persists across sessions, synced via React Context
- **SSE streaming** for AI chat responses (not WebSocket)
- **No payment gateway yet** — Razorpay method exists in code but not integrated
- **CSS only** — no Tailwind or component library; custom variables in `globals.css`
- **Product images** stored in `frontend/public/products/`

## Environment Variables

### Backend (`backend/.env`)
```
GOOGLE_API_KEY=<google-gemini-api-key>
JWT_SECRET=<change-in-production>
DATABASE_URL=sqlite:///./krishimane.db
```

### Frontend (set in docker-compose)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Current State (What Works)

- Full auth flow (register/login/logout with JWT)
- Product catalog with variant selection (4 oils, 3 sizes each)
- Add to cart, update qty, remove items
- Multi-step checkout with address + order creation
- Order management (create, list, status updates)
- Stock tracking (decrements on purchase)
- AI chat advisor with streaming responses
- Admin-only Analysis tab
- Docker build & orchestration

## What's Missing / TODO

1. **6 more products** — only 4 of 10 oils are seeded (user has 10 total)
2. **Razorpay integration** — payment method stub exists, no actual gateway
3. **Email notifications** — UI says "confirmation sent" but no email service
4. **Save for Later** — button exists, not functional
5. **Promo codes** — input field exists, no backend endpoint
6. **Order tracking page** — no dedicated tracking UI
7. **Admin dashboard** — no UI for managing orders/products
8. **Product search/filtering** — not implemented
9. **Reviews/ratings** — not implemented
10. **GST inconsistency** — cart shows 3%, checkout shows 5%

## Conventions

- Backend uses snake_case (Python), frontend uses camelCase (TypeScript)
- API returns JSON with snake_case keys
- Product slugs used as identifiers in URLs (e.g., `safflower-oil`)
- Order numbers format: `KM-YYYY-NNNN`
- Shipping: free over ₹999, else ₹60
- All prices in INR (₹)

## Common Tasks

**Add a new product:** Edit `backend/seed.py`, add product + variants, rebuild backend container

**Change shipping rules:** Edit `backend/main.py` (search for `shipping` in create_order)

**Update AI knowledge:** Edit `backend/agent.py` SYSTEM_PROMPT with new product info

**Add a new page:** Create `frontend/src/app/<route>/page.tsx`

**Modify styles:** Edit `frontend/src/globals.css` (uses CSS custom properties)
