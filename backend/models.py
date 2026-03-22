"""
KrishiMane SQLAlchemy Models
- User, Product, ProductVariant, Order, OrderItem, Inventory
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean,
    ForeignKey, DateTime, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


# ─── User ────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(15), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer")  # "customer" | "admin"
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


# ─── Product ─────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=gen_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    emoji = Column(String(10), default="🫒")
    badge = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    img = Column(String(500), nullable=True)
    tags = Column(String(500), nullable=True)  # comma-separated
    category = Column(String(100), default="oil")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")


# ─── Product Variant ─────────────────────────────────────────
class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(String, primary_key=True, default=gen_uuid)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    label = Column(String(100), nullable=False)  # e.g. "500 ml • Glass Bottle"
    price = Column(Float, nullable=False)
    weight = Column(Float, default=0)  # grams
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    product = relationship("Product", back_populates="variants")


# ─── Order ───────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=gen_uuid)
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Address
    addr_name = Column(String(200))
    addr_phone = Column(String(15))
    addr_pin = Column(String(10))
    addr_city = Column(String(100))
    addr_state = Column(String(50))
    addr_line1 = Column(String(500))
    addr_line2 = Column(String(500), nullable=True)

    # Totals
    subtotal = Column(Float, default=0)
    shipping = Column(Float, default=0)
    gst = Column(Float, default=0)
    grand_total = Column(Float, default=0)

    # Payment
    payment_method = Column(String(20), default="cod")  # "razorpay" | "cod"
    payment_status = Column(String(20), default="pending")  # "pending" | "paid" | "failed"
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)

    # Status
    status = Column(String(20), default="placed")  # placed | confirmed | shipped | delivered | cancelled

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


# ─── Order Item ──────────────────────────────────────────────
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=gen_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    variant_id = Column(String, ForeignKey("product_variants.id"), nullable=False)
    product_name = Column(String(200))
    variant_label = Column(String(100))
    price = Column(Float, nullable=False)
    qty = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    variant = relationship("ProductVariant")


# ─── Inventory (Grain → Oil Tracking) ──────────────────────
class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String, primary_key=True, default=gen_uuid)
    product_id = Column(String, ForeignKey("products.id"), unique=True, nullable=False)
    grain_stock_kg = Column(Float, default=0)        # Total grain purchased (kg)
    oil_yield_pct = Column(Float, default=0)          # e.g. 22 means 100kg grain → 22kg oil
    grain_used_kg = Column(Float, default=0)          # Grain consumed so far (kg)
    oil_produced_kg = Column(Float, default=0)        # Total oil produced (kg)
    oil_sold_kg = Column(Float, default=0)            # Oil sold via orders (kg)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product")
