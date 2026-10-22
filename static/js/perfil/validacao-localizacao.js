/* =========================================================
   VALIDAÇÃO DA LOCALIZAÇÃO
========================================================= */

import { DOM } from './dom.js';

export function localizacaoValida() {
    if (!DOM.state || !DOM.city) return false;

    const estado = DOM.state.value.trim();
    const cidade = DOM.city.value.trim();

    if (!estado || !cidade) return false;

    const textoEstado =
        DOM.state.options[DOM.state.selectedIndex]?.textContent
            ?.trim()
            .toLowerCase() || "";

    const textoCidade =
        DOM.city.options[DOM.city.selectedIndex]?.textContent
            ?.trim()
            .toLowerCase() || "";

    const opcoesInvalidas = [
        "escolha um estado",
        "escolha uma cidade",
        "selecione o estado",
        "selecione a cidade",
        "escolha um ***",
        "selecione um ***"
    ];

    return !(
        opcoesInvalidas.includes(estado.toLowerCase()) ||
        opcoesInvalidas.includes(cidade.toLowerCase()) ||
        opcoesInvalidas.includes(textoEstado) ||
        opcoesInvalidas.includes(textoCidade)
    );
}

export function avisarLocalizacaoInvalida() {
    if (typeof exibirNotificacao === "function") {
        exibirNotificacao(
            "erro",
            "Selecione um estado e uma cidade antes de salvar."
        );
    }

    if (!DOM.state?.value) {
        DOM.state?.focus();
    } else {
        DOM.city?.focus();
    }
}
