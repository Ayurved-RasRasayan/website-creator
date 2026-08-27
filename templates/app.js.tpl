/**
 * app.js - Main Application Entry Point
 * Loads config + data, initializes UI, wires events.
 */

(async function init() {
    // 1. Load site config
    await SiteConfig.load();

    // 2. Apply config to DOM elements with data-config attributes
    applyConfig();

    // 3. Load product data
    await AppData.load();

    // 3b. Init auth then load and render blog
    await Auth.init();
    await Blog.load();
    Blog.renderBlogSection();

    // 4. Render dynamic sections from data
    renderCategoryNav();
    renderCategoryShowcase();
    renderHeroTrustBadges();
    renderTestimonials();
    renderFooterLinks();

    // 5. Initialize cart
    Cart.init();
    Cart.updateBadge();

    // 6. Render products
    UI.renderProducts();

    // 7. Update exchange display
    UI.updateExchangeDisplay();

    // 8. Start live clock
    UI.updateLiveTime();
    setInterval(() => UI.updateLiveTime(), 1000);

    // 9. Initialize Lucide icons
    lucide.createIcons();

    // 10. Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            UI.closeProductModal();
            UI.closeCart();
            document.getElementById('mobileMenu').classList.add('hidden');
        }
    });

    console.log(`%c${SiteConfig.siteName} loaded successfully`, 'color: #059669; font-weight: bold; font-size: 14px;');
})();

/**
 * Applies site config values to DOM elements that have
 * data-config="siteName", data-config="contact.email", etc.
 */
function applyConfig() {
    const config = SiteConfig;

    const mappings = {
        'siteName': config.siteName,
        'tagline': config.tagline,
        'copyright': config.copyright,
        'contact.email': config.contact.email,
        'contact.phone': config.contact.phone,
        'contact.city': config.contact.city,
        'contact.country': config.contact.country,
        'exchangeRate': config.exchangeRate.toFixed(2),
    };

    document.querySelectorAll('[data-config]').forEach(el => {
        const key = el.getAttribute('data-config');
        const value = mappings[key];
        if (value !== undefined && value !== null) {
            el.textContent = value;
            el.classList.add('configured');
        }
    });

    document.title = config.siteName + ' - Premium Organic Products';
}

/**
 * Renders category navigation buttons in header + mobile menu
 * from AppData.categories loaded from products.json.
 */
function renderCategoryNav() {
    const nav = document.getElementById('categoryNav');
    const mobileLinks = document.getElementById('mobileMenuLinks');
    if (!nav) return;

    // Header nav
    let navHTML = `<button onclick="UI.filterByCategory('all')" class="category-btn active shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors" data-category="all">All Products</button>`;
    let mobileHTML = '';

    for (const cat of AppData.categories) {
        navHTML += `<button onclick="UI.filterByCategory('${cat.slug}')" class="category-btn shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors" data-category="${cat.slug}">${cat.label}</button>`;
        mobileHTML += `<button onclick="UI.filterByCategory('${cat.slug}');UI.toggleMobileMenu()" class="text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-sm text-emerald-700">${cat.label}</button>`;
    }

    // Blog button (same style as category buttons)
    navHTML += `<button onclick="document.getElementById('blog').scrollIntoView({behavior:'smooth'})" class="category-btn shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors">Blog</button>`;
    mobileHTML += `<button onclick="document.getElementById('blog').scrollIntoView({behavior:'smooth'});UI.toggleMobileMenu()" class="text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-sm text-emerald-700">Blog</button>`;

    nav.innerHTML = navHTML;

    if (mobileLinks) {
        mobileLinks.innerHTML = `<button onclick="UI.filterByCategory('all');UI.toggleMobileMenu()" class="text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-sm text-emerald-700">All Products</button>` + mobileHTML;
    }
}

/**
 * Renders the "Shop by Category" section from products.json categories.
 */
function renderCategoryShowcase() {
    const container = document.getElementById('categoryShowcase');
    if (!container) return;

    const bgColors = {
        'herbs': { card: 'bg-green-50 border-green-100', icon: 'bg-green-100 text-green-700', title: 'text-green-800', desc: 'text-green-700/70', link: 'text-green-700' },
        'resin': { card: 'bg-amber-50 border-amber-100', icon: 'bg-amber-100 text-amber-700', title: 'text-amber-800', desc: 'text-amber-700/70', link: 'text-amber-700' },
        'oils': { card: 'bg-yellow-50 border-yellow-100', icon: 'bg-yellow-100 text-yellow-700', title: 'text-yellow-800', desc: 'text-yellow-700/70', link: 'text-yellow-700' },
        'seeds': { card: 'bg-lime-50 border-lime-100', icon: 'bg-lime-100 text-lime-700', title: 'text-lime-800', desc: 'text-lime-700/70', link: 'text-lime-700' },
        'soap': { card: 'bg-sky-50 border-sky-100', icon: 'bg-sky-100 text-sky-700', title: 'text-sky-800', desc: 'text-sky-700/70', link: 'text-sky-700' },
        'namak': { card: 'bg-slate-50 border-slate-100', icon: 'bg-slate-100 text-slate-700', title: 'text-slate-800', desc: 'text-slate-700/70', link: 'text-slate-700' },
        'masala': { card: 'bg-red-50 border-red-100', icon: 'bg-red-100 text-red-700', title: 'text-red-800', desc: 'text-red-700/70', link: 'text-red-700' },
        'mushroom': { card: 'bg-orange-50 border-orange-100', icon: 'bg-orange-100 text-orange-700', title: 'text-orange-800', desc: 'text-orange-700/70', link: 'text-orange-700' }
    };

    container.innerHTML = AppData.categories.map(cat => {
        const colors = bgColors[cat.slug] || bgColors['herbs'];
        const count = AppData.getProductsByCategory(cat.slug).length;

        return `
        <button onclick="UI.filterByCategory('${cat.slug}');document.getElementById('products').scrollIntoView({behavior:'smooth'})"
                class="category-card group text-left p-6 rounded-2xl ${colors.card} border hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center mb-4">
                <i data-lucide="${cat.icon}" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold ${colors.title} mb-2">${cat.label}</h3>
            <p class="${colors.desc} text-sm leading-relaxed mb-3">${cat.description}</p>
            <span class="category-arrow inline-flex items-center gap-1 ${colors.link} font-semibold text-sm transition-all">
                ${count} products <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </span>
        </button>`;
    }).join('');
}

/**
 * Renders hero trust badges - dynamically counts products from AppData.
 * Auto-updates when products are added/removed from products.json.
 */
function renderHeroTrustBadges() {
    const container = document.getElementById('heroTrustBadges');
    if (!container) return;

    // Suffix labels for each category (descriptive text after count)
    const suffixMap = {
        'herbs': 'varieties',
        'resin': 'types',
        'oils': 'oils',
        'seeds': 'kinds',
        'soap': 'types',
        'namak': 'items',
        'masala': 'blends',
        'mushroom': 'type'
    };

    // Build badges dynamically from actual product counts
    const badges = AppData.categories.map(cat => {
        const count = AppData.getProductsByCategory(cat.slug).length;
        const suffix = suffixMap[cat.slug] || 'items';
        return {
            emoji: cat.emoji || '📦',
            label: cat.label,
            sub: `${count} ${suffix}`
        };
    });

    container.innerHTML = badges.map(b => `
        <div class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <span class="text-xl">${b.emoji}</span>
            <div class="text-left">
                <div class="text-white text-sm font-semibold">${b.label}</div>
                <div class="text-emerald-300/70 text-xs">${b.sub}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Renders testimonials from products.json.
 */
function renderTestimonials() {
    const container = document.getElementById('testimonialGrid');
    if (!container) return;

    container.innerHTML = AppData.testimonials.map(t => {
        const stars = AppData.renderStars(t.rating);
        return `
        <div class="p-6 rounded-2xl bg-white border border-emerald-100 hover:shadow-lg transition-shadow">
            <div class="flex items-center gap-1 mb-4">${stars}</div>
            <p class="text-emerald-900/80 text-sm leading-relaxed mb-5">"${t.text}"</p>
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm">${t.initials}</div>
                <div>
                    <div class="font-semibold text-emerald-900 text-sm">${t.name}</div>
                    <div class="text-emerald-600/70 text-xs">${t.role}</div>
                </div>
            </div>
        </div>`;
    }).join('');
}

/**
 * Renders footer product links from category data.
 */
function renderFooterLinks() {
    const container = document.getElementById('footerProducts');
    if (!container) return;

    const links = AppData.categories.map(cat =>
        `<li><a href="#" onclick="UI.filterByCategory('${cat.slug}');document.getElementById('products').scrollIntoView({behavior:'smooth'});return false" class="hover:text-emerald-300 transition-colors">${cat.label}</a></li>`
    );
    links.push('<li><a href="#" class="hover:text-emerald-300 transition-colors">Featured Items</a></li>');

    container.innerHTML = links.join('');
}
