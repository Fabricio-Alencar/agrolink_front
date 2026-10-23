console.log("🔥 MAIN CARREGADO");

import {
    renderizarProdutos,
    destacarProdutoPorId
} from './renderizacao.js';

import './filtros.js';
import './localizacao.js';
import './drawer_eventos.js';
import './filtro_persiana.js';
import '../../paginacao.js';

import {
    fecharModal,
    emitirPedido,
    abrirModal
} from './modal.js';

// =========================
// FUNÇÕES GLOBAIS DOS MODAIS
// =========================

window.fecharModal = fecharModal;
window.emitirPedido = emitirPedido;
window.abrirModal = abrirModal;

// =========================
// RENDERIZAR PRODUTOS
// =========================

await renderizarProdutos();

// =========================
// VEIO DO PERFIL DO PRODUTOR? (/marketplace?produto=ID)
// Navega até o produto e destaca o card
// =========================

const produtoEscolhido =
    new URLSearchParams(window.location.search).get("produto");

if (produtoEscolhido) {
    await destacarProdutoPorId(produtoEscolhido);
}
