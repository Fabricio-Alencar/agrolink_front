// ===============================
// 6. MODAL (Com Integração Real com API)
// ===============================

import {
    setProdutoSelecionado,
    getProdutoSelecionado,
    DOM
} from './acesso_a_elementos_DOM.js';

import { API } from './api.js';

// --- FUNÇÕES DE APOIO ---

function formatarDataBR(dataISO) {
    if (!dataISO) return '-';

    const [ano, mes, dia] = dataISO.split('-');

    return `${dia}/${mes}/${ano}`;
}

// Define hoje como a data mínima permitida para entrega
function definirDataMinima() {
    if (!DOM.inputData) return;

    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    DOM.inputData.min = `${ano}-${mes}-${dia}`;
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

    if (resumoProduto) {
        resumoProduto.textContent = produto.nome;
    }

    if (resumoProdutor) {
        resumoProdutor.textContent = produto.produtor_nome || 'Produtor Local';
    }

    if (resumoQtd) {
        resumoQtd.textContent = `${qtd} ${produto.unidade}`;
    }

    if (resumoData) {
        resumoData.textContent = data !== '-' ? formatarDataBR(data) : '-';
    }
}

// --- FUNÇÕES PRINCIPAIS ---

export function abrirModal(produto) {
    if (!produto) return;

    setProdutoSelecionado(produto);

    DOM.inputQtd.value = '';
    DOM.inputData.value = '';
    DOM.inputDesc.value = '';

    // Impede a seleção de datas anteriores a hoje
    definirDataMinima();

    const modalUnit = document.getElementById('modalUnit');

    if (modalUnit) {
        modalUnit.textContent = produto.unidade;
    }

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
        alert('Por favor, preencha a quantidade e a data de entrega.');
        return;
    }

    // Valida novamente a data antes de enviar o pedido
    definirDataMinima();

    if (dataValue < DOM.inputData.min) {
        alert('A data de entrega não pode ser anterior a hoje.');
        return;
    }

    const produto = getProdutoSelecionado();

    if (!produto) {
        alert('Nenhum produto foi selecionado.');
        return;
    }

    // Monta o objeto esperado pelo Backend
    const pedido = {
        produto_id: produto.id,
        quantidade: parseFloat(qtdValue),
        data_entrega: dataValue,
        descricao: DOM.inputDesc.value || ''
    };

    try {
        console.log('Enviando negociação...', pedido);

        const resultado = await API.enviarNegociacao(pedido);

        exibirNotificacao(
            'cadastro',
            'Solicitação de pedido enviada com sucesso!'
        );

        fecharModal();

    } catch (error) {
        exibirNotificacao(
            'erro',
            'Erro ao realizar pedido: ' + error.message
        );
    }
}

// --- EVENT LISTENERS ---

if (DOM.inputQtd) {
    DOM.inputQtd.addEventListener('input', atualizarResumo);
}

if (DOM.inputData) {
    DOM.inputData.addEventListener('change', atualizarResumo);

    // Define a data mínima assim que o campo é inicializado
    definirDataMinima();
}

// Fecha se clicar fora do conteúdo do modal
window.addEventListener('click', (e) => {
    if (e.target === DOM.modal) {
        fecharModal();
    }
});
