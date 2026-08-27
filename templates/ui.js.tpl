/**
 * ui.js - UI Rendering: Products, Modals, Search, Toasts
 * UNIFIED: Single product card component for both Mobile & Desktop
 * Uses Tailwind responsive utilities for layout adaptation
 * PAGINATION: Shows 30 products per page with navigation controls
 */

const UI = {
    currentCategory: 'all',
    searchQuery: '',
    currentModalProduct: null,
    
    // === PAGINATION SETTINGS ===
    currentPage: 1,
    productsPerPage: 30,

    // === Product Grid with Pagination ===
    renderProducts() {
        const grid = document.getElementById('productGrid');
        const noProducts = document.getElementById('noProducts');
        if (!grid) return;

        let filtered = AppData.products;

        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentCategory);
        }
        if (this.searchQuery) {
            filtered = AppData.searchProducts(this.searchQuery);
        }

        // === ALWAYS SORT A-Z BY PRODUCT NAME ===
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

        // Update section title
        const titles = { 'all': 'All Products' };
        for (const cat of AppData.categories) {
            titles[cat.slug] = cat.label;
        }
        document.getElementById('productTitle').textContent = titles[this.currentCategory] || 'All Products';
        document.getElementById('productSubtitle').textContent = filtered.length + ' products available';

        if (filtered.length === 0) {
            grid.innerHTML = '';
            noProducts.classList.remove('hidden');
            this.hidePagination();
            return;
        }
        
        noProducts.classList.add('hidden');

        // === PAGINATION LOGIC ===
        // Calculate total pages
        const totalPages = Math.ceil(filtered.length / this.productsPerPage);
        
        // Ensure current page is valid (important when filtering changes)
        if (this.currentPage > totalPages) {
            this.currentPage = totalPages;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }
        
        // Get products for current page
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = Math.min(startIndex + this.productsPerPage, filtered.length);
        const paginatedProducts = filtered.slice(startIndex, endIndex);

        // Render only current page products
        grid.innerHTML = paginatedProducts.map(p => this.renderProductCard(p)).join('');
        lucide.createIcons();
        
        // Render pagination controls
        this.renderPagination(filtered.length, totalPages, startIndex, endIndex);
    },

    /**
     * Render Pagination Controls
     */
    renderPagination(totalItems, totalPages, startIndex, endIndex) {
        let paginationContainer = document.getElementById('paginationContainer');
        
        // Create pagination container if it doesn't exist
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'paginationContainer';
            
            // Insert after product grid
            const grid = document.getElementById('productGrid');
            if (grid && grid.parentNode) {
                grid.parentNode.insertBefore(paginationContainer, grid.nextSibling);
            }
        }
        
        // Hide pagination if only one page
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            paginationContainer.classList.add('hidden');
            return;
        }
        
        paginationContainer.classList.remove('hidden');
        
        // Build pagination HTML
        let paginationHTML = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-2">
                <!-- Page Info -->
                <div class="text-sm text-emerald-600/70 order-2 sm:order-1">
                    Showing <span class="font-semibold text-emerald-800">${startIndex + 1}</span> to 
                    <span class="font-semibold text-emerald-800">${endIndex}</span> of 
                    <span class="font-semibold text-emerald-800">${totalItems}</span> products
                </div>
                
                <!-- Navigation Buttons -->
                <div class="flex items-center gap-2 order-1 sm:order-2">
                    <!-- Previous Button -->
                    <button onclick="UI.goToPage(${this.currentPage - 1})" 
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all
                                   ${this.currentPage === 1 
                                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                       : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95'}"
                            ${this.currentPage === 1 ? 'disabled' : ''}>
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                            Previous
                        </span>
                    </button>
                    
                    <!-- Page Numbers -->
                    <div class="flex items-center gap-1">
                        ${this.generatePageNumbers(totalPages)}
                    </div>
                    
                    <!-- Next Button -->
                    <button onclick="UI.goToPage(${this.currentPage + 1})" 
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all
                                   ${this.currentPage === totalPages 
                                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                       : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95'}"
                            ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <span class="flex items-center gap-1">
                            Next
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
    },
    
    /**
     * Generate page number buttons
     */
    generatePageNumbers(totalPages) {
        let pages = [];
        const maxVisible = 5; // Maximum page numbers to show
        
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        // First page & ellipsis
        if (startPage > 1) {
            pages.push(this.createPageButton(1));
            if (startPage > 2) {
                pages.push('<span class="px-2 text-emerald-400">...</span>');
            }
        }
        
        // Visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(this.createPageButton(i));
        }
        
        // Last page & ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push('<span class="px-2 text-emerald-400">...</span>');
            }
            pages.push(this.createPageButton(totalPages));
        }
        
        return pages.join('');
    },
    
    /**
     * Create a single page button
     */
    createPageButton(pageNum) {
        const isActive = pageNum === this.currentPage;
        return `
            <button onclick="UI.goToPage(${pageNum})"
                    class="w-9 h-9 rounded-lg text-sm font-medium transition-all
                           ${isActive 
                               ? 'bg-emerald-600 text-white shadow-md scale-105' 
                               : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95'}">
                ${pageNum}
            </button>
        `;
    },

    /**
     * Go to specific page
     */
    goToPage(pageNum) {
        this.currentPage = pageNum;
        this.renderProducts();
        
        // Scroll to top of products section smoothly
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Hide pagination container
     */
    hidePagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.classList.add('hidden');
        }
    },

    /**
     * Reset to page 1 (call when category/filter changes)
     */
    resetPagination() {
        this.currentPage = 1;
    },

    /**
     * UNIFIED Product Card - Same content for Mobile & Desktop
     * Uses Tailwind responsive prefixes for size/spacing adjustments:
     * - sm: (640px+) - small tablets
     * - md: (768px+) - tablets  
     * - lg: (1024px+) - desktop
     */
    renderProductCard(p) {
        const meta = AppData.getCategory(p.category);
        const discount = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
        const nprPrice = AppData.formatNPR(p.price);
        const stars = AppData.renderStars(p.rating);
        const imgUrl = `/images/products/${p.category}/${p.image}`;

        // Form selector logic (same as desktop had before)
        const forms = p.forms || [];
        const showSelector = p.showFormSelector !== false && forms.length > 1;
        const showBadge = !showSelector && forms.length === 1;

        let formSelectorHTML = '';
        if (showBadge) {
            // Single form - show as badge
            formSelectorHTML = `<span class="px-1.5 sm:px-2 py-1 sm:py-1.5 border border-emerald-200 rounded-lg text-[10px] sm:text-xs bg-emerald-50 text-emerald-700">${forms[0]}</span>`;
        } else if (showSelector) {
            // Multiple forms - show dropdown (UNIFIED ID: form-{id})
            formSelectorHTML = `<select id="form-${p.id}" class="px-1.5 sm:px-2 py-1 sm:py-1.5 border border-emerald-200 rounded-lg text-[10px] sm:text-xs bg-white outline-none focus:border-emerald-500">${forms.map((f, i) => `<option value="${p.defaultForm || 'raw'}" ${i === 0 ? 'selected' : ''}>${f}</option>`).join('')}</select>`;
        }

        return `
        <div class="product-card group bg-white rounded-xl sm:rounded-2xl border border-emerald-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" onclick="UI.openProductModal(${p.id})">
            <!-- Image Section -->
            <div class="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden">
                <img src="${imgUrl}" alt="${p.name}" class="product-image w-full h-full object-contain p-2 sm:p-4" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full text-3xl sm:text-5xl\\'>${p.emoji}</div>'">
                
                <!-- Badges -->
                <div class="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
                    <span class="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-medium border ${meta ? meta.bgClass : ''}">${meta ? meta.emoji : ''} ${meta ? meta.label : ''}</span>
                </div>
                ${discount ? `<span class="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-1.5 sm:px-2 py-0.5 bg-red-500 text-white text-[8px] sm:text-xs font-bold rounded-full">${discount}% OFF</span>` : ''}
                ${p.featured ? `<span class="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 px-1.5 sm:px-2 py-0.5 bg-emerald-600 text-white text-[8px] sm:text-xs font-bold rounded-full">★ Featured</span>` : ''}
                <span class="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 bg-black/70 text-white text-[8px] sm:text-xs font-mono rounded-md shadow-lg">ID: ${p.id}</span>
            </div>

            <!-- Content Section -->
            <div class="p-2.5 sm:p-4">
                <!-- Weight Badge -->
                <div class="flex items-center gap-1 mb-0.5 sm:mb-1">
                    <span class="text-[9px] sm:text-[10px] text-emerald-600/70 font-medium">${p.defaultWeight}</span>
                </div>

                <!-- Product Name -->
                <h3 class="font-semibold text-emerald-900 text-xs sm:text-base line-clamp-1 mb-0.5 sm:mb-1">${p.name}</h3>

                <!-- Description (visible on all screens now) -->
                <p class="text-[10px] sm:text-sm text-emerald-900/60 line-clamp-2 leading-relaxed mb-1 sm:mb-2 hidden sm:block">${p.description}</p>
                <p class="text-[9px] sm:hidden text-emerald-900/60 line-clamp-1 leading-relaxed mb-1">${p.description}</p>

                <!-- Rating & Reviews -->
                <div class="flex items-center gap-1 mb-1 sm:mb-2">
                    <div class="flex items-center gap-0.5">${stars}</div>
                    <span class="text-[9px] sm:text-xs text-emerald-600/70">(${p.reviews})</span>
                </div>

                <!-- Price Section -->
                <div class="flex items-baseline gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <span id="price-${p.id}" class="text-sm sm:text-lg font-bold text-emerald-900">$${p.price.toFixed(2)}</span>
                    <span id="compare-${p.id}" class="text-[10px] sm:text-sm text-emerald-600/50 line-through ${p.comparePrice ? '' : 'hidden'}">${p.comparePrice ? '$' + p.comparePrice.toFixed(2) : ''}</span>
                </div>
                <div id="npr-${p.id}" class="text-[9px] sm:text-sm text-emerald-700 font-medium mb-1.5 sm:mb-3">${nprPrice}</div>

                <!-- Action Row: Weight + Form + Add Button -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2" onclick="event.stopPropagation()">
                    <!-- Weight Selector (UNIFIED ID: weight-{id}) -->
                    <select id="weight-${p.id}" onchange="UI.updateCardPrice(${p.id})" class="flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-emerald-200 rounded-lg text-[10px] sm:text-xs bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20">
                        ${p.weights.map(w => `<option value="${w}" ${w === p.defaultWeight ? 'selected' : ''}>${w}</option>`).join('')}
                    </select>

                    <!-- Form Selector (conditional) -->
                    ${formSelectorHTML}

                    <!-- Add to Cart Button -->
                    <button onclick="UI.quickAdd(${p.id}, event)" class="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-600 text-white text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 active:scale-95">
                        <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        <span>Add</span>
                    </button>
                </div>
            </div>
        </div>`;
    },

    quickAdd(productId, evt) {
        (evt || window.event)?.stopPropagation();
        const p = AppData.getProductById(productId);
        if (!p) return;

        // UNIFIED: Always use weight-{id} (no more mobile/desktop split)
        const selectEl = document.getElementById(`weight-${productId}`);
        const weight = selectEl ? selectEl.value : p.defaultWeight;
        const multiplier = p.priceMultiplier[weight] || 1;
        const price = +(p.price * multiplier).toFixed(2);

        // Get form from unified selector (form-{id})
        const forms = p.forms || [];
        let form = '';
        if (forms.length === 1) {
            form = forms[0];
        } else if (forms.length > 1 && p.showFormSelector !== false) {
            const formEl = document.getElementById(`form-${productId}`);
            form = formEl ? formEl.options[formEl.selectedIndex].text : forms[0];
        }

        const msg = Cart.add(p, weight, form, price);
        Toast.show(msg);
    },

    // === Category Filtering (with pagination reset) ===
    filterByCategory(cat) {
        this.currentCategory = cat;
        this.resetPagination(); // Reset to page 1 when category changes
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === cat);
        });
        this.renderProducts();
        
        // Auto-scroll to products section
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    filterProducts() {
        const desktopVal = document.getElementById('searchInput')?.value || '';
        const mobileVal = document.getElementById('mobileSearchInput')?.value || '';
        this.searchQuery = desktopVal || mobileVal;
        this.resetPagination(); // Reset to page 1 when search changes
        this.renderProducts();
    },

    // === Product Modal ===
    openProductModal(productId) {
        const p = AppData.getProductById(productId);
        if (!p) return;
        this.currentModalProduct = p;
        const meta = AppData.getCategory(p.category);
        const discount = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
        const imgUrl = `/images/products/${p.category}/${p.image}`;

        // Set video (product-specific video takes priority, falls back to category video)
        const video = document.getElementById('modalVideo');
        video.src = p.video || meta?.video || '';
        video.play().catch(() => {});

        // Set product image as poster
        const videoArea = video.parentElement;
        videoArea.style.backgroundImage = `url(${imgUrl})`;
        videoArea.style.backgroundSize = 'contain';
        videoArea.style.backgroundRepeat = 'no-repeat';
        videoArea.style.backgroundPosition = 'center';

        // Populate fields
        document.getElementById('modalTitle').textContent = p.emoji + ' ' + p.name;
        document.getElementById('modalStars').innerHTML = AppData.renderStars(p.rating);
        document.getElementById('modalReviewCount').textContent = `(${p.reviews} reviews)`;
        document.getElementById('modalPrice').textContent = '$' + p.price.toFixed(2);

        const cp = document.getElementById('modalComparePrice');
        if (p.comparePrice) { cp.textContent = '$' + p.comparePrice.toFixed(2); cp.classList.remove('hidden'); }
        else { cp.classList.add('hidden'); }

        this.updateModalNPR(p.price);

        // Unit badge
        const unitIcons = { weight: 'scale', volume: 'droplets', piece: 'package' };
        document.getElementById('modalUnitBadge').innerHTML =
            `<i data-lucide="${unitIcons[p.unitType]}" class="w-3.5 h-3.5"></i> ${p.unitType.charAt(0).toUpperCase() + p.unitType.slice(1)}`;

        // Weight select
        const ws = document.getElementById('modalWeight');
        ws.innerHTML = p.weights.map(w => `<option value="${w}" ${w === p.defaultWeight ? 'selected' : ''}>${w}</option>`).join('');

        document.getElementById('modalDescription').textContent = p.description;

        // Form select - use forms from product JSON data
        const modalFormEl = document.getElementById('modalForm');
        const modalFormField = document.getElementById('modalFormField');
        const modalWeightField = document.getElementById('modalWeightField');
        const modalSoapBadgeEl = document.getElementById('modalSoapBadge');

        const forms = p.forms || [];
        const showSelector = p.showFormSelector !== false && forms.length > 1;
        const showBadge = !showSelector && forms.length === 1;

        // Update form dropdown options from product data
        if (forms.length > 1) {
            modalFormEl.innerHTML = forms.map((f, i) =>
                `<option value="${p.defaultForm || 'raw'}" ${i === 0 ? 'selected' : ''}>${f}</option>`
            ).join('');
            modalFormField.classList.remove('hidden');
        } else {
            modalFormField.classList.add('hidden');
        }

        // Show/hide badge for single-form products (soap, oils)
        if (modalSoapBadgeEl) {
            if (showBadge) {
                modalSoapBadgeEl.innerHTML = `
                    <label class="text-xs font-medium text-emerald-700 mb-1 block">Form</label>
                    <div class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-emerald-50 text-emerald-700 text-center font-medium">${forms[0]}</div>
                `;
                modalSoapBadgeEl.classList.remove('hidden');
            } else {
                modalSoapBadgeEl.classList.add('hidden');
            }
        }

        modalWeightField.classList.toggle('col-span-2', !showSelector);

        // Category badge
        const catBadge = document.getElementById('modalCategoryBadge');
        catBadge.className = `absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${meta ? meta.bgClass : ''}`;
        catBadge.textContent = (meta ? meta.emoji : '') + ' ' + (meta ? meta.label : '');

        // Badges
        const db = document.getElementById('modalDiscountBadge');
        if (discount) { db.textContent = discount + '% OFF'; db.classList.remove('hidden'); }
        else { db.classList.add('hidden'); }

        const fb = document.getElementById('modalFeaturedBadge');
        p.featured ? fb.classList.remove('hidden') : fb.classList.add('hidden');

        // Reset checkout steps
        document.getElementById('checkoutStep1')?.classList.remove('hidden');
        document.getElementById('checkoutStep2')?.classList.add('hidden');
        document.getElementById('checkoutStep3')?.classList.add('hidden');
        document.getElementById('checkoutSuccess')?.classList.add('hidden');

        document.getElementById('productModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        lucide.createIcons();
    },

    closeProductModal() {
        document.getElementById('productModal').classList.add('hidden');
        const video = document.getElementById('modalVideo');
        video.pause();
        video.src = '';
        video.parentElement.style.backgroundImage = '';
        document.body.style.overflow = '';
        this.currentModalProduct = null;
    },

    updateModalPrice() {
        if (!this.currentModalProduct) return;
        const weight = document.getElementById('modalWeight').value;
        const multiplier = this.currentModalProduct.priceMultiplier[weight] || 1;
        const price = +(this.currentModalProduct.price * multiplier).toFixed(2);
        document.getElementById('modalPrice').textContent = '$' + price.toFixed(2);
        if (this.currentModalProduct.comparePrice) {
            const cmp = +(this.currentModalProduct.comparePrice * multiplier).toFixed(2);
            document.getElementById('modalComparePrice').textContent = '$' + cmp.toFixed(2);
        }
        this.updateModalNPR(price);
    },

    updateModalNPR(usdPrice) {
        document.getElementById('modalNPRPrice').textContent = AppData.formatNPR(usdPrice);
        document.getElementById('modalRateNote').textContent =
            `Based on exchange rate: 1 USD = ${SiteConfig.exchangeRate} NPR`;
    },

    /**
     * UNIFIED Price Update - Single set of IDs (no more mprice/mnpr split)
     * Updates price-{id}, compare-{id}, npr-{id} only
     */
    updateCardPrice(productId) {
        const p = AppData.getProductById(productId);
        if (!p) return;

        // UNIFIED: Always use weight-{id}
        const selectEl = document.getElementById(`weight-${productId}`);
        const weight = selectEl ? selectEl.value : p.defaultWeight;
        const multiplier = p.priceMultiplier[weight] || 1;
        const newPrice = +(p.price * multiplier).toFixed(2);

        // Update price element
        const priceEl = document.getElementById(`price-${productId}`);
        if (priceEl) priceEl.textContent = '$' + newPrice.toFixed(2);

        // Update compare price
        const compareEl = document.getElementById(`compare-${productId}`);
        if (compareEl && p.comparePrice) {
            const cmpPrice = +(p.comparePrice * multiplier).toFixed(2);
            compareEl.textContent = '$' + cmpPrice.toFixed(2);
            compareEl.classList.remove('hidden');
        }

        // Update NPR price
        const nprEl = document.getElementById(`npr-${productId}`);
        if (nprEl) nprEl.textContent = AppData.formatNPR(newPrice);
    },

    addFromModal() {
        if (!this.currentModalProduct) return;
        const p = this.currentModalProduct;
        const weight = document.getElementById('modalWeight').value;

        // Get form from product data
        const forms = p.forms || [];
        let form = '';
        if (forms.length === 1) {
            form = forms[0];
        } else if (forms.length > 1) {
            const formEl = document.getElementById('modalForm');
            form = formEl ? formEl.options[formEl.selectedIndex].text : forms[0];
        }

        const multiplier = p.priceMultiplier[weight] || 1;
        const price = +(p.price * multiplier).toFixed(2);
        const msg = Cart.add(p, weight, form, price);
        Toast.show(msg);
        this.closeProductModal();
    },

    toggleVideo() {
        const v = document.getElementById('modalVideo');
        const icon = document.getElementById('videoPlayIcon');
        if (v.paused) {
            v.play();
            icon.setAttribute('data-lucide', 'pause');
        } else {
            v.pause();
            icon.setAttribute('data-lucide', 'play');
        }
        lucide.createIcons();
    },

    replayVideo() {
        const v = document.getElementById('modalVideo');
        v.currentTime = 0;
        v.play();
        document.getElementById('videoPlayIcon').setAttribute('data-lucide', 'pause');
        lucide.createIcons();
    },

    // === Cart Drawer ===
    openCart() {
        document.getElementById('cartDrawer').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        Cart.renderItems();
        Checkout.switchTab('cart');
        lucide.createIcons();
    },

    closeCart() {
        document.getElementById('cartDrawer').classList.add('hidden');
        document.body.style.overflow = '';
    },

    // === Mobile Toggles ===
    toggleMobileSearch() {
        document.getElementById('mobileSearch').classList.toggle('hidden');
    },

    toggleMobileMenu() {
        document.getElementById('mobileMenu').classList.toggle('hidden');
    },

    // === Live Time ===
    updateLiveTime() {
        const el = document.getElementById('liveTime');
        if (!el) return;
        const now = new Date();
        el.textContent = now.toLocaleString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true, timeZone: 'Asia/Kathmandu', timeZoneName: 'short'
        });
    },

    // === Exchange Rate Display ===
    updateExchangeDisplay() {
        const el = document.getElementById('exchangeRate');
        if (el) el.textContent = AppData.formatNPR(1).replace('Rs. ', '');
    }
};

// === Toast Notifications ===
const Toast = {
    show(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast-enter flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`;
        toast.innerHTML = `${type === 'error' ? '✕' : '✓'} ${message}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};
