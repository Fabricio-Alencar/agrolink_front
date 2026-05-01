// ===============================
// 6. MODAL (Com Integração Real com API)
// ===============================

import { setProdutoSelecionado, getProdutoSelecionado, DOM } from './acesso_a_elementos_DOM.js';
import { API } from './api.js'; // ⬅️ Importação necessária

// --- FUNÇÕES DE APOIO ---

function formatarDataBR(dataISO) {
    if (!dataISO) return '-';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function atualizarResumo() {
    const produto = getProdutoSelecionado();
    if (!produto) return;

    const qtd = DOM.inputQtd.value || '-';
    const data = DOM.inputData.value || '-';

    const resumoProduto = document.getElementById('resumoProduto');
    const resumoProdutor = document.getElementById('resumoProdutor');
    const resumoQtd = document.getElementById('resumoQtd');
    const resumoData = document.getElementById('resumoData');

    if (resumoProduto) resumoProduto.textContent = produto.nome;
    if (resumoProdutor) resumoProdutor.textContent = produto.produtor_nome || 'Produtor Local';
    if (resumoQtd) resumoQtd.textContent = `${qtd} ${produto.unidade}`;
    if (resumoData) resumoData.textContent = data !== '-' ? formatarDataBR(data) : '-';
}

// --- FUNÇÕES PRINCIPAIS ---

export function abrirModal(produto) {
    if (!produto) return;
    setProdutoSelecionado(produto);

    DOM.inputQtd.value = '';
    DOM.inputData.value = '';
    DOM.inputDesc.value = '';

    const modalUnit = document.getElementById('modalUnit');
    if (modalUnit) modalUnit.textContent = produto.unidade;

    atualizarResumo();
    DOM.modal.classList.add('active');
}

export function fecharModal() {
    DOM.modal.classList.remove('active');
    setProdutoSelecionado(null);
}

/**
 * Envia o pedido para o Backend
 */
export async function emitirPedido() {
    const qtdValue = DOM.inputQtd.value;
    const dataValue = DOM.inputData.value;

    if (!qtdValue || !dataValue) {
        alert("Por favor, preencha a quantidade e a data de entrega.");
        return;
    }

    const produto = getProdutoSelecionado();
    
    // 📦 Monta o objeto exatamente como o Backend (Flask) espera
    const pedido = {
        produto_id: produto.id,
        quantidade: parseFloat(qtdValue),
        data_entrega: dataValue,
        descricao: DOM.inputDesc.value || ""
    };

    try {
        // Bloqueia o botão ou mostra um loading se desejar
        console.log("Enviando negociação...", pedido);
        
        const resultado = await API.enviarNegociacao(pedido);
        exibirNotificacao('cadastro', "Solicitação de pedido enviada com sucesso!");

        fecharModal();

    } catch (error) {
        // Exibe o erro retornado pelo Flask (ex: "Faça login para negociar")
        exibirNotificacao('erro', "Erro ao realizar pedido: " + error.message);
    }
}

// --- EVENT LISTENERS ---

if (DOM.inputQtd) DOM.inputQtd.addEventListener('input', atualizarResumo);
if (DOM.inputData) DOM.inputData.addEventListener('change', atualizarResumo);

// Fecha se clicar fora do conteúdo do modal
window.addEventListener('click', (e) => {
    if (e.target === DOM.modal) fecharModal();
});