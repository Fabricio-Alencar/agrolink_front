/**
 * ARQUIVO: planilha.js
 * OBJETIVO:
 * - Inicializar o sistema de importação de planilhas
 * - Conectar os módulos
 * - Disponibilizar as funções necessárias ao HTML
 */

import {
    abrirModalPlanilha,
    fecharModalPlanilha,
    resetarModalPlanilha
} from "./modal.js";

import {
    inicializarLeitorPlanilha,
    processarArquivoExcel
} from "./leitor.js";

import {
    inicializarEventosResultados,
    mudarStatusImportacao
} from "./resultados.js";

import {
    importarProdutos
} from "./importacao.js";

// =====================================================
// DISPONIBILIZAR FUNÇÕES PARA O HTML
// =====================================================

// Mantém compatibilidade com chamadas como:
// onclick="abrirModalPlanilha()"

window.abrirModalPlanilha = abrirModalPlanilha;
window.fecharModalPlanilha = fecharModalPlanilha;
window.resetarModalPlanilha = resetarModalPlanilha;

// Mantém acesso às funções caso outros scripts precisem delas.
window.processarArquivoExcel = processarArquivoExcel;
window.mudarStatusImportacao = mudarStatusImportacao;

// =====================================================
// INICIALIZAR EVENTOS
// =====================================================

function inicializarImportacaoPlanilha() {
    inicializarLeitorPlanilha();
    inicializarEventosResultados();

    const btnConfirmar = document.getElementById(
        "btnConfirmarPlanilha"
    );

    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", importarProdutos);
    }
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

inicializarImportacaoPlanilha();