    renderProductCard(p) {
        const meta = AppData.getCategory(p.category);
        const discount = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
        const imgUrl = `/images/products/${p.category}/${p.image}`;

        return `
        <div class="product-card group bg-white rounded-lg border border-emerald-100 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 flex items-center gap-3 p-2.5 sm:p-3" onclick="UI.openProductModal(${p.id})">
            <div class="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-emerald-50 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="${imgUrl}" alt="${p.name}" class="w-full h-full object-contain p-1" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\'text-2xl sm:text-3xl\'>${p.emoji}</div>'">
                ${p.featured ? `<span class="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>` : ''}
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-emerald-900 text-xs sm:text-sm line-clamp-1 mb-0.5">${p.name}</h3>
                <span class="text-[9px] text-emerald-600/60">${p.defaultWeight}</span>
                <div class="flex items-center justify-between mt-1">
                    <span id="price-${p.id}" class="text-xs sm:text-sm font-bold text-emerald-900">$${p.price.toFixed(2)}</span>
                    <button onclick="UI.quickAdd(${p.id}, event)" class="px-2 py-1 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-semibold rounded-md hover:bg-emerald-700 transition-colors active:scale-95">Add</button>
                </div>
            </div>
        </div>`;
    },