// ===============================
// MAIN (PONTO DE ENTRADA)
// ===============================
console.log("🔥 MAIN CARREGADO");

import { renderizarProdutos } from './renderizacao.js';
import './filtros.js';
import './localizacao.js';
import './drawer_eventos.js';

import { fecharModal, emitirPedido, abrirModal } from './modal.js';


// funções globais (se precisar no HTML)
window.fecharModal = fecharModal;
window.emitirPedido = emitirPedido;
window.abrirModal = abrirModal;

// 🔹 inicializa tela
renderizarProdutos();