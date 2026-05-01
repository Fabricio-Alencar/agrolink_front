// ===============================
// 3. UTILIDADES (Responsabilidade: funções auxiliares)
// ===============================
export function renderizarEstrelas(nota) {
    const starColor = "#ffd700";
    const emptyColor = "#e0e0e0";
    let htmlStr = '<div style="display:flex; align-items:center; gap:2px;">';

    for (let i = 1; i <= 5; i++) {
        if (nota >= i) {
            htmlStr += `<svg width="16" height="16" viewBox="0 0 24 24" fill="${starColor}"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
        } else if (nota >= i - 0.5) {
            htmlStr += `
                <svg width="16" height="16" viewBox="0 0 24 24">
                    <defs>
                        <linearGradient id="halfGrad${i}">
                            <stop offset="50%" stop-color="${starColor}"/>
                            <stop offset="50%" stop-color="${emptyColor}"/>
                        </linearGradient>
                    </defs>
                    <path fill="url(#halfGrad${i})" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>`;
        } else {
            htmlStr += `<svg width="16" height="16" viewBox="0 0 24 24" fill="${emptyColor}"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
        }
    }
    htmlStr += '</div>';
    return htmlStr;
}

export function formatarPreco(valor) {
    return valor.toFixed(2).replace('.', ',');
}
