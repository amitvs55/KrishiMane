"""
KrishiMane Backend — FastAPI + LangGraph + SSE streaming + Auth + Products + Orders
Run: uvicorn main:app --reload --port 8000
"""

import asyncio
import json
import random
from datetime import datetime
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from agent import build_graph, create_initial_state, SYSTEM_PROMPT, llm
from database import get_db, init_db
from models import Product, ProductVariant, Order, OrderItem, User, Inventory
from auth import register_user, login_user, get_current_user
import os
import hmac
import hashlib
from dotenv import load_dotenv
from typing import Optional
import razorpay

load_dotenv()

# ─── Razorpay Client ────────────────────────────────────────
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None

app = FastAPI(
    title="KrishiMane API",
    description="LangGraph-powered oil recommendation chatbot with auth, products & orders",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()


# ─── Startup ─────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()


# ─── Request Models ──────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class OrderItemIn(BaseModel):
    variant_id: str
    qty: int


class CreateOrderRequest(BaseModel):
    items: list[OrderItemIn]
    addr_name: str
    addr_phone: str
    addr_pin: str
    addr_city: str
    addr_state: str
    addr_line1: str
    addr_line2: str = ""
    payment_method: str = "cod"


class UpdateOrderStatusRequest(BaseModel):
    status: str


class UpdateVariantRequest(BaseModel):
    price: Optional[float] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


class UpdateInventoryRequest(BaseModel):
    grain_stock_kg: Optional[float] = None
    grain_used_kg: Optional[float] = None
    oil_produced_kg: Optional[float] = None


class VariantIn(BaseModel):
    label: str
    price: float
    weight: float = 0
    stock: int = 100


class CreateProductRequest(BaseModel):
    name: str
    slug: str
    emoji: str = "🫒"
    badge: str = ""
    description: str = ""
    img: str = ""
    tags: str = ""
    category: str = "oil"
    variants: list[VariantIn] = []
    yield_pct: float = 0
    grain_stock_kg: float = 50000


class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    badge: Optional[str] = None
    description: Optional[str] = None
    img: Optional[str] = None
    tags: Optional[str] = None
    category: Optional[str] = None


class PaymentVerifyRequest(BaseModel):
    order_id: str
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


# ─── Helpers ─────────────────────────────────────────────────
def _get_user_from_header(authorization: Optional[str]) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1] if " " in authorization else ""
    return get_current_user(token)


def _require_user(authorization: Optional[str] = Header(None)) -> dict:
    user = _get_user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user


def _require_admin(authorization: Optional[str] = Header(None)) -> dict:
    user = _require_user(authorization)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


def _generate_order_number() -> str:
    yr = datetime.utcnow().year
    num = random.randint(1000, 9999)
    return f"KM-{yr}-{num}"


# Maps variant labels to estimated kg of product sold
def _variant_oil_kg(label: str) -> float:
    """Estimate kg of product from variant label (oils, aata, cookies)."""
    label_lower = label.lower()
    # Oil: density ≈ 0.92 kg/L
    if "1 l" in label_lower or "1l" in label_lower:
        return 0.92
    elif "500 ml" in label_lower:
        return 0.46
    elif "250 ml" in label_lower:
        return 0.23
    # Aata/flour: weight in grams or kg
    elif "5 kg" in label_lower:
        return 5.0
    elif "2 kg" in label_lower:
        return 2.0
    elif "1 kg" in label_lower:
        return 1.0
    elif "500 g" in label_lower:
        return 0.5
    # Cookies: weight in grams
    elif "400 g" in label_lower:
        return 0.4
    elif "200 g" in label_lower:
        return 0.2
    return 0.0


# ─── Root / Health ───────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "service": "KrishiMane API", "version": "3.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# ─── Auth Routes ─────────────────────────────────────────────
@app.post("/auth/register")
async def register(req: RegisterRequest):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")
    if not req.email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")
    if not req.phone.strip():
        raise HTTPException(status_code=400, detail="Phone is required.")
    result = register_user(req.name, req.email, req.phone, req.password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.post("/auth/login")
async def login(req: LoginRequest):
    result = login_user(req.email, req.password)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result


@app.get("/auth/me")
async def me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    parts = authorization.split(" ", 1)
    token = parts[1] if len(parts) == 2 else ""
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user


# ─── Product Routes ──────────────────────────────────────────
@app.get("/products")
async def list_products(db: Session = Depends(get_db)):
    """List all active products with their variants."""
    products = db.query(Product).filter(Product.is_active == True).all()
    result = []
    for p in products:
        variants = [
            {
                "id": v.id,
                "label": v.label,
                "price": v.price,
                "weight": v.weight,
                "stock": v.stock,
            }
            for v in p.variants
            if v.is_active
        ]
        result.append({
            "id": p.id,
            "slug": p.slug,
            "name": p.name,
            "emoji": p.emoji,
            "badge": p.badge,
            "img": p.img,
            "tags": p.tags.split(",") if p.tags else [],
            "description": p.description,
            "category": p.category,
            "variants": variants,
        })
    return result


@app.get("/products/{slug}")
async def get_product(slug: str, db: Session = Depends(get_db)):
    """Get a single product by slug."""
    product = db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    variants = [
        {
            "id": v.id,
            "label": v.label,
            "price": v.price,
            "weight": v.weight,
            "stock": v.stock,
        }
        for v in product.variants
        if v.is_active
    ]
    return {
        "id": product.id,
        "slug": product.slug,
        "name": product.name,
        "emoji": product.emoji,
        "badge": product.badge,
        "img": product.img,
        "tags": product.tags.split(",") if product.tags else [],
        "description": product.description,
        "category": product.category,
        "variants": variants,
    }


# ─── Order Routes ────────────────────────────────────────────
@app.post("/orders")
async def create_order(
    req: CreateOrderRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_user),
):
    """Place a new order. Requires auth."""
    if not req.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item.")

    # Look up user in DB by email
    db_user = db.query(User).filter(User.email == user["email"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found in database.")

    # Validate items and calculate totals
    subtotal = 0.0
    order_items = []

    for item_in in req.items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item_in.variant_id).first()
        if not variant:
            raise HTTPException(status_code=400, detail=f"Variant {item_in.variant_id} not found.")
        if variant.stock < item_in.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {variant.label}. Available: {variant.stock}",
            )

        product = db.query(Product).filter(Product.id == variant.product_id).first()
        line_total = variant.price * item_in.qty
        subtotal += line_total

        order_items.append(OrderItem(
            variant_id=variant.id,
            product_name=product.name if product else "Unknown",
            variant_label=variant.label,
            price=variant.price,
            qty=item_in.qty,
        ))

        # Decrement stock
        variant.stock -= item_in.qty

        # Track oil sold in inventory (grain_used is admin-controlled)
        inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if inv:
            oil_kg_sold = _variant_oil_kg(variant.label) * item_in.qty
            inv.oil_sold_kg += oil_kg_sold

    # Shipping & GST
    is_free_shipping = subtotal >= 999
    shipping = 0.0 if is_free_shipping else 60.0
    gst = round((subtotal + shipping) * 0.05, 2)
    grand_total = round(subtotal + shipping + gst, 2)

    # Create Razorpay order if payment method is razorpay
    razorpay_order_id = None
    if req.payment_method == "razorpay":
        if not razorpay_client:
            raise HTTPException(status_code=500, detail="Razorpay is not configured.")
        try:
            rz_order = razorpay_client.order.create({
                "amount": int(grand_total * 100),  # Razorpay expects paise
                "currency": "INR",
                "receipt": _generate_order_number(),
                "payment_capture": 1,  # Auto-capture
            })
            razorpay_order_id = rz_order["id"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

    order = Order(
        order_number=_generate_order_number(),
        user_id=db_user.id,
        addr_name=req.addr_name,
        addr_phone=req.addr_phone,
        addr_pin=req.addr_pin,
        addr_city=req.addr_city,
        addr_state=req.addr_state,
        addr_line1=req.addr_line1,
        addr_line2=req.addr_line2,
        subtotal=subtotal,
        shipping=shipping,
        gst=gst,
        grand_total=grand_total,
        payment_method=req.payment_method,
        payment_status="pending" if req.payment_method == "razorpay" else "cod",
        razorpay_order_id=razorpay_order_id,
        status="placed" if req.payment_method == "cod" else "pending_payment",
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "grand_total": order.grand_total,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_key_id": RAZORPAY_KEY_ID if razorpay_order_id else None,
    }


@app.get("/orders")
async def list_orders(
    db: Session = Depends(get_db),
    user: dict = Depends(_require_user),
):
    """List orders for current user (or all orders for admin)."""
    db_user = db.query(User).filter(User.email == user["email"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.get("role") == "admin":
        orders = db.query(Order).order_by(Order.created_at.desc()).all()
    else:
        orders = db.query(Order).filter(Order.user_id == db_user.id).order_by(Order.created_at.desc()).all()

    return [
        {
            "order_id": o.id,
            "order_number": o.order_number,
            "grand_total": o.grand_total,
            "status": o.status,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "item_count": len(o.items),
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@app.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_user),
):
    """Get order details."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Only allow owner or admin
    db_user = db.query(User).filter(User.email == user["email"]).first()
    if user.get("role") != "admin" and order.user_id != db_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "subtotal": order.subtotal,
        "shipping": order.shipping,
        "gst": order.gst,
        "grand_total": order.grand_total,
        "address": {
            "name": order.addr_name,
            "phone": order.addr_phone,
            "pin": order.addr_pin,
            "city": order.addr_city,
            "state": order.addr_state,
            "line1": order.addr_line1,
            "line2": order.addr_line2,
        },
        "items": [
            {
                "product_name": i.product_name,
                "variant_label": i.variant_label,
                "price": i.price,
                "qty": i.qty,
                "total": i.price * i.qty,
            }
            for i in order.items
        ],
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


@app.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    req: UpdateOrderStatusRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: update order status."""
    valid_statuses = ["placed", "confirmed", "shipped", "delivered", "cancelled"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.status = req.status
    db.commit()
    return {"order_id": order.id, "status": order.status}


# ─── Admin Routes ────────────────────────────────────────────
@app.get("/admin/stats")
async def admin_stats(
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: dashboard summary stats."""
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.sum(Order.grand_total)).scalar() or 0
    total_users = db.query(func.count(User.id)).filter(User.role == "customer").scalar() or 0
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0

    # Orders by status
    status_counts = dict(
        db.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )

    # Recent orders (last 10)
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_users": total_users,
        "total_products": total_products,
        "orders_by_status": status_counts,
        "recent_orders": [
            {
                "order_id": o.id,
                "order_number": o.order_number,
                "grand_total": o.grand_total,
                "status": o.status,
                "item_count": len(o.items),
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders
        ],
    }


@app.get("/admin/users")
async def admin_list_users(
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: list all users."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "order_count": len(u.orders),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@app.post("/admin/products")
async def admin_create_product(
    req: CreateProductRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: create a new product with variants and inventory."""
    if not req.name.strip() or not req.slug.strip():
        raise HTTPException(status_code=400, detail="Name and slug are required.")

    existing = db.query(Product).filter(Product.slug == req.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with slug '{req.slug}' already exists.")

    product = Product(
        slug=req.slug,
        name=req.name,
        emoji=req.emoji,
        badge=req.badge,
        description=req.description,
        img=req.img,
        tags=req.tags,
        category=req.category,
    )
    db.add(product)
    db.flush()

    for v in req.variants:
        variant = ProductVariant(
            product_id=product.id,
            label=v.label,
            price=v.price,
            weight=v.weight,
            stock=v.stock,
        )
        db.add(variant)

    if req.yield_pct > 0:
        inv = Inventory(
            product_id=product.id,
            grain_stock_kg=req.grain_stock_kg,
            oil_yield_pct=req.yield_pct,
            grain_used_kg=0,
            oil_produced_kg=0,
            oil_sold_kg=0,
        )
        db.add(inv)

    db.commit()
    db.refresh(product)
    return {
        "id": product.id,
        "slug": product.slug,
        "name": product.name,
        "category": product.category,
        "variant_count": len(req.variants),
    }


@app.put("/admin/products/{product_id}")
async def admin_toggle_product(
    product_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: toggle product active/inactive."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    product.is_active = not product.is_active
    db.commit()
    return {"id": product.id, "name": product.name, "is_active": product.is_active}


@app.patch("/admin/products/{product_id}")
async def admin_update_product(
    product_id: str,
    req: UpdateProductRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: update product details (name, emoji, badge, description, img, tags, category)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if req.name is not None:
        product.name = req.name
    if req.emoji is not None:
        product.emoji = req.emoji
    if req.badge is not None:
        product.badge = req.badge
    if req.description is not None:
        product.description = req.description
    if req.img is not None:
        product.img = req.img
    if req.tags is not None:
        product.tags = req.tags
    if req.category is not None:
        product.category = req.category
    db.commit()
    return {"id": product.id, "name": product.name, "updated": True}


@app.put("/admin/variants/{variant_id}")
async def admin_update_variant(
    variant_id: str,
    req: UpdateVariantRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: update variant price, stock, or active status."""
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found.")
    if req.price is not None:
        variant.price = req.price
    if req.stock is not None:
        variant.stock = req.stock
    if req.is_active is not None:
        variant.is_active = req.is_active
    db.commit()
    return {
        "id": variant.id,
        "label": variant.label,
        "price": variant.price,
        "stock": variant.stock,
        "is_active": variant.is_active,
    }


@app.post("/admin/products/{product_id}/variants")
async def admin_add_variant(
    product_id: str,
    req: VariantIn,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: add a new variant to an existing product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    variant = ProductVariant(
        product_id=product.id,
        label=req.label,
        price=req.price,
        weight=req.weight,
        stock=req.stock,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return {"id": variant.id, "label": variant.label, "price": variant.price, "stock": variant.stock}


@app.get("/admin/products")
async def admin_list_products(
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: list ALL products (including inactive) with variants."""
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "slug": p.slug,
            "name": p.name,
            "emoji": p.emoji,
            "badge": p.badge,
            "img": p.img,
            "tags": p.tags,
            "description": p.description,
            "category": p.category,
            "is_active": p.is_active,
            "variants": [
                {
                    "id": v.id,
                    "label": v.label,
                    "price": v.price,
                    "stock": v.stock,
                    "is_active": v.is_active,
                }
                for v in p.variants
            ],
        }
        for p in products
    ]


# ─── Inventory Routes ────────────────────────────────────────
@app.get("/admin/inventory")
async def admin_inventory(
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: get grain→oil inventory for all products."""
    inventories = db.query(Inventory).all()
    result = []
    for inv in inventories:
        product = inv.product
        # Oil produced = only from grain actually used in machine
        oil_produced = inv.grain_used_kg * (inv.oil_yield_pct / 100.0)
        grain_remaining = inv.grain_stock_kg - inv.grain_used_kg
        oil_remaining = oil_produced - inv.oil_sold_kg
        result.append({
            "id": inv.id,
            "product_id": inv.product_id,
            "product_name": product.name if product else "Unknown",
            "product_emoji": product.emoji if product else "",
            "grain_stock_kg": round(inv.grain_stock_kg, 2),
            "grain_used_kg": round(inv.grain_used_kg, 2),
            "grain_remaining_kg": round(max(grain_remaining, 0), 2),
            "grain_pct_used": round((inv.grain_used_kg / inv.grain_stock_kg * 100), 1) if inv.grain_stock_kg > 0 else 0,
            "oil_yield_pct": inv.oil_yield_pct,
            "oil_produced_kg": round(oil_produced, 2),
            "oil_sold_kg": round(inv.oil_sold_kg, 2),
            "oil_remaining_kg": round(max(oil_remaining, 0), 2),
            "oil_pct_sold": round((inv.oil_sold_kg / oil_produced * 100), 1) if oil_produced > 0 else 0,
        })
    return result


@app.put("/admin/inventory/{product_id}")
async def admin_update_inventory(
    product_id: str,
    req: UpdateInventoryRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_admin),
):
    """Admin: update grain stock or grain used. Oil produced auto-calculates."""
    inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found for this product.")

    if req.grain_stock_kg is not None:
        inv.grain_stock_kg = req.grain_stock_kg

    if req.grain_used_kg is not None:
        inv.grain_used_kg = req.grain_used_kg

    # Auto-calculate oil produced from grain used
    inv.oil_produced_kg = inv.grain_used_kg * (inv.oil_yield_pct / 100.0)

    db.commit()
    grain_remaining = inv.grain_stock_kg - inv.grain_used_kg
    oil_remaining = inv.oil_produced_kg - inv.oil_sold_kg
    return {
        "product_id": inv.product_id,
        "grain_stock_kg": round(inv.grain_stock_kg, 2),
        "grain_used_kg": round(inv.grain_used_kg, 2),
        "grain_remaining_kg": round(max(grain_remaining, 0), 2),
        "oil_produced_kg": round(inv.oil_produced_kg, 2),
        "oil_sold_kg": round(inv.oil_sold_kg, 2),
        "oil_remaining_kg": round(max(oil_remaining, 0), 2),
    }


# ─── Payment Verification Route ──────────────────────────────
@app.post("/payments/verify")
async def verify_payment(
    req: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(_require_user),
):
    """Verify Razorpay payment signature and confirm order."""
    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.payment_method != "razorpay":
        raise HTTPException(status_code=400, detail="This order is not a Razorpay order.")

    # Verify signature: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
    message = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if expected_signature != req.razorpay_signature:
        order.payment_status = "failed"
        order.status = "cancelled"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed. Invalid signature.")

    # Payment verified — update order
    order.razorpay_payment_id = req.razorpay_payment_id
    order.payment_status = "paid"
    order.status = "confirmed"
    db.commit()

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "payment_status": order.payment_status,
        "message": "Payment verified successfully!",
    }


# ─── Chat Route ──────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def event_generator():
        try:
            state = create_initial_state(req.message, req.history)
            history_msgs = []
            for h in req.history:
                if h["role"] == "user":
                    history_msgs.append(HumanMessage(content=h["content"]))
                elif h["role"] == "assistant":
                    history_msgs.append(AIMessage(content=h["content"]))
            history_msgs.append(HumanMessage(content=req.message))
            langchain_msgs = [SystemMessage(content=SYSTEM_PROMPT)] + history_msgs
            async for chunk in llm.astream(langchain_msgs):
                token = chunk.content
                if token:
                    data = json.dumps({"token": token})
                    yield {"data": data}
                await asyncio.sleep(0)
            yield {"data": "[DONE]"}
        except Exception as e:
            error_msg = f"Sorry, I encountered an error: {str(e)}"
            yield {"data": json.dumps({"token": error_msg})}
            yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
