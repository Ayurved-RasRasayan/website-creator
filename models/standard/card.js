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
            formSelectorHTML = `<span class="px-1.5 sm:px-2 py-1 sm:py-1.5 border border-emerald-200 rounded-lg text-[10px] sm:text-xs bg-emerald-50 text-emerald-700">${forms[0]}</span>`;
        } else if (showSelector) {
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
                ${p.featured ? `<span class="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 px-1.5 sm:px-2 py-0.5 bg-emerald-600 text-white text-[8px] sm:text-xs font-bold rounded-full">\u2605 Featured</span>` : ''}
                <span class="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 bg-black/70 text-white text-[8px] sm:text-xs font-mono rounded-md shadow-lg">ID: ${p.id}</span>
            </div>

            <!-- Content Section -->
            <div class="p-2.5 sm:p-4">
                <div class="flex items-center gap-1 mb-0.5 sm:mb-1">
                    <span class="text-[9px] sm:text-[10px] text-emerald-600/70 font-medium">${p.defaultWeight}</span>
                </div>
                <h3 class="font-semibold text-emerald-900 text-xs sm:text-base line-clamp-1 mb-0.5 sm:mb-1">${p.name}</h3>
                <p class="text-[10px] sm:text-sm text-emerald-900/60 line-clamp-2 leading-relaxed mb-1 sm:mb-2 hidden sm:block">${p.description}</p>
                <p class="text-[9px] sm:hidden text-emerald-900/60 line-clamp-1 leading-relaxed mb-1">${p.description}</p>
                <div class="flex items-center gap-1 mb-1 sm:mb-2">
                    <div class="flex items-center gap-0.5">${stars}</div>
                    <span class="text-[9px] sm:text-xs text-emerald-600/70">(${p.reviews})</span>
                </div>
                <div class="flex items-baseline gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <span id="price-${p.id}" class="text-sm sm:text-lg font-bold text-emerald-900">$${p.price.toFixed(2)}</span>
                    <span id="compare-${p.id}" class="text-[10px] sm:text-sm text-emerald-600/50 line-through ${p.comparePrice ? '' : 'hidden'}">${p.comparePrice ? '$' + p.comparePrice.toFixed(2) : ''}</span>
                </div>
                <div id="npr-${p.id}" class="text-[9px] sm:text-sm text-emerald-700 font-medium mb-1.5 sm:mb-3">${nprPrice}</div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2" onclick="event.stopPropagation()">
                    <select id="weight-${p.id}" onchange="UI.updateCardPrice(${p.id})" class="flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 border border-emerald-200 rounded-lg text-[10px] sm:text-xs bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20">
                        ${p.weights.map(w => `<option value="${w}" ${w === p.defaultWeight ? 'selected' : ''}>${w}</option>`).join('')}
                    </select>
                    ${formSelectorHTML}
                    <button onclick="UI.quickAdd(${p.id}, event)" class="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-600 text-white text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 active:scale-95">
                        <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        <span>Add</span>
                    </button>
                </div>
            </div>
        </div>`;
    },