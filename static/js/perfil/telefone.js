/* =========================================================
   TELEFONE — MÁSCARA E VALIDAÇÃO
========================================================= */

import { DOM } from './dom.js';

// Obtém somente os números do telefone.
function obterDigitosTelefone(valor) {
    let numeros = String(valor || "").replace(/\D/g, "");

    // Remove o código do Brasil se estiver presente.
    if (
        (numeros.length === 12 || numeros.length === 13) &&
        numeros.startsWith("55")
    ) {
        numeros = numeros.slice(2);
    }

    return numeros.slice(0, 11);
}

// Formata progressivamente: (11) 99999-9999.
function formatarTelefone(valor) {
    const numeros = obterDigitosTelefone(valor);

    if (!numeros) return "";

    if (numeros.length <= 2) {
        return `(${numeros}`;
    }

    const ddd = numeros.slice(0, 2);
    const numero = numeros.slice(2);

    if (numero.length <= 4) {
        return `(${ddd}) ${numero}`;
    }

    if (numeros.length <= 10) {
        return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
    }

    return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
}

// Valida o preenchimento do telefone.
function telefoneValido(valor) {
    const numeros = obterDigitosTelefone(valor);

    // Permite deixar o telefone vazio.
    if (!numeros) return true;

    // Exige DDD e número completo.
    return numeros.length === 10 || numeros.length === 11;
}

// Configura a máscara no campo de telefone.
function configurarCampoTelefone() {
    const telefone = DOM.inputs[2];

    if (!telefone) return;

    telefone.setAttribute("inputmode", "numeric");
    telefone.setAttribute("autocomplete", "tel");
    telefone.setAttribute("maxlength", "15");

    if (telefone.dataset.mascaraTelefoneConfigurada === "true") {
        return;
    }

    telefone.dataset.mascaraTelefoneConfigurada = "true";

    telefone.addEventListener("input", () => {
        telefone.value = formatarTelefone(telefone.value);
    });

    telefone.addEventListener("paste", () => {
        // O evento input aplicará a máscara após a colagem.
        requestAnimationFrame(() => {
            telefone.value = formatarTelefone(telefone.value);
        });
    });
}


export { obterDigitosTelefone, formatarTelefone, telefoneValido, configurarCampoTelefone };
