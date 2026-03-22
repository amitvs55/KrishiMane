"""
KrishiMane App Flow Documentation PDF Generator
Takes actual screenshots of all pages and compiles into a PDF.
Run: docker exec krishimane-backend python generate_pdf.py
"""
import os
import time
import requests
from datetime import datetime

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.platypus import KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Try to import playwright for screenshots
try:
    from playwright.sync_api import sync_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

# ── Config ──
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://frontend:3000"  # Docker internal
SCREENSHOTS_DIR = "/app/screenshots"
OUTPUT_PDF = "/app/KrishiMane_App_Flow.pdf"

# KrishiMane theme colors
GREEN_DEEP = HexColor("#1a3a0a")
GREEN_MID = HexColor("#2d5016")
GREEN_LIGHT = HexColor("#4a7c2a")
GOLD = HexColor("#c8941a")
GOLD_LIGHT = HexColor("#e8b84b")
CREAM = HexColor("#faf6ed")
TEXT_DARK = HexColor("#1c1a14")

# ── Screenshot Capture ──
def capture_screenshots():
    """Capture screenshots of all app pages using Playwright."""
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

    if not HAS_PLAYWRIGHT:
        print("Playwright not available, skipping screenshots")
        return []

    screenshots = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Wait for frontend to be ready
        for attempt in range(5):
            try:
                page.goto(FRONTEND_URL, timeout=10000)
                break
            except:
                print(f"Waiting for frontend... attempt {attempt+1}")
                time.sleep(3)

        # Helper to capture
        def capture(name, description, actions=None):
            path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
            if actions:
                actions(page)
                page.wait_for_timeout(1000)
            page.screenshot(path=path, full_page=False)
            screenshots.append({"path": path, "name": name, "description": description})
            print(f"  Captured: {name}")

        # 1. Home Hero
        print("Capturing screenshots...")
        page.goto(FRONTEND_URL, wait_until="networkidle")
        page.wait_for_timeout(1500)
        capture("01_home_hero", "Home Page - Hero Section with Kannada tagline, CTAs, and stats")

        # 2. Products Section
        def go_products(p):
            p.click("text=Products")
            p.wait_for_timeout(1000)
        capture("02_products_section", "Products Tab - Artisanal Cold-Pressed Oils Collection", go_products)

        # 3. Product Cards (scroll down)
        def scroll_products(p):
            p.evaluate("window.scrollBy(0, 500)")
            p.wait_for_timeout(500)
        capture("03_product_cards", "Product Cards - Variant selection, pricing, Add to Cart", scroll_products)

        # 4. Analysis Tab
        def go_analysis(p):
            p.evaluate("window.scrollTo(0, 0)")
            p.click("text=Analysis")
            p.wait_for_timeout(1000)
        capture("04_analysis", "Analysis Tab - Quality & Nutrition Analysis", go_analysis)

        # 5. Login Page
        def go_login(p):
            p.goto(FRONTEND_URL + "/login", wait_until="networkidle")
        capture("05_login", "Login Page - Email/password authentication", go_login)

        # 6. Register Page
        def go_register(p):
            p.goto(FRONTEND_URL + "/register", wait_until="networkidle")
        capture("06_register", "Registration Page - New customer sign-up form", go_register)

        # 7. Login as test user to access cart/checkout
        def do_login(p):
            p.goto(FRONTEND_URL + "/login", wait_until="networkidle")
            p.fill('input[type="email"]', "test@test.com")
            p.fill('input[type="password"]', "test123")
            p.click("text=Sign In")
            p.wait_for_timeout(2000)
        do_login(page)

        # 8. Add item to cart first
        page.goto(FRONTEND_URL, wait_until="networkidle")
        page.click("text=Products")
        page.wait_for_timeout(1000)
        try:
            page.click("text=Add to Cart", timeout=3000)
            page.wait_for_timeout(1000)
        except:
            pass

        # 9. Cart Page
        def go_cart(p):
            p.goto(FRONTEND_URL + "/cart", wait_until="networkidle")
        capture("07_cart", "Shopping Cart - Items, quantity controls, order summary, promo code", go_cart)

        # 10. Checkout Page
        def go_checkout(p):
            try:
                p.click("text=Proceed to Checkout", timeout=3000)
                p.wait_for_timeout(2000)
            except:
                p.goto(FRONTEND_URL + "/checkout", wait_until="networkidle")
        capture("08_checkout", "Checkout - 3-step flow: Delivery address, Review, Payment", go_checkout)

        # 11. Login as admin for dashboard
        def admin_login(p):
            p.goto(FRONTEND_URL + "/login", wait_until="networkidle")
            p.fill('input[type="email"]', "admin@krishimane.com")
            p.fill('input[type="password"]', "admin123")
            p.click("text=Sign In")
            p.wait_for_timeout(2000)
        admin_login(page)

        # 12. Admin Overview
        def go_admin(p):
            p.goto(FRONTEND_URL + "/admin", wait_until="networkidle")
            p.wait_for_timeout(1000)
        capture("09_admin_overview", "Admin Dashboard - Overview with stats, order status, recent orders", go_admin)

        # 13. Admin Orders
        def go_admin_orders(p):
            p.click("text=Orders")
            p.wait_for_timeout(1000)
        capture("10_admin_orders", "Admin Orders - Order management with status updates", go_admin_orders)

        # 14. Admin Products
        def go_admin_products(p):
            p.click("text=Products")
            p.wait_for_timeout(1000)
        capture("11_admin_products", "Admin Products - Product & variant management", go_admin_products)

        # 15. Admin Users
        def go_admin_users(p):
            p.click("text=Users")
            p.wait_for_timeout(1000)
        capture("12_admin_users", "Admin Users - Registered users with roles and order counts", go_admin_users)

        # 16. Admin Inventory
        def go_admin_inventory(p):
            p.click("text=Inventory")
            p.wait_for_timeout(1000)
        capture("13_admin_inventory", "Admin Inventory - Grain to Oil tracking with yield ratios", go_admin_inventory)

        # 17. AI Chat Widget
        def go_chat(p):
            p.goto(FRONTEND_URL, wait_until="networkidle")
            p.wait_for_timeout(1000)
            try:
                # Click the chat bubble
                p.locator('.chat-toggle-btn, .chat-bubble, [class*="chat"]').last.click()
                p.wait_for_timeout(2000)
            except:
                pass
        capture("14_ai_chat", "AI Chat Advisor - Gemini-powered product recommendations", go_chat)

        browser.close()

    print(f"Total screenshots captured: {len(screenshots)}")
    return screenshots


# ── PDF Generation ──
def build_pdf(screenshots):
    """Build a professional PDF with screenshots and descriptions."""

    WIDTH, HEIGHT = landscape(A4)
    c = canvas.Canvas(OUTPUT_PDF, pagesize=landscape(A4))

    def draw_bg(c):
        c.setFillColor(CREAM)
        c.rect(0, 0, WIDTH, HEIGHT, fill=1)

    def draw_header_bar(c):
        c.setFillColor(GREEN_DEEP)
        c.rect(0, HEIGHT - 50, WIDTH, 50, fill=1)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(30, HEIGHT - 35, "KrishiMane")
        c.setFillColor(white)
        c.setFont("Helvetica", 10)
        c.drawRightString(WIDTH - 30, HEIGHT - 35, "Pure Natural Oils | Farm Fresh")

    def draw_footer(c, page_num):
        c.setFillColor(GREEN_DEEP)
        c.rect(0, 0, WIDTH, 25, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica", 8)
        c.drawString(30, 8, f"KrishiMane App Flow Documentation | Generated: {datetime.now().strftime('%d %b %Y')}")
        c.drawRightString(WIDTH - 30, 8, f"Page {page_num}")

    # ── Cover Page ──
    draw_bg(c)
    c.setFillColor(GREEN_DEEP)
    c.rect(0, HEIGHT * 0.35, WIDTH, HEIGHT * 0.4, fill=1)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 48)
    c.drawCentredString(WIDTH / 2, HEIGHT * 0.6, "KrishiMane")

    c.setFillColor(GOLD_LIGHT)
    c.setFont("Helvetica", 18)
    c.drawCentredString(WIDTH / 2, HEIGHT * 0.52, "Pure Natural Oils  |  Farm Fresh  |  Cold-Pressed")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(WIDTH / 2, HEIGHT * 0.42, "Application Flow Documentation")

    c.setFillColor(TEXT_DARK)
    c.setFont("Helvetica", 14)
    c.drawCentredString(WIDTH / 2, HEIGHT * 0.25, f"Generated: {datetime.now().strftime('%d %B %Y')}")
    c.drawCentredString(WIDTH / 2, HEIGHT * 0.2, "Full-Stack E-Commerce Platform")

    c.setFont("Helvetica", 11)
    c.drawCentredString(WIDTH / 2, HEIGHT * 0.12, "Next.js 16 + FastAPI + PostgreSQL + Google Gemini AI + Razorpay + Docker")

    c.showPage()

    # ── Table of Contents ──
    draw_bg(c)
    draw_header_bar(c)
    draw_footer(c, 2)

    c.setFillColor(GREEN_DEEP)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(WIDTH / 2, HEIGHT - 90, "Table of Contents")

    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.line(WIDTH * 0.3, HEIGHT - 100, WIDTH * 0.7, HEIGHT - 100)

    toc_items = [
        "1. Home Page - Hero Section",
        "2. Products Collection",
        "3. Product Cards & Variants",
        "4. Quality & Nutrition Analysis",
        "5. User Login",
        "6. User Registration",
        "7. Shopping Cart",
        "8. Checkout Flow",
        "9. Admin Dashboard - Overview",
        "10. Admin - Order Management",
        "11. Admin - Product Management",
        "12. Admin - User Management",
        "13. Admin - Grain to Oil Inventory",
        "14. AI Chat Advisor",
    ]

    y = HEIGHT - 140
    for item in toc_items:
        c.setFillColor(TEXT_DARK)
        c.setFont("Helvetica", 13)
        c.drawString(WIDTH * 0.2, y, item)
        y -= 28

    c.showPage()

    # ── Screenshot Pages ──
    page_num = 3
    for ss in screenshots:
        draw_bg(c)
        draw_header_bar(c)
        draw_footer(c, page_num)

        # Section title
        c.setFillColor(GREEN_DEEP)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(WIDTH / 2, HEIGHT - 75, ss["description"])

        # Gold underline
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.5)
        text_width = c.stringWidth(ss["description"], "Helvetica-Bold", 16)
        c.line(WIDTH / 2 - text_width / 2, HEIGHT - 80, WIDTH / 2 + text_width / 2, HEIGHT - 80)

        # Screenshot image
        if os.path.exists(ss["path"]):
            img_width = WIDTH - 80
            img_height = HEIGHT - 145
            try:
                c.drawImage(ss["path"], 40, 35, width=img_width, height=img_height, preserveAspectRatio=True)
            except Exception as e:
                c.setFillColor(TEXT_DARK)
                c.setFont("Helvetica", 12)
                c.drawCentredString(WIDTH / 2, HEIGHT / 2, f"[Screenshot: {ss['name']}] - Error: {str(e)}")
        else:
            c.setFillColor(TEXT_DARK)
            c.setFont("Helvetica", 12)
            c.drawCentredString(WIDTH / 2, HEIGHT / 2, f"[Screenshot not found: {ss['name']}]")

        # Border around image area
        c.setStrokeColor(GREEN_LIGHT)
        c.setLineWidth(1)
        c.rect(38, 33, WIDTH - 76, HEIGHT - 140, fill=0)

        c.showPage()
        page_num += 1

    # ── Tech Stack Page ──
    draw_bg(c)
    draw_header_bar(c)
    draw_footer(c, page_num)

    c.setFillColor(GREEN_DEEP)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(WIDTH / 2, HEIGHT - 85, "Technology Stack")

    tech_data = [
        ["Layer", "Technology", "Purpose"],
        ["Frontend", "Next.js 16 + React 19 + TypeScript", "Server-side rendered UI with App Router"],
        ["Backend", "FastAPI + SQLAlchemy + Pydantic", "REST API with auto-docs at /docs"],
        ["Database", "PostgreSQL (Docker volume)", "Persistent relational data storage"],
        ["AI Chat", "Google Gemini 2.0 Flash + LangGraph", "Streaming AI product advisor (SSE)"],
        ["Payments", "Razorpay (Test Mode)", "3-step payment: create, popup, verify"],
        ["Auth", "JWT (HS256) + bcrypt", "24-hour token, password hashing"],
        ["DevOps", "Docker Compose (3 services)", "Frontend + Backend + PostgreSQL"],
        ["Inventory", "Custom Grain-to-Oil Tracker", "Yield-based oil production tracking"],
    ]

    table = Table(tech_data, colWidths=[100, 250, 300])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN_DEEP),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (-1, -1), CREAM),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CREAM, HexColor("#f0ece0")]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREEN_LIGHT),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    tw, th = table.wrapOn(c, WIDTH, HEIGHT)
    table.drawOn(c, (WIDTH - tw) / 2, HEIGHT - 110 - th)

    c.showPage()
    page_num += 1

    # ── API Endpoints Page ──
    draw_bg(c)
    draw_header_bar(c)
    draw_footer(c, page_num)

    c.setFillColor(GREEN_DEEP)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(WIDTH / 2, HEIGHT - 85, "API Endpoints Reference")

    api_data = [
        ["Method", "Endpoint", "Description"],
        ["POST", "/auth/register", "Register new customer"],
        ["POST", "/auth/login", "Login and get JWT token"],
        ["GET", "/auth/me", "Get current user profile"],
        ["GET", "/products", "List all active products"],
        ["GET", "/products/{slug}", "Get product details by slug"],
        ["POST", "/orders", "Create order (+ Razorpay)"],
        ["GET", "/orders", "List user's orders"],
        ["PUT", "/orders/{id}/status", "Update order status (admin)"],
        ["POST", "/payments/verify", "Verify Razorpay signature"],
        ["GET", "/admin/stats", "Dashboard statistics"],
        ["GET", "/admin/users", "List all users (admin)"],
        ["GET", "/admin/inventory", "Get inventory data"],
        ["PUT", "/admin/inventory/{id}", "Update inventory (admin)"],
        ["GET", "/chat", "SSE AI chat stream"],
    ]

    table2 = Table(api_data, colWidths=[60, 180, 250])
    table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN_DEEP),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('FONTNAME', (1, 1), (1, -1), 'Courier'),
        ('BACKGROUND', (0, 1), (-1, -1), CREAM),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CREAM, HexColor("#f0ece0")]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREEN_LIGHT),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    tw2, th2 = table2.wrapOn(c, WIDTH, HEIGHT)
    table2.drawOn(c, (WIDTH - tw2) / 2, HEIGHT - 110 - th2)

    c.showPage()

    c.save()
    print(f"\nPDF generated: {OUTPUT_PDF}")
    print(f"Total pages: {page_num + 1}")


# ── Main ──
if __name__ == "__main__":
    screenshots = capture_screenshots()
    if not screenshots:
        # If no playwright, check for pre-existing screenshots
        if os.path.isdir(SCREENSHOTS_DIR):
            for f in sorted(os.listdir(SCREENSHOTS_DIR)):
                if f.endswith('.png'):
                    screenshots.append({
                        "path": os.path.join(SCREENSHOTS_DIR, f),
                        "name": f.replace('.png', ''),
                        "description": f.replace('.png', '').replace('_', ' ').title()
                    })
    build_pdf(screenshots)
