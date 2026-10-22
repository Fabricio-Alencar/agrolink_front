/**
 * ARQUIVO: modal.js
 * OBJETIVO:
 * - Controlar a abertura e o fechamento do modal
 * - Resetar os estados da interface
 */

import {
    limparProdutosValidos
} from "./estado.js";

// =====================================================
// ABRIR MODAL
// =====================================================

export function abrirModalPlanilha() {
    const modal = document.getElementById("modalPlanilha");

    if (modal) {
        modal.classList.add("active");
    }

    resetarModalPlanilha();
}

// =====================================================
// FECHAR MODAL
// =====================================================

export function fecharModalPlanilha() {
    const modal = document.getElementById("modalPlanilha");

    if (modal) {
        modal.classList.remove("active");
    }
}

// =====================================================
// RESETAR MODAL
// =====================================================

export function resetarModalPlanilha() {
    const estadoUpload = document.getElementById("estadoUpload");
    const estadoResultado = document.getElementById("estadoResultado");
    const campoInput = document.getElementById("inputPlanilha");

    if (estadoUpload) {
        estadoUpload.classList.add("active");
    }

    if (estadoResultado) {
        estadoResultado.classList.remove("active");
    }

    if (campoInput) {
        campoInput.value = "";
    }

    limparProdutosValidos();
}
