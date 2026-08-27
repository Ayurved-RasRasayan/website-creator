/**
 * checkout.js - QR Checkout Flow & Order Management
 */

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

const Checkout = {
    currentTab: 'cart',
    proofFile: null,

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.cart-tab').forEach(t => {
            const isActive = t.dataset.tab === tab;
            t.classList.toggle('text-emerald-600', isActive);
            t.classList.toggle('border-emerald-600', isActive);
            t.classList.toggle('text-emerald-400', !isActive);
            t.classList.toggle('border-transparent', !isActive);
        });
        document.getElementById('cartTabContent').classList.toggle('hidden', tab !== 'cart');
        document.getElementById('checkoutTabContent').classList.toggle('hidden', tab !== 'checkout');
        document.getElementById('ordersTabContent').classList.toggle('hidden', tab !== 'orders');
        document.getElementById('cartFooter').classList.toggle('hidden', tab === 'checkout' || tab === 'orders');

        if (tab === 'orders') this.renderOrders();
        if (tab === 'cart') Cart.renderItems();
    },

    goToCheckout() {
        if (Cart.isEmpty) return;
        this.switchTab('checkout');
        this.goStep(1);
    },

    goStep(step) {
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`checkoutStep${i}`)?.classList.toggle('hidden', i !== step);
        }
        document.getElementById('checkoutSuccess')?.classList.add('hidden');
    },

    goStep2() {
        const name = document.getElementById('coName').value.trim();
        const email = document.getElementById('coEmail').value.trim();
        const phone = document.getElementById('coPhone').value.trim();
        const address = document.getElementById('coAddress').value.trim();

        if (name.length < 2 || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || phone.length < 7 || address.length < 5) {
            Toast.show('Please fill all fields correctly', 'error');
            return;
        }

        const totalNPR = AppData.formatNPR(Cart.subtotal);
        document.getElementById('checkoutNPR').textContent = totalNPR;
        document.getElementById('checkoutUSD').textContent = '$' + Cart.subtotal.toFixed(2);
        this.goStep(2);
    },

    goStep3() {
        const summary = document.getElementById('orderSummary');
        const province = document.getElementById('coProvince')?.value.trim();
        const addressLine = [
            document.getElementById('coAddress').value,
            document.getElementById('coCity').value,
            province
        ].filter(Boolean).join(', ');

        summary.innerHTML = `
            <div class="flex justify-between"><span class="text-emerald-600/70">Name:</span><span class="text-emerald-900">${escapeHtml(document.getElementById('coName').value)}</span></div>
            <div class="flex justify-between"><span class="text-emerald-600/70">Email:</span><span class="text-emerald-900">${escapeHtml(document.getElementById('coEmail').value)}</span></div>
            <div class="flex justify-between"><span class="text-emerald-600/70">Phone:</span><span class="text-emerald-900">${escapeHtml(document.getElementById('coPhone').value)}</span></div>
            <div class="flex justify-between"><span class="text-emerald-600/70">Address:</span><span class="text-emerald-900">${escapeHtml(addressLine)}</span></div>
            <div class="flex justify-between font-bold pt-2 border-t border-emerald-200"><span>Total:</span><span>${AppData.formatNPR(Cart.subtotal)}</span></div>
        `;
        this.goStep(3);
    },

    handleProofUpload(input) {
        if (input.files && input.files[0]) {
            this.proofFile = input.files[0];
            const fn = document.getElementById('proofFileName');
            fn.textContent = '📎 ' + this.proofFile.name;
            fn.classList.remove('hidden');
        }
    },

    submitOrder() {
        if (!this.proofFile) {
            Toast.show('Please upload payment proof', 'error');
            return;
        }

        const orderId = 'ORD-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const order = {
            id: orderId,
            items: [...Cart.items],
            total: Cart.subtotal,
            totalNPR: +(Cart.subtotal * SiteConfig.exchangeRate).toFixed(2),
            name: document.getElementById('coName').value,
            email: document.getElementById('coEmail').value,
            phone: document.getElementById('coPhone').value,
            address: [
                document.getElementById('coAddress').value,
                document.getElementById('coCity').value,
                document.getElementById('coProvince')?.value.trim()
            ].filter(Boolean).join(', '),
            timestamp: new Date().toISOString()
        };

        // Save order
        const orders = JSON.parse(localStorage.getItem('eco-orders') || '[]');
        orders.push(order);
        localStorage.setItem('eco-orders', JSON.stringify(orders));

        // Show success
        document.getElementById('orderConfirmId').textContent =
            `Order ID: ${orderId} | Total: ${AppData.formatNPR(order.total)} | ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })}`;

        for (let i = 1; i <= 3; i++) {
            document.getElementById(`checkoutStep${i}`)?.classList.add('hidden');
        }
        document.getElementById('checkoutSuccess')?.classList.remove('hidden');

        // Clear cart
        Cart.clear();
        this.proofFile = null;
        Toast.show('Order submitted successfully!');
    },

    renderOrders() {
        const el = document.getElementById('ordersList');
        const empty = document.getElementById('ordersEmpty');
        const orders = JSON.parse(localStorage.getItem('eco-orders') || '[]');

        if (orders.length === 0) {
            empty?.classList.remove('hidden');
            if (el) el.innerHTML = '';
            return;
        }
        empty?.classList.add('hidden');

        el.innerHTML = orders.slice().reverse().map(o => `
            <div class="p-3 bg-emerald-50/50 rounded-xl">
                <div class="flex items-center justify-between mb-1">
                    <span class="font-mono text-xs text-emerald-700">${o.id}</span>
                    <span class="text-[10px] text-emerald-500">${new Date(o.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })}</span>
                </div>
                <div class="text-sm font-semibold text-emerald-900">${AppData.formatNPR(o.total)}</div>
                <div class="text-xs text-emerald-600/70 mt-0.5">${o.items.length} item(s) — ${escapeHtml(o.items.map(i => i.name).join(', '))}</div>
            </div>
        `).join('');
    }
};
