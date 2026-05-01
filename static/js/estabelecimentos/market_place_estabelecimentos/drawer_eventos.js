import { DOM } from './acesso_a_elementos_DOM.js';
import { aplicarFiltros } from './filtros.js';


// ===============================
// 7. DRAWER
// ===============================
function toggleDrawer() {
    DOM.sideDrawer.classList.toggle('active');
    DOM.drawerOverlay.classList.toggle('active');
}

// ===============================
// 8. EVENTOS
// ===============================
DOM.searchInput.addEventListener('input', aplicarFiltros);
DOM.filterCat.addEventListener('change', aplicarFiltros);
DOM.filterEstado.addEventListener('change', aplicarFiltros);
DOM.filterCidade.addEventListener('change', aplicarFiltros);
// DOM.filterDist.addEventListener('input', aplicarFiltros);

