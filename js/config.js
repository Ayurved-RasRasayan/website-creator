/**
 * config.js - Site Configuration Loader
 * Fetches config from Cloudflare Pages Function /api/config,
 * falls back to local data/config.json.
 * 
 * ALL values come from environment variables defined in wrangler.toml.
 * No hardcoded brand names - wrangler.toml is the single source of truth.
 */

const SiteConfig = {
    data: null,

    // Minimal generic fallbacks - should never be hit in production
    // because /api/config reads from wrangler.toml env vars.
    defaults: {
        siteName: "",
        tagline: "",
        copyright: ``,
        contact: {
            email: "",
            phone: "",
            city: "",
            province: "",
            country: "",
        },
        currency: {
            default: "USD",
            exchangeRateToNPR: 133.50,
        },
    },

    async load() {
        try {
            // Try Cloudflare Pages Function first (reads from env vars)
            const res = await fetch('/api/config');
            if (res.ok) {
                this.data = await res.json();
                return this.data;
            }
        } catch (e) {
            // Function not available (local dev or static-only deploy)
        }

        try {
            // Fallback to local JSON (should mirror wrangler.toml values)
            const res = await fetch('/data/config.json?t=' + Date.now());
            if (res.ok) {
                this.data = await res.json();
                return this.data;
            }
        } catch (e) {
            // JSON not available
        }

        // Ultimate fallback to minimal defaults
        console.warn('SiteConfig: Could not load from /api/config or /data/config.json. Using minimal defaults.');
        this.data = this.defaults;
        return this.data;
    },

    get(key) {
        if (!this.data) return this.defaults[key] || null;
        return this.data[key] || this.defaults[key] || null;
    },

    get contact() {
        return this.data?.contact || this.defaults.contact;
    },

    get currency() {
        return this.data?.currency || this.defaults.currency;
    },

    get siteName() {
        return this.data?.siteName || this.defaults.siteName;
    },

    get tagline() {
        return this.data?.tagline || this.defaults.tagline;
    },

    get copyright() {
        return this.data?.copyright || this.defaults.copyright;
    },

    get exchangeRate() {
        return parseFloat(this.data?.currency?.exchangeRateToNPR) || this.defaults.currency.exchangeRateToNPR;
    }
};