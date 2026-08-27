/* ==============================================
   GreenEarth Organics - Custom Styles
   UNIFIED: Single card component for Mobile & Desktop
   ============================================== */

/* === Base === */
* {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

body {
    background-color: #FEFEFE;
    color: #1A2B2D;
    background-image: url('../images/gau-pattern.jpg');
    background-repeat: repeat;
    background-size: 160px 140px;
}

/* === Custom Scrollbar === */
::-webkit-scrollbar {
    width: 8px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #A7F3D0;
    border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
    background: #6EE7B7;
}

/* === Hide Scrollbar (category nav) === */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* === Animations === */
@keyframes breathe {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
}
.animate-breathe {
    animation: breathe 2.5s ease-in-out infinite;
}

@keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
@keyframes slideOutRight {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.cart-drawer-open {
    animation: slideInRight 0.3s ease-out;
}
.cart-drawer-close {
    animation: slideOutRight 0.3s ease forwards;
}
.modal-overlay {
    animation: fadeIn 0.2s ease-out;
}
.modal-content {
    animation: scaleIn 0.2s ease-out;
}

/* === Gradient Text === */
.gradient-text {
    background: linear-gradient(135deg, #34D399, #86EFAC, #2DD4BF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* === Star Rating === */
.star-filled {
    color: #FBBF24;
}
.star-empty {
    color: #D1D5DB;
}

/* === Overlay === */
.overlay {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
}

/* === Toast Notification === */
.toast-enter {
    animation: slideInRight 0.3s ease-out;
}

/* === Category Nav Active State === */
.category-btn.active {
    background-color: #059669;
    color: #ffffff;
}
.category-btn:not(.active) {
    color: #047857;
}
.category-btn:not(.active):hover {
    background-color: #ECFDF5;
}

/* ==============================================
   UNIFIED Product Card Styles
   Same component adapts via Tailwind responsive classes
   ============================================== */

.product-card {
    transition: all 0.3s ease;
}
.product-card:hover {
    box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.1),
                0 8px 10px -6px rgba(5, 150, 105, 0.05);
}

.product-card .product-image {
    transition: transform 0.3s ease;
}
.product-card:hover .product-image {
    transform: scale(1.05);
}

/* Ensure form selectors are properly styled on all devices */
.product-card select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    padding-right: 28px !important;
}

.product-card select:focus {
    outline: none;
    ring: 1px solid #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

/* Touch-friendly sizing for mobile */
@media (max-width: 639px) {
    .product-card select {
        font-size: 14px !important; /* Prevent iOS zoom on focus */
        min-height: 36px; /* Minimum touch target */
        padding-top: 8px !important;
        padding-bottom: 8px !important;
    }

    /* Ensure button touch targets are large enough */
    .product-card button {
        min-height: 36px;
    }

    /* Slightly tighter spacing on mobile */
    .product-card {
        font-size: 0.875rem;
    }
}

/* Tablet refinements */
@media (min-width: 640px) and (max-width: 767px) {
    .product-card select {
        font-size: 13px;
    }
}

/* === Category Card === */
.category-card {
    transition: all 0.3s ease;
}
.category-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.15);
}
.category-card:hover .category-arrow {
    gap: 8px;
}

/* === Skeleton Loading === */
.skeleton {
    background: linear-gradient(90deg, #ECFDF5 25%, #D1FAE5 50%, #ECFDF5 75%);
    background-size: 200% 100%;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    border-radius: 8px;
}
@keyframes skeleton-pulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* === Line Clamp === */
.line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}
.line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

/*
 * REMOVED: Old mobile-card/desktop-card visibility rules
 * The unified product card now uses Tailwind responsive utilities
 * instead of separate mobile/desktop components.
 *
 * Previous code that was removed:
 *   @media (max-width: 639px) {
 *       .mobile-card { display: block; }
 *       .desktop-card { display: none; }
 *   }
 *   @media (min-width: 640px) {
 *       .mobile-card { display: none; }
 *       .desktop-card { display: block; }
 *   }
 */

/* ==============================================
   MOBILE CATEGORY SHOWCASE - 2 Columns Layout ✨ UPDATED
   Wider cards with visible descriptions for mobile
   ============================================== */
@media (max-width: 639px) {
    /* Category showcase container - 2 COLUMNS on mobile (CHANGED from 3) */
    #categoryShowcase {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
    }

    /* Category cards for 2-column layout - more spacious */
    #categoryShowcase .category-card {
        padding: 1.25rem !important;
        border-radius: 1rem !important;
    }

    /* Icon container - larger for better visibility */
    #categoryShowcase .category-card > div:first-child {
        width: 2.75rem !important;
        height: 2.75rem !important;
        border-radius: 0.75rem !important;
        margin-bottom: 0.75rem !important;
        padding: 0.4rem !important;
    }

    /* Icon size - larger */
    #categoryShowcase .category-card > div:first-child i,
    #categoryShowcase .category-card > div:first-child svg {
        width: 1.35rem !important;
        height: 1.35rem !important;
    }

    /* Title - larger and more readable */
    #categoryShowcase .category-card h3 {
        font-size: 1rem !important;
        margin-bottom: 0.4rem !important;
    }

    /* ✅ DESCRIPTION NOW VISIBLE on mobile (was hidden before) */
    #categoryShowcase .category-card p:not(:last-child) {
        display: block !important;
        font-size: 0.8rem !important;
        line-height: 1.5 !important;
        margin-bottom: 0.6rem !important;
        /* Limit to 2 lines for clean layout */
        display: -webkit-box !important;
        -webkit-box-orient: vertical !important;
        -webkit-line-clamp: 2 !important;
        overflow: hidden !important;
    }

    /* Product count / link text - larger */
    #categoryShowcase .category-card span:last-child,
    #categoryShowcase .category-card .category-arrow {
        font-size: 0.8rem !important;
        gap: 0.35rem !important;
    }

    /* Arrow icon in category link - larger */
    #categoryShowcase .category-card .category-arrow i,
    #categoryShowcase .category-card .category-arrow svg {
        width: 0.9rem !important;
        height: 0.9rem !important;
    }
}

/* ==============================================
   MOBILE HERO TRUST BADGES - 3 Columns Layout
   Compact badges for small screens (below Shop Now)
   ============================================== */
@media (max-width: 639px) {
    /* Hero trust badges container - 3 columns on mobile */
    #heroTrustBadges {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.4rem !important;
    }

    /* Compact badge cards for 3-column layout */
    #heroTrustBadges > div {
        padding: 0.5rem 0.4rem !important;
        border-radius: 0.625rem !important;
        gap: 0.35rem !important;
    }

    /* Smaller emoji/icon */
    #heroTrustBadges > div span:first-child {
        font-size: 1rem !important;
    }

    /* Smaller label text */
    #heroTrustBadges > div .text-sm {
        font-size: 0.7rem !important;
        line-height: 1.2 !important;
    }

    /* Smaller subtitle text */
    #heroTrustBadges > div .text-xs {
        font-size: 0.55rem !important;
        line-height: 1.1 !important;
    }

    /* Ensure text container is compact */
    #heroTrustBadges > div > div:last-child {
        text-align: left !important;
    }
}
