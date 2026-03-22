#!/usr/bin/env python3
"""
KrishiMane App Flow PDF Builder
================================
Takes numbered JPEG screenshots from a directory and assembles them into
a professionally branded landscape-A4 PDF with a cover page.

Usage:
    python build_pdf.py <screenshots_directory>
    python build_pdf.py                          # defaults to ./screenshots

Requirements:
    pip install reportlab Pillow
"""

import os
import sys
from pathlib import Path

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

# ---------------------------------------------------------------------------
# Branding
# ---------------------------------------------------------------------------
DEEP_GREEN = HexColor("#1a3a0a")
MID_GREEN = HexColor("#2d5016")
GOLD = HexColor("#c8941a")
CREAM = HexColor("#faf6ed")

PAGE_W, PAGE_H = landscape(A4)  # ~842 x 595 points

# ---------------------------------------------------------------------------
# Screenshot manifest  (filename prefix -> caption)
# ---------------------------------------------------------------------------
CAPTIONS = {
    "01": "Home Page - Hero Section",
    "02": "Products Collection",
    "03": "Product Cards with Pricing & Variants",
    "04": "Login Page",
    "05": "Register Page",
    "06": "Shopping Cart",
    "07": "Checkout - Delivery Address",
    "08": "Admin Dashboard - Overview",
    "09": "Admin Dashboard - Order Management",
    "10": "Admin Dashboard - Product Management",
    "11": "Admin Dashboard - Registered Users",
    "12": "Admin Dashboard - Grain to Oil Inventory",
    "13": "Admin Dashboard - Inventory Detail (Safflower)",
    "14": "AI Chat Widget - KrishiMane Advisor",
    "15": "Quality & Nutrition Analysis",
}

OUTPUT_PATH = Path(__file__).resolve().parent / "KrishiMane_App_Flow.pdf"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _draw_background(c):
    """Fill the page with the cream background."""
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


def _draw_header_bar(c, height=28):
    """Thin deep-green bar across the top of every page."""
    c.setFillColor(DEEP_GREEN)
    c.rect(0, PAGE_H - height, PAGE_W, height, stroke=0, fill=1)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20, PAGE_H - height + 9, "KrishiMane")

    c.setFillColor(HexColor("#ffffff"))
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - 20, PAGE_H - height + 9,
                      "Premium Cold-Pressed Oils from Indian Farms")


def _draw_footer_bar(c, page_num, total_pages, height=22):
    """Thin bar at the bottom with page numbers."""
    c.setFillColor(DEEP_GREEN)
    c.rect(0, 0, PAGE_W, height, stroke=0, fill=1)

    c.setFillColor(HexColor("#ffffff"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_W / 2, 7,
                        f"Page {page_num} of {total_pages}")


def _draw_gold_rule(c, y, width=None):
    """Horizontal gold decorative line."""
    width = width or PAGE_W * 0.4
    x_start = (PAGE_W - width) / 2
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    c.line(x_start, y, x_start + width, y)


# ---------------------------------------------------------------------------
# Cover page
# ---------------------------------------------------------------------------
def _draw_cover(c):
    # Full-page deep green background
    c.setFillColor(DEEP_GREEN)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Decorative gold border inset
    inset = 30
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.rect(inset, inset, PAGE_W - 2 * inset, PAGE_H - 2 * inset,
           stroke=1, fill=0)

    # Inner thin line
    inset2 = 35
    c.setLineWidth(0.5)
    c.rect(inset2, inset2, PAGE_W - 2 * inset2, PAGE_H - 2 * inset2,
           stroke=1, fill=0)

    # Title
    cy = PAGE_H / 2 + 80
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 42)
    c.drawCentredString(PAGE_W / 2, cy, "KrishiMane")

    # Gold rule
    _draw_gold_rule(c, cy - 18, PAGE_W * 0.35)

    # Tagline
    c.setFillColor(HexColor("#ffffff"))
    c.setFont("Helvetica", 16)
    c.drawCentredString(PAGE_W / 2, cy - 50,
                        "Premium Cold-Pressed Natural Oils from Indian Farms")

    # Subtitle
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(PAGE_W / 2, cy - 110, "Application Flow & Screenshots")

    # Description lines
    c.setFillColor(HexColor("#cccccc"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(PAGE_W / 2, cy - 155,
                        "Full-Stack E-Commerce Platform")
    c.drawCentredString(PAGE_W / 2, cy - 175,
                        "Next.js  |  FastAPI  |  LangGraph AI Advisor  |  Docker")

    # Bottom text
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, 55, "Developed by Amit Shinde")


# ---------------------------------------------------------------------------
# Screenshot page
# ---------------------------------------------------------------------------
def _draw_screenshot_page(c, image_path, caption, page_num, total_pages):
    _draw_background(c)
    _draw_header_bar(c)
    _draw_footer_bar(c, page_num, total_pages)

    header_h = 28
    footer_h = 22
    caption_area_h = 50  # space reserved below image for caption
    padding = 18

    # Available area for the image
    avail_w = PAGE_W - 2 * padding
    avail_h = PAGE_H - header_h - footer_h - caption_area_h - 2 * padding

    # Open image to get aspect ratio
    with Image.open(image_path) as img:
        img_w, img_h = img.size

    aspect = img_w / img_h

    # Fit image within available area, preserving aspect ratio
    if avail_w / avail_h > aspect:
        # Height-constrained
        draw_h = avail_h
        draw_w = draw_h * aspect
    else:
        # Width-constrained
        draw_w = avail_w
        draw_h = draw_w / aspect

    x = (PAGE_W - draw_w) / 2
    y = footer_h + caption_area_h + padding + (avail_h - draw_h) / 2

    # Drop shadow (subtle)
    c.setFillColor(HexColor("#00000022"))
    c.rect(x + 3, y - 3, draw_w, draw_h, stroke=0, fill=1)

    # Thin border around image
    c.setStrokeColor(MID_GREEN)
    c.setLineWidth(1)
    c.rect(x - 1, y - 1, draw_w + 2, draw_h + 2, stroke=1, fill=0)

    # Draw image
    c.drawImage(ImageReader(image_path), x, y, draw_w, draw_h,
                preserveAspectRatio=True, mask='auto')

    # Caption
    caption_y = footer_h + padding + 12
    c.setFillColor(DEEP_GREEN)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, caption_y, caption)

    # Small gold accent under caption
    _draw_gold_rule(c, caption_y - 6, len(caption) * 5.5)


# ---------------------------------------------------------------------------
# Table of Contents page
# ---------------------------------------------------------------------------
def _draw_toc(c, found_screenshots):
    _draw_background(c)
    _draw_header_bar(c)

    c.setFillColor(DEEP_GREEN)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 70, "Table of Contents")
    _draw_gold_rule(c, PAGE_H - 82, 180)

    y = PAGE_H - 115
    for idx, (prefix, _path, caption) in enumerate(found_screenshots, start=1):
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(PAGE_W * 0.18, y, f"{idx:02d}.")

        c.setFillColor(DEEP_GREEN)
        c.setFont("Helvetica", 11)
        c.drawString(PAGE_W * 0.22, y, caption)

        # Dotted leader
        c.setStrokeColor(HexColor("#aaaaaa"))
        c.setDash(1, 3)
        c.setLineWidth(0.5)
        text_end = PAGE_W * 0.22 + c.stringWidth(caption, "Helvetica", 11) + 8
        leader_end = PAGE_W * 0.78
        if text_end < leader_end:
            c.line(text_end, y + 2, leader_end, y + 2)
        c.setDash()

        c.setFillColor(MID_GREEN)
        c.setFont("Helvetica", 11)
        c.drawRightString(PAGE_W * 0.82, y, f"Page {idx + 2}")

        y -= 26
        if y < 60:
            break  # safety


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def build_pdf(screenshot_dir: str):
    screenshot_dir = Path(screenshot_dir)
    if not screenshot_dir.is_dir():
        print(f"ERROR: Directory not found: {screenshot_dir}")
        sys.exit(1)

    # Discover screenshots
    found = []
    for prefix, caption in sorted(CAPTIONS.items()):
        matches = sorted(screenshot_dir.glob(f"{prefix}_*.jpg")) + \
                  sorted(screenshot_dir.glob(f"{prefix}_*.jpeg")) + \
                  sorted(screenshot_dir.glob(f"{prefix}_*.png"))
        if matches:
            found.append((prefix, str(matches[0]), caption))
        else:
            print(f"  WARNING: No image found for {prefix} ({caption})")

    if not found:
        print("ERROR: No screenshot images found in the directory.")
        sys.exit(1)

    print(f"Found {len(found)} screenshots. Building PDF...")

    total_pages = len(found) + 2  # cover + TOC + screenshot pages

    c = canvas.Canvas(str(OUTPUT_PATH), pagesize=landscape(A4))
    c.setTitle("KrishiMane - Application Flow & Screenshots")
    c.setAuthor("Amit Shinde")
    c.setSubject("KrishiMane E-Commerce Platform - App Screenshots")

    # Page 1: Cover
    _draw_cover(c)
    c.showPage()

    # Page 2: Table of Contents
    _draw_toc(c, found)
    c.showPage()

    # Pages 3+: Screenshots
    for idx, (prefix, img_path, caption) in enumerate(found, start=1):
        page_num = idx + 2
        _draw_screenshot_page(c, img_path, caption, page_num, total_pages)
        c.showPage()
        print(f"  Added: {caption}")

    c.save()
    print(f"\nPDF saved to: {OUTPUT_PATH}")
    print(f"Total pages: {total_pages}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        # Default: look for a 'screenshots' folder next to this script
        directory = str(Path(__file__).resolve().parent / "screenshots")

    build_pdf(directory)
