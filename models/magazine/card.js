    renderProductCard(p) {
        const meta = AppData.getCategory(p.category);
        const discount = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
        const nprPrice = AppData.formatNPR(p.price);
        const stars = AppData.renderStars(p.rating);
        const imgUrl = `/images/products/${p.category}/${p.image}`;
        const forms = p.forms || [];
        const showSelector = p.showFormSelector !== false && forms.length > 1;
        const showBadge = !showSelector && forms.length === 1;
        let formSelectorHTML = '';
        if (showBadge) {
            formSelectorHTML = `<span class="px-2 py-1 border border-emerald-200 rounded-lg text-[10px] sm:text-xs bg-emerald-50 text-emerald-700">${forms[0]}</span>`;
        } else if (showSelector) {
            formSelectorHTML = `<select id="form-${p.id}" class="px-2 py-1 border border-emerald-200 rounded-lg text-[10px] sm:text-xs bg-white outline-none focus:border-emerald-500">${forms.map((f, i) => `<option value="${p.defaultForm || 'raw'}" ${i === 0 ? 'selected' : ''}>${f}</option>`).join('')}</select>`;
        }
        return `
        <div class="product-card group bg-white rounded-2xl border border-emerald-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300" onclick="UI.openProductModal(${p.id})">
            <div class="relative h-44 sm:h-56 md:h-64 bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden">
                <img src="${imgUrl}" alt="${p.name}" class="product-image w-full h-full object-contain p-4 sm:p-6" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\'flex items-center justify-center h-full text-5xl sm:text-6xl\'>${p.emoji}</div>'">
                <div class="absolute top-2 left-2">
                    <span class="px-2 py-1 rounded-full text-[9px] sm:text-xs font-medium border backdrop-blur-sm bg-white/80 ${meta ? meta.bgClass : ''}">${meta ? meta.emoji : ''} ${meta ? meta.label : ''}</span>
                </div>
                ${discount ? `<span class="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-[9px] sm:text-xs font-bold rounded-full backdrop-blur-sm">${discount}% OFF</span>` : ''}
                ${p.featured ? `<span class="absolute bottom-2 right-2 px-2 py-1 bg-emerald-600 text-white text-[9px] sm:text-xs font-bold rounded-full backdrop-blur-sm">★ Featured</span>` : ''}
            </div>
            <div class="p-4 sm:p-5">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] sm:text-xs text-emerald-600/70 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">${p.defaultWeight}</span>
                    ${meta ? `<span class="text-[10px] text-emerald-500">${meta.label}</span>` : ''}
                </div>
                <h3 class="font-bold text-emerald-900 text-sm sm:text-lg line-clamp-2 mb-1.5 leading-snug">${p.name}</h3>
                <p class="text-[10px] sm:text-sm text-emerald-900/60 line-clamp-2 leading-relaxed mb-2.5">${p.description}</p>
                <div class="flex items-center gap-1.5 mb-2.5">
                    <div class="flex items-center gap-0.5">${stars}</div>
                    <span class="text-[10px] sm:text-xs text-emerald-600/70">(${p.reviews} reviews)</span>
                </div>
                <div class="flex items-baseline gap-2 mb-1">
                    <span id="price-${p.id}" class="text-base sm:text-xl font-bold text-emerald-900">$${p.price.toFixed(2)}</span>
                    <span id="compare-${p.id}" class="text-[10px] sm:text-sm text-emerald-600/50 line-through ${p.comparePrice ? '' : 'hidden'}">${p.comparePrice ? '$' + p.comparePrice.toFixed(2) : ''}</span>
                </div>
                <div id="npr-${p.id}" class="text-[10px] sm:text-sm text-emerald-700 font-medium mb-3">${nprPrice}</div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" onclick="event.stopPropagation()">
                    <select id="weight-${p.id}" onchange="UI.updateCardPrice(${p.id})" class="flex-1 px-2 py-2 border border-emerald-200 rounded-lg text-xs bg-white outline-none focus:border-emerald-500">
                        ${p.weights.map(w => `<option value="${w}" ${w === p.defaultWeight ? 'selected' : ''}>${w}</option>`).join('')}
                    </select>
                    ${formSelectorHTML}
                    <button onclick="UI.quickAdd(${p.id}, event)" class="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>`;
    },