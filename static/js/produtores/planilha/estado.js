/**
 * ARQUIVO: estado.js
 * OBJETIVO:
 * - Centralizar o estado da importação
 * - Compartilhar os produtos válidos entre os módulos
 */

let listaProdutosValidos = [];

// =====================================================
// CONSULTAR PRODUTOS
// =====================================================

export function obterProdutosValidos() {
    return listaProdutosValidos;
}

// =====================================================
// ATUALIZAR LISTA DE PRODUTOS
// =====================================================

export function definirProdutosValidos(produtos) {
    listaProdutosValidos = produtos;
}

// =====================================================
// LIMPAR LISTA DE PRODUTOS
// =====================================================

export function limparProdutosValidos() {
    listaProdutosValidos = [];
}

// =====================================================
// ALTERAR STATUS DO PRODUTO
// =====================================================

export function atualizarStatusProduto(id, novoStatus) {
    const produto = listaProdutosValidos.find(
        p => p.identificadorTemporario === id
    );

    if (!produto) {
        return;
    }

    if (!["publicado", "rascunho"].includes(novoStatus)) {
        return;
    }

    produto.status = novoStatus;

    console.log(
        `Produto "${produto.nome}" alterado para: ${novoStatus}`
    );
}