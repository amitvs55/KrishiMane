"""
KrishiMane Seed Script
- Seeds products, variants, and admin user into the database
- Run: python seed.py
"""

from database import engine, SessionLocal, init_db
from models import Product, ProductVariant, User, Inventory
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PRODUCTS = [
    {
        "slug": "safflower",
        "name": "Safflower Oil",
        "emoji": "🌼",
        "badge": "Heart Healthy",
        "img": "/products/safflower.png",
        "tags": "High Linoleic,Light Flavour,High Smoke Point",
        "description": "Extracted from the vibrant safflower plant, this light golden oil is rich in linoleic acid. Ideal for high-heat cooking, salad dressings, and skincare. A powerhouse of heart-friendly unsaturated fats.",
        "category": "oil",
        "variants": [
            {"label": "250 ml • Glass Bottle", "price": 150, "weight": 350, "stock": 100},
            {"label": "500 ml • Glass Bottle", "price": 250, "weight": 600, "stock": 100},
            {"label": "1 L • Glass Bottle", "price": 450, "weight": 1100, "stock": 50},
        ],
    },
    {
        "slug": "sunflower",
        "name": "Sunflower Oil",
        "emoji": "🌻",
        "badge": "Vitamin E Rich",
        "img": "/products/sunflower.png",
        "tags": "Vitamin E,Light Taste,Versatile",
        "description": "Cold-pressed from sun-harvested sunflower seeds, delivering a delicate, nutty flavour. Packed with Vitamin E and low in saturated fat — perfect for everyday frying and baking.",
        "category": "oil",
        "variants": [
            {"label": "250 ml • Glass Bottle", "price": 140, "weight": 350, "stock": 100},
            {"label": "500 ml • Glass Bottle", "price": 240, "weight": 600, "stock": 100},
            {"label": "1 L • Glass Bottle", "price": 430, "weight": 1100, "stock": 50},
        ],
    },
    {
        "slug": "groundnut",
        "name": "Groundnut Oil",
        "emoji": "🥜",
        "badge": "Traditional",
        "img": "/products/groundnut.png",
        "tags": "Monounsaturated,Rich Flavour,Antioxidants",
        "description": "A beloved staple in Indian kitchens. Our wood-pressed groundnut oil carries a rich, natural peanut aroma that elevates every dish. Excellent for deep-frying and stir-fries.",
        "category": "oil",
        "variants": [
            {"label": "250 ml • Glass Bottle", "price": 160, "weight": 350, "stock": 100},
            {"label": "500 ml • Glass Bottle", "price": 280, "weight": 600, "stock": 100},
            {"label": "1 L • Glass Bottle", "price": 500, "weight": 1100, "stock": 50},
        ],
    },
    {
        "slug": "coconut",
        "name": "Coconut Oil",
        "emoji": "🥥",
        "badge": "Multi-Use",
        "img": "/products/coconut.png",
        "tags": "MCT Rich,Antimicrobial,Hair & Skin",
        "description": "Virgin coconut oil extracted using traditional cold-press methods. Bursting with medium-chain triglycerides (MCT) and lauric acid — nourishing for cooking, hair, and skin alike.",
        "category": "oil",
        "variants": [
            {"label": "250 ml • Glass Bottle", "price": 170, "weight": 350, "stock": 100},
            {"label": "500 ml • Glass Bottle", "price": 300, "weight": 600, "stock": 100},
            {"label": "1 L • Glass Bottle", "price": 550, "weight": 1100, "stock": 50},
        ],
    },
    # ── Chakki Aata (Old Pressed / Stone Ground) ──
    {
        "slug": "jowar-aata",
        "name": "Jowar Aata",
        "emoji": "🌾",
        "badge": "Gluten Free",
        "img": "/products/jowar-aata.svg",
        "tags": "Gluten Free,High Fibre,Iron Rich",
        "description": "Stone-ground jowar (sorghum) flour from traditional chakki. Rich in iron, fibre, and antioxidants. Perfect for making bhakri, roti, and healthy baking. Naturally gluten-free.",
        "category": "aata",
        "variants": [
            {"label": "500 g • Paper Pack", "price": 65, "weight": 550, "stock": 200},
            {"label": "1 kg • Paper Pack", "price": 120, "weight": 1050, "stock": 150},
            {"label": "2 kg • Paper Pack", "price": 220, "weight": 2100, "stock": 100},
        ],
    },
    {
        "slug": "bajra-aata",
        "name": "Bajra Aata",
        "emoji": "🌾",
        "badge": "Energy Boost",
        "img": "/products/bajra-aata.svg",
        "tags": "High Protein,Calcium Rich,Winter Special",
        "description": "Traditional chakki-ground bajra (pearl millet) flour. Packed with protein, calcium, and iron. Ideal for bajra roti, thalipeeth, and winter recipes. Keeps you warm and energised.",
        "category": "aata",
        "variants": [
            {"label": "500 g • Paper Pack", "price": 55, "weight": 550, "stock": 200},
            {"label": "1 kg • Paper Pack", "price": 100, "weight": 1050, "stock": 150},
            {"label": "2 kg • Paper Pack", "price": 185, "weight": 2100, "stock": 100},
        ],
    },
    {
        "slug": "wheat-aata",
        "name": "Wheat Aata",
        "emoji": "🌾",
        "badge": "Everyday Essential",
        "img": "/products/wheat-aata.svg",
        "tags": "Whole Grain,High Fibre,Versatile",
        "description": "Premium whole wheat flour from stone chakki. Retains the bran, germ, and endosperm for maximum nutrition. Makes soft, fluffy rotis and chapatis with a rustic aroma.",
        "category": "aata",
        "variants": [
            {"label": "1 kg • Paper Pack", "price": 60, "weight": 1050, "stock": 200},
            {"label": "2 kg • Paper Pack", "price": 110, "weight": 2100, "stock": 150},
            {"label": "5 kg • Paper Pack", "price": 260, "weight": 5100, "stock": 80},
        ],
    },
    {
        "slug": "ragi-aata",
        "name": "Ragi Aata",
        "emoji": "🌾",
        "badge": "Super Grain",
        "img": "/products/ragi-aata.svg",
        "tags": "Calcium Rich,Diabetic Friendly,Weight Loss",
        "description": "Chakki-ground ragi (finger millet) flour — the superfood of millets. Extremely rich in calcium and amino acids. Great for ragi mudde, dosa, porridge, and healthy snacks.",
        "category": "aata",
        "variants": [
            {"label": "500 g • Paper Pack", "price": 70, "weight": 550, "stock": 200},
            {"label": "1 kg • Paper Pack", "price": 130, "weight": 1050, "stock": 150},
            {"label": "2 kg • Paper Pack", "price": 240, "weight": 2100, "stock": 100},
        ],
    },
    {
        "slug": "chana-aata",
        "name": "Chana Aata",
        "emoji": "🌾",
        "badge": "Protein Rich",
        "img": "/products/chana-aata.svg",
        "tags": "High Protein,Low GI,Sattu Base",
        "description": "Stone-ground chana (chickpea) flour with a nutty flavour. High in protein and low glycemic index. Perfect for besan chilla, pakoras, sattu drinks, and Maharashtrian sweets.",
        "category": "aata",
        "variants": [
            {"label": "500 g • Paper Pack", "price": 75, "weight": 550, "stock": 200},
            {"label": "1 kg • Paper Pack", "price": 140, "weight": 1050, "stock": 150},
            {"label": "2 kg • Paper Pack", "price": 260, "weight": 2100, "stock": 100},
        ],
    },
    # ── Millet-Based Cookies ──
    {
        "slug": "ragi-cookies",
        "name": "Ragi Millet Cookies",
        "emoji": "🍪",
        "badge": "Calcium Rich",
        "img": "/products/ragi-cookies.svg",
        "tags": "No Maida,Jaggery Sweetened,Kids Friendly",
        "description": "Crunchy ragi cookies made with finger millet flour and jaggery. Zero maida, zero refined sugar. A guilt-free snack loaded with calcium — loved by kids and adults alike.",
        "category": "cookies",
        "variants": [
            {"label": "200 g • Box", "price": 99, "weight": 220, "stock": 150},
            {"label": "400 g • Family Pack", "price": 179, "weight": 430, "stock": 100},
        ],
    },
    {
        "slug": "bajra-cookies",
        "name": "Bajra Millet Cookies",
        "emoji": "🍪",
        "badge": "Iron Boost",
        "img": "/products/bajra-cookies.svg",
        "tags": "No Maida,Iron Rich,Energy Snack",
        "description": "Wholesome bajra cookies baked with pearl millet flour and natural sweeteners. Rich in iron and fibre. A perfect tea-time companion or on-the-go energy snack.",
        "category": "cookies",
        "variants": [
            {"label": "200 g • Box", "price": 89, "weight": 220, "stock": 150},
            {"label": "400 g • Family Pack", "price": 159, "weight": 430, "stock": 100},
        ],
    },
    {
        "slug": "jowar-cookies",
        "name": "Jowar Millet Cookies",
        "emoji": "🍪",
        "badge": "Gluten Free",
        "img": "/products/jowar-cookies.svg",
        "tags": "Gluten Free,No Maida,Digestive Friendly",
        "description": "Light and crispy jowar cookies made with sorghum flour. Naturally gluten-free and easy to digest. Sweetened with jaggery for a healthier crunch.",
        "category": "cookies",
        "variants": [
            {"label": "200 g • Box", "price": 95, "weight": 220, "stock": 150},
            {"label": "400 g • Family Pack", "price": 169, "weight": 430, "stock": 100},
        ],
    },
    {
        "slug": "multi-millet-cookies",
        "name": "Multi-Millet Cookies",
        "emoji": "🍪",
        "badge": "Bestseller",
        "img": "/products/multi-millet-cookies.svg",
        "tags": "Mixed Millets,No Maida,Superfood Snack",
        "description": "The best of all millets in one cookie! A blend of ragi, bajra, jowar, and foxtail millet. Baked with jaggery and cold-pressed oil. Our most popular healthy snack.",
        "category": "cookies",
        "variants": [
            {"label": "200 g • Box", "price": 109, "weight": 220, "stock": 150},
            {"label": "400 g • Family Pack", "price": 189, "weight": 430, "stock": 100},
        ],
    },
]

# Yield: how many kg of output from 100kg of raw input
YIELD_MAP = {
    # Oils: 100kg grain/seed → X kg oil
    "safflower": 22.0,
    "groundnut": 40.0,
    "sunflower": 44.0,
    "coconut": 40.0,
    # Aata: 100kg grain → X kg flour (chakki grinding loss ~5-15%)
    "jowar-aata": 88.0,
    "bajra-aata": 85.0,
    "wheat-aata": 90.0,
    "ragi-aata": 86.0,
    "chana-aata": 82.0,
    # Cookies: 100kg millet flour → X kg cookies (baking adds ingredients)
    "ragi-cookies": 130.0,
    "bajra-cookies": 130.0,
    "jowar-cookies": 130.0,
    "multi-millet-cookies": 130.0,
}

# Default grain stock per product (in kg)
DEFAULT_GRAIN_STOCK = {
    "safflower": 100_000.0,
    "groundnut": 100_000.0,
    "sunflower": 100_000.0,
    "coconut": 100_000.0,
    "jowar-aata": 50_000.0,
    "bajra-aata": 50_000.0,
    "wheat-aata": 80_000.0,
    "ragi-aata": 40_000.0,
    "chana-aata": 40_000.0,
    "ragi-cookies": 10_000.0,
    "bajra-cookies": 10_000.0,
    "jowar-cookies": 10_000.0,
    "multi-millet-cookies": 15_000.0,
}


def seed():
    """Seed the database with products and admin user."""
    init_db()
    db = SessionLocal()

    try:
        # ── Seed admin user ──
        existing_admin = db.query(User).filter(User.email == "admin@krishimane.com").first()
        if not existing_admin:
            admin = User(
                name="Admin",
                email="admin@krishimane.com",
                phone="9999999999",
                hashed_password=pwd_context.hash("admin123"),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("[+] Admin user created: admin@krishimane.com / admin123")
        else:
            print("[=] Admin user already exists.")

        # ── Seed products ──
        for p_data in PRODUCTS:
            existing = db.query(Product).filter(Product.slug == p_data["slug"]).first()
            if existing:
                print(f"[=] Product '{p_data['name']}' already exists, skipping.")
                continue

            product = Product(
                slug=p_data["slug"],
                name=p_data["name"],
                emoji=p_data.get("emoji", "🫒"),
                badge=p_data.get("badge"),
                img=p_data.get("img"),
                tags=p_data.get("tags"),
                description=p_data.get("description"),
                category=p_data.get("category", "oil"),
            )
            db.add(product)
            db.flush()  # get product.id

            for v_data in p_data.get("variants", []):
                variant = ProductVariant(
                    product_id=product.id,
                    label=v_data["label"],
                    price=v_data["price"],
                    weight=v_data.get("weight", 0),
                    stock=v_data.get("stock", 100),
                )
                db.add(variant)

            print(f"[+] Product '{p_data['name']}' seeded with {len(p_data.get('variants', []))} variants.")

        db.commit()

        # ── Seed inventory ──
        for slug, yield_pct in YIELD_MAP.items():
            product = db.query(Product).filter(Product.slug == slug).first()
            if not product:
                continue
            existing_inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
            if existing_inv:
                print(f"[=] Inventory for '{product.name}' already exists.")
                continue

            grain_stock = DEFAULT_GRAIN_STOCK.get(slug, 50_000.0)
            inv = Inventory(
                product_id=product.id,
                grain_stock_kg=grain_stock,
                oil_yield_pct=yield_pct,
                grain_used_kg=0,
                oil_produced_kg=0,
                oil_sold_kg=0,
            )
            db.add(inv)
            print(f"[+] Inventory for '{product.name}': {grain_stock}kg raw stock, yield {yield_pct}%")

        db.commit()
        print("\nSeeding complete!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
