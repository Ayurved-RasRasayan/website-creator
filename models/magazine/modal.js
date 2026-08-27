    openProductModal(productId) {
        const p = AppData.getProductById(productId);
        if (!p) return;
        this.currentModalProduct = p;
        const meta = AppData.getCategory(p.category);
        const discount = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
        const imgUrl = `/images/products/${p.category}/${p.image}`;
        const video = document.getElementById('modalVideo');
        video.src = p.video || meta?.video || '';
        video.play().catch(() => {});
        const videoArea = video.parentElement;
        videoArea.style.backgroundImage = `url(${imgUrl})`;
        videoArea.style.backgroundSize = 'contain';
        videoArea.style.backgroundRepeat = 'no-repeat';
        videoArea.style.backgroundPosition = 'center';
        document.getElementById('modalTitle').textContent = p.emoji + ' ' + p.name;
        document.getElementById('modalStars').innerHTML = AppData.renderStars(p.rating);
        document.getElementById('modalReviewCount').textContent = `(${p.reviews} reviews)`;
        document.getElementById('modalPrice').textContent = '$' + p.price.toFixed(2);
        const cp = document.getElementById('modalComparePrice');
        if (p.comparePrice) { cp.textContent = '$' + p.comparePrice.toFixed(2); cp.classList.remove('hidden'); }
        else { cp.classList.add('hidden'); }
        this.updateModalNPR(p.price);
        const unitIcons = { weight: 'scale', volume: 'droplets', piece: 'package' };
        document.getElementById('modalUnitBadge').innerHTML =
            `%%ICON_TAG scale w-3.5 h-3.5%% ${p.unitType.charAt(0).toUpperCase() + p.unitType.slice(1)}`;
        const ws = document.getElementById('modalWeight');
        ws.innerHTML = p.weights.map(w => `<option value="${w}" ${w === p.defaultWeight ? 'selected' : ''}>${w}</option>`).join('');
        document.getElementById('modalDescription').textContent = p.description;
        const modalFormEl = document.getElementById('modalForm');
        const modalFormField = document.getElementById('modalFormField');
        const modalWeightField = document.getElementById('modalWeightField');
        const modalSoapBadgeEl = document.getElementById('modalSoapBadge');
        const forms = p.forms || [];
        const showSelector = p.showFormSelector !== false && forms.length > 1;
        const showBadge = !showSelector && forms.length === 1;
        if (forms.length > 1) {
            modalFormEl.innerHTML = forms.map((f, i) =>
                `<option value="${p.defaultForm || 'raw'}" ${i === 0 ? 'selected' : ''}>${f}</option>`
            ).join('');
            modalFormField.classList.remove('hidden');
        } else {
            modalFormField.classList.add('hidden');
        }
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
        const catBadge = document.getElementById('modalCategoryBadge');
        catBadge.className = `absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${meta ? meta.bgClass : ''}`;
        catBadge.textContent = (meta ? meta.emoji : '') + ' ' + (meta ? meta.label : '');
        const db = document.getElementById('modalDiscountBadge');
        if (discount) { db.textContent = discount + '% OFF'; db.classList.remove('hidden'); }
        else { db.classList.add('hidden'); }
        const fb = document.getElementById('modalFeaturedBadge');
        p.featured ? fb.classList.remove('hidden') : fb.classList.add('hidden');
        document.getElementById('checkoutStep1')?.classList.remove('hidden');
        document.getElementById('checkoutStep2')?.classList.add('hidden');
        document.getElementById('checkoutStep3')?.classList.add('hidden');
        document.getElementById('checkoutSuccess')?.classList.add('hidden');
        document.getElementById('productModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        %%ICON_REFRESH%%;
    },