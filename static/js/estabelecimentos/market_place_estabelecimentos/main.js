console.log("🔥 MAIN CARREGADO");

import { renderizarProdutos } from './renderizacao.js';

import './filtros.js';
import './localizacao.js';
import './drawer_eventos.js';

import {
    fecharModal,
    emitirPedido,
    abrirModal
} from './modal.js';


window.fecharModal = fecharModal;
window.emitirPedido = emitirPedido;
window.abrirModal = abrirModal;


console.log("📌 Antes de renderizar");

console.log(
    "📌 productsGrid:",
    document.getElementById("productsGrid")
);

console.log(
    "📌 resultsCount:",
    document.getElementById("resultsCount")
);


renderizarProdutos();

console.log("📌 Depois de renderizar");