/**
 * data.js - Product & Content Data Loader
 * Fetches product data from data/products.json.
 * All hardcoded content lives here (loaded at runtime).
 */

const AppData = {
    categories: [],
    products: [],
    testimonials: [],

    async load() {
        try {
            const res = await fetch('/data/products.json?t=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                this.categories = data.categories || [];
                this.products = data.products || [];
                this.testimonials = data.testimonials || [];
            }
        } catch (e) {
            console.error('Failed to load product data:', e);
        }

        // Build category lookup map
        this.categoryMap = {};
        for (const cat of this.categories) {
            this.categoryMap[cat.slug] = cat;
        }
    },

    getCategory(slug) {
        return this.categoryMap[slug] || null;
    },

    getProductsByCategory(slug) {
        if (slug === 'all') return this.products;
        return this.products.filter(p => p.category === slug);
    },

    searchProducts(query) {
        const q = query.toLowerCase();
        return this.products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
    },

    getProductById(id) {
        return this.products.find(p => p.id === id) || null;
    },

    formatNPR(usdAmount) {
        const rate = SiteConfig.exchangeRate;
        const npr = usdAmount * rate;
        return 'Rs. ' + npr.toLocaleString('en-NP', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= Math.round(rating)
                ? '<span class="star-filled text-xs">★</span>'
                : '<span class="star-empty text-xs">★</span>';
        }
        return html;
    }
};
