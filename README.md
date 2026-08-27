# GreenEarth Organics

A static e-commerce website for organic products (gau products, bio-fertilizers, herbs) — built with HTML, Tailwind CSS CDN, and vanilla JavaScript. Ready to deploy on **Cloudflare Pages**.

## Features

- **15 products** across 3 categories with dynamic filtering & search
- **Shopping cart** with localStorage persistence
- **QR code checkout** flow (eSewa, Khalti, IME Pay)
- **USD → NPR** live exchange rate display
- **Product detail modal** with background video
- **Responsive design** — mobile-first with Tailwind CSS
- **Configurable** — site name, contacts, exchange rate via env vars
- **Zero build step** — pure static HTML/CSS/JS

## Project Structure

```
├── index.html              # Main page (HTML structure, no hardcoded data)
├── css/
│   └── styles.css          # Custom styles, animations, scrollbar
├── js/
│   ├── config.js           # Site config loader (API → JSON → defaults)
│   ├── data.js             # Product & content data loader
│   ├── cart.js             # Cart management (localStorage)
│   ├── ui.js               # Product rendering, modals, search, toasts
│   ├── checkout.js         # QR checkout flow & order management
│   └── app.js              # Main init, dynamic rendering, event wiring
├── data/
│   ├── config.json         # Default site config (name, contacts, etc.)
│   └── products.json       # All product, category, testimonial data
├── images/
│   ├── products/           # 15 product images (JPG)
│   ├── favicon.svg
│   ├── qr-payment.svg
│   └── gau-pattern.svg
├── functions/
│   └── api/
│       └── config.js       # Cloudflare Pages Function (env var config)
├── wrangler.toml           # Cloudflare config + environment variables
├── .env.example            # Example environment variables
├── .gitignore
├── _headers                # Cloudflare Pages cache & security headers
├── _redirects              # SPA fallback redirects
├── robots.txt
├── README.md
└── CLOUDFLARE_DEPLOY.md
```

## Configuration

### Quick (Local Development)

Edit `data/config.json`:

```json
{
  "siteName": "Your Brand Name",
  "contact": {
    "email": "you@example.com",
    "phone": "+977-98XXXXXXXX",
    "city": "Kathmandu",
    "country": "Nepal"
  },
  "currency": {
    "exchangeRateToNPR": 133.50
  }
}
```

### Cloudflare Pages (Production)

Set environment variables in **Cloudflare Dashboard → Pages → Settings → Environment Variables**, or edit `wrangler.toml`:

```toml
[vars]
SITE_NAME = "Your Brand Name"
CONTACT_EMAIL = "you@example.com"
CONTACT_PHONE = "+977-98XXXXXXXX"
EXCHANGE_RATE_TO_NPR = "133.50"
```

The app loads config in this order:
1. Cloudflare Pages Function (`/api/config`) — uses env vars
2. Local `data/config.json` — fallback
3. Hardcoded defaults — ultimate fallback

## Adding / Editing Products

Edit `data/products.json`. Each product:

```json
{
  "id": 16,
  "name": "New Product",
  "emoji": "🌿",
  "image": "new-product.svg",
  "category": "herbs",
  "description": "Product description...",
  "price": 15.99,
  "comparePrice": null,
  "rating": 4.7,
  "reviews": 50,
  "defaultWeight": "1 Kg",
  "unitType": "weight",
  "featured": true,
  "weights": ["250g", "500g", "1 Kg", "2 Kg", "5 Kg"],
  "priceMultiplier": { "250g": 0.3, "500g": 0.6, "1 Kg": 1, "2 Kg": 1.9, "5 Kg": 4.5 }
}
```

Place the product image in `images/products/`.

## Local Development

No build step needed. Just serve the files:

```bash
# Using npx
npx serve .

# Using Python
python -m http.server 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000`.

## License

MIT
