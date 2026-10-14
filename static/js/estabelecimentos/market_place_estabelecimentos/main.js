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


await renderizarProdutos();

console.log("📌 Depois de renderizar");


// =========================
// VEIO DO PERFIL DO PRODUTOR? (/marketplace?produto=ID)
// Rola até o produto e destaca o card
// =========================

const produtoEscolhido =
    new URLSearchParams(window.location.search).get("produto");

if (produtoEscolhido) {

    const card = document.querySelector(
        `.product-card[data-produto-id="${CSS.escape(produtoEscolhido)}"]`
    );

    if (card) {
        card.classList.add("produto-destacado");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => card.classList.remove("produto-destacado"), 4000);
    }
}