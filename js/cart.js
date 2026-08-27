/**
 * cart.js - Shopping Cart Management
 * Uses localStorage for persistence.
 */

const Cart = {
    STORAGE_KEY: 'eco-cart',
    items: [],

    init() {
        this.items = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    },

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        this.updateBadge();
        this.renderItems();
    },

    add(product, weight, form, price) {
        const existing = this.items.find(
            item => item.productId === product.id &&
                     item.weight === weight &&
                     item.form === form
        );
        if (existing) {
            existing.qty++;
        } else {
            this.items.push({
                productId: product.id,
                name: product.name,
                emoji: product.emoji,
                weight,
                form,
                price,
                qty: 1,
                category: product.category
            });
        }
        this.save();
        return `${product.name} added to cart!`;
    },

    remove(index) {
        this.items.splice(index, 1);
        this.save();
    },

    clear() {
        this.items = [];
        this.save();
    },

    get totalQty() {
        return this.items.reduce((sum, item) => sum + item.qty, 0);
    },

    get subtotal() {
        return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    },

    get isEmpty() {
        return this.items.length === 0;
    },

    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;
        const qty = this.totalQty;
        if (qty > 0) {
            badge.textContent = qty;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    renderItems() {
        const itemsEl = document.getElementById('cartItems');
        const emptyEl = document.getElementById('cartEmpty');
        const summaryEl = document.getElementById('cartSummary');
        if (!itemsEl) return;

        if (this.isEmpty) {
            emptyEl.classList.remove('hidden');
            itemsEl.innerHTML = '';
            summaryEl.classList.add('hidden');
            return;
        }

        emptyEl.classList.add('hidden');
        summaryEl.classList.remove('hidden');

        itemsEl.innerHTML = this.items.map((item, i) => {
            const npr = AppData.formatNPR(item.price * item.qty);
            return `
            <div class="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-xl">
                <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">${item.emoji}</div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-emerald-900 text-sm truncate">${item.name}</div>
                    <div class="flex items-center gap-1 mt-0.5">
                        <span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded">${item.weight}</span>
                        ${item.form ? `<span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded">${item.form}</span>` : ''}
                    </div>
                    <div class="flex items-baseline gap-1 mt-1">
                        <span class="text-sm font-bold text-emerald-900">$${(item.price * item.qty).toFixed(2)}</span>
                        <span class="text-[10px] text-emerald-700">${npr}</span>
                    </div>
                </div>
                <button onclick="Cart.remove(${i})" class="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>`;
        }).join('');

        const totalNPR = AppData.formatNPR(this.subtotal);
        document.getElementById('cartSubtotal').textContent = '$' + this.subtotal.toFixed(2);
        document.getElementById('cartTotal').textContent = '$' + this.subtotal.toFixed(2) + ' / ' + totalNPR;

        lucide.createIcons();
    }
};
