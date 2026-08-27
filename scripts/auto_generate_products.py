#!/usr/bin/env python3
"""
Auto Product Generator for Himvedi Herbals
============================================

This script automatically:
1. Scans all category folders in images/products/
2. Generates product JSON entries from image filenames
3. Updates/creates main products.json with all products

Usage:
    python scripts/auto_generate_products.py          # Run once
    python scripts/auto_generate_products.py --force  # Force regenerate all

Categories: herbs, resin, oils, seeds, soap, namak, masala, mushroom
"""

import json
import os
import re
import sys
from pathlib import Path
from collections import Counter

# Configuration
BASE_DIR = Path(__file__).parent.parent
PRODUCTS_DIR = BASE_DIR / "images" / "products"
MAIN_JSON = BASE_DIR / "data" / "products.json"

# Category-specific configurations
CATEGORY_CONFIG = {
    "herbs": {
        "emoji": "🌿",
        "price_range": (5.99, 24.99),
        "default_weight": "500g",
        "unit_type": "weight",
        "weights": ["100g", "250g", "500g", "1 Kg", "5 Kg"],
        "multiplier": {"100g": 0.22, "250g": 0.48, "500g": 1, "1 Kg": 1.85, "5 Kg": 8.0},
        "forms": ["Raw Form", "Powder Form"],
        "default_form": "raw",
        "show_form_selector": True,
        "description_template": "Premium quality {name} sourced from organic farms. Traditionally used in Ayurvedic medicine for its therapeutic properties. Carefully processed to preserve potency and freshness."
    },
    "resin": {
        "emoji": "✨",
        "price_range": (14.99, 49.99),
        "default_weight": "100g",
        "unit_type": "weight",
        "weights": ["25g", "50g", "100g", "250g", "500g"],
        "multiplier": {"25g": 0.3, "50g": 0.55, "100g": 1, "250g": 2.2, "500g": 4.0},
        "forms": ["Raw Resin", "Powdered"],
        "default_form": "raw",
        "show_form_selector": True,
        "description_template": "Pure natural {name} harvested from authentic sources. Ideal for rituals, aromatherapy, and traditional preparations. Ethically sourced and laboratory tested for purity."
    },
    "oils": {
        "emoji": "🫒",
        "price_range": (7.99, 29.99),
        "default_weight": "250ml",
        "unit_type": "volume",
        "weights": ["100ml", "250ml", "500ml", "1 Ltr", "5 Ltr"],
        "multiplier": {"100ml": 0.45, "250ml": 1, "500g": 1.75, "1 Ltr": 3.2, "5 Ltr": 14.0},
        "forms": ["Liquid"],
        "default_form": "liquid",
        "show_form_selector": False,
        "description_template": "Traditional cold-pressed {name} extracted using time-honored methods. Rich in nutrients and essential compounds. Perfect for cooking, massage, skincare, and Ayurvedic therapies."
    },
    "seeds": {
        "emoji": "🫘",
        "price_range": (3.99, 18.99),
        "default_weight": "250g",
        "unit_type": "weight",
        "weights": ["100g", "250g", "500g", "1 Kg"],
        "multiplier": {"100g": 0.45, "250g": 1, "500g": 1.8, "1 Kg": 3.2},
        "forms": ["Whole Seeds", "Ground Powder"],
        "default_form": "whole",
        "show_form_selector": True,
        "description_template": "Organic {name} carefully selected for quality and germination. Used in cooking, sprouting, and traditional remedies. High nutritional value with essential vitamins and minerals."
    },
    "soap": {
        "emoji": "🧼",
        "price_range": (4.99, 12.99),
        "default_weight": "100g",
        "unit_type": "weight",
        "weights": ["75g", "100g", "125g", "150g"],
        "multiplier": {"75g": 0.75, "100g": 1, "125g": 1.2, "150g": 1.4},
        "forms": ["1 Piece"],
        "default_form": "piece",
        "show_form_selector": False,
        "description_template": "Handcrafted herbal {name} made with pure essential oils and natural ingredients. Gentle on skin with no harsh chemicals. Suitable for daily use with nourishing Ayurvedic herbs."
    },
    "namak": {
        "emoji": "🧂",
        "price_range": (2.99, 14.99),
        "default_weight": "500g",
        "unit_type": "weight",
        "weights": ["250g", "500g", "1 Kg", "5 Kg"],
        "multiplier": {"250g": 0.55, "500g": 1, "1 Kg": 1.85, "5 Kg": 8.0},
        "forms": ["Crystals", "Powdered"],
        "default_form": "crystals",
        "show_form_selector": True,
        "description_template": "Traditional {name} rich in minerals and trace elements. Sourced from pristine natural deposits. Essential for cooking, fasting, and therapeutic salt water treatments."
    },
    "masala": {
        "emoji": "🌶️",
        "price_range": (4.99, 19.99),
        "default_weight": "250g",
        "unit_type": "weight",
        "weights": ["100g", "250g", "500g", "1 Kg"],
        "multiplier": {"100g": 0.45, "250g": 1, "500g": 1.75, "1 Kg": 3.2},
        "forms": ["Whole Spice", "Ground Powder"],
        "default_form": "whole",
        "show_form_selector": True,
        "description_template": "Aromatic {name} hand-selected for premium quality and flavor. Essential spice for authentic Indian cooking and Ayurvedic formulations. Freshly ground for maximum aroma."
    },
    "mushroom": {
        "emoji": "🍄",
        "price_range": (19.99, 49.99),
        "default_weight": "100g",
        "unit_type": "weight",
        "weights": ["50g", "100g", "250g", "500g"],
        "multiplier": {"50g": 0.6, "100g": 1, "250g": 2.2, "500g": 4.0},
        "forms": ["Dried Whole", "Powdered"],
        "default_form": "dried",
        "show_form_selector": True,
        "description_template": "Premium medicinal {name} cultivated under controlled conditions. Known for its immune-boosting and health-promoting properties. Used in traditional medicine and modern wellness supplements."
    }
}

def filename_to_product_name(filename):
    """Convert filename to human-readable product name."""
    # Remove extension
    name = re.sub(r'\.(jpg|jpeg|png)$', '', filename, flags=re.IGNORECASE)
    
    # Replace hyphens and underscores with spaces
    name = name.replace('-', ' ').replace('_', ' ')
    
    # Capitalize each word
    name = ' '.join(word.capitalize() for word in name.split())
    
    return name.strip()

def generate_description(name, category):
    """Generate a description for the product."""
    config = CATEGORY_CONFIG.get(category, CATEGORY_CONFIG["herbs"])
    template = config["description_template"]
    return template.format(name=name)

def calculate_price(filename, category, index):
    """Generate a price based on category and position."""
    import hashlib
    
    config = CATEGORY_CONFIG.get(category, CATEGORY_CONFIG["herbs"])
    min_price, max_price = config["price_range"]
    
    # Use hash of filename for consistent but varied pricing
    hash_val = int(hashlib.md5(filename.encode()).hexdigest()[:8], 16)
    price_range = max_price - min_price
    price = min_price + (hash_val % 100) / 100 * price_range
    
    # Round to nearest .99 or .49
    price = round(price * 2) / 2
    if price - int(price) < 0.25:
        price = int(price) + 0.49
    elif price - int(price) < 0.75:
        price = int(price) + 0.99
    else:
        price = int(price) + 1.49
    
    # Ensure within range
    price = max(min_price, min(max_price, price))
    return round(price, 2)

def generate_compare_price(price):
    """Generate a compare-at price (higher than actual)."""
    markup = 1.2 + (price % 10) / 50  # 20-40% higher
    compare = price * markup
    return round(compare, 2)

def generate_rating():
    """Generate a realistic rating between 4.3 and 5.0."""
    return round(4.3 + (hash(os.urandom(4)) % 70) / 100, 1)

def generate_reviews_count():
    """Generate realistic review count."""
    base = [45, 67, 89, 123, 156, 189, 234, 278, 312, 367]
    return base[hash(os.urandom(4)) % len(base)]

def scan_category_folder(category):
    """Scan a category folder and return list of image files."""
    folder = PRODUCTS_DIR / category
    
    if not folder.exists():
        print(f"  ⚠️  Folder not found: {folder}")
        return []
    
    images = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp']:
        images.extend(folder.glob(ext))
    
    # Filter out JSON files and sort
    images = [img for img in images if not img.name.endswith('.json')]
    images.sort(key=lambda x: x.name.lower())
    
    return images

def create_product_from_image(image_path, category, product_id, index):
    """Create a product dictionary from an image file."""
    config = CATEGORY_CONFIG.get(category, CATEGORY_CONFIG["herbs"])
    filename = image_path.name
    name = filename_to_product_name(filename)
    price = calculate_price(filename, category, index)
    
    product = {
        "id": product_id,
        "name": name,
        "emoji": config["emoji"],
        "image": filename,
        "category": category,
        "description": generate_description(name, category),
        "price": price,
        "comparePrice": generate_compare_price(price),
        "rating": generate_rating(),
        "reviews": generate_reviews_count(),
        "defaultWeight": config["default_weight"],
        "unitType": config["unit_type"],
        "featured": index < 3,  # First 3 items are featured
        "weights": config["weights"],
        "priceMultiplier": config["multiplier"],
        # Form options from category config
        "forms": config.get("forms", ["Raw Form", "Powder Form"]),
        "defaultForm": config.get("default_form", "raw"),
        "showFormSelector": config.get("show_form_selector", True),
        "video": f"/videos/{filename.rsplit('.', 1)[0]}.mp4"
    }
    
    return product

def load_main_json():
    """Load the main products.json file."""
    if MAIN_JSON.exists():
        try:
            with open(MAIN_JSON, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing {MAIN_JSON}: {e}")
            return None
    return {"categories": [], "products": [], "testimonials": []}

def save_main_json(data):
    """Save the main products.json file."""
    with open(MAIN_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved: {MAIN_JSON}")

def get_existing_products(main_data):
    """Get set of existing product identifiers (category + image)."""
    existing = set()
    for p in main_data.get("products", []):
        existing.add(f"{p['category']}/{p['image']}")
    return existing

def get_next_product_id(main_data):
    """Get the next available product ID."""
    products = main_data.get("products", [])
    if not products:
        return 1
    return max(p['id'] for p in products) + 1

def process_all_categories(force=False):
    """Main function to process all categories."""
    print("=" * 60)
    print("🚀 Auto Product Generator - Himvedi Herbals")
    print("=" * 60)
    
    # Load existing data
    main_data = load_main_json()
    if main_data is None:
        print("❌ Failed to load main JSON. Exiting.")
        return False
    
    existing_products = get_existing_products(main_data)
    next_id = get_next_product_id(main_data)
    
    print(f"\n📊 Current state:")
    print(f"   Existing products: {len(existing_products)}")
    print(f"   Next product ID: {next_id}")
    
    new_products = []
    stats = {}
    
    # Process each category
    categories_to_process = list(CATEGORY_CONFIG.keys())
    
    for category in categories_to_process:
        print(f"\n{'='*50}")
        print(f"📁 Processing: {category.upper()}")
        print(f"{'='*50}")
        
        images = scan_category_folder(category)
        
        if not images:
            print(f"  ⚠️  No images found in {category}/")
            stats[category] = {"found": 0, "added": 0, "skipped": 0}
            continue
        
        print(f"  📷 Found {len(images)} images")
        
        added = 0
        skipped = 0
        
        for idx, image_path in enumerate(images):
            product_key = f"{category}/{image_path.name}"
            
            if product_key in existing_products and not force:
                skipped += 1
                continue
            
            # Create product
            product = create_product_from_image(image_path, category, next_id, idx)
            new_products.append(product)
            
            print(f"  ✅ [#{next_id}] {product['name']} - ${product['price']}")
            
            next_id += 1
            added += 1
        
        stats[category] = {
            "found": len(images),
            "added": added,
            "skipped": skipped
        }
    
    # Update main data
    if new_products:
        main_data["products"].extend(new_products)
        save_main_json(main_data)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📋 SUMMARY")
    print("=" * 60)
    
    total_found = 0
    total_added = 0
    total_skipped = 0
    
    for cat, stat in stats.items():
        total_found += stat["found"]
        total_added += stat["added"]
        total_skipped += stat["skipped"]
        
        status = "✅" if stat["added"] > 0 else "⏭️"
        print(f"  {status} {cat:12}: {stat['added']:3} added | {stat['skipped']:2} skipped | {stat['found']:3} total")
    
    print("-" * 60)
    print(f"  📊 TOTAL:      {total_added:3} added | {total_skipped:2} skipped | {total_found:3} found")
    print(f"  💰 Products in JSON: {len(main_data['products'])}")
    
    # Category breakdown
    cat_counts = Counter(p['category'] for p in main_data['products'])
    print("\n📦 Products by category:")
    for cat in categories_to_process:
        count = cat_counts.get(cat, 0)
        print(f"   {cat:12}: {count:3} products")
    
    return True

def main():
    """Entry point."""
    force = '--force' in sys.argv or '-f' in sys.argv
    
    if force:
        print("⚠️  FORCE MODE: Will regenerate ALL products\n")
    
    success = process_all_categories(force=force)
    
    if success:
        print("\n✅ Product generation complete!")
        print("📂 Output:", MAIN_JSON)
        return 0
    else:
        print("\n❌ Product generation failed!")
        return 1

if __name__ == "__main__":
    exit(main())
