/**
 * ARQUIVO: resultados.js
 * OBJETIVO:
 * - Exibir produtos válidos e produtos com erros
 * - Mostrar os motivos de falha na validação
 * - Permitir escolher publicado ou rascunho
 */

import {
    obterProdutosValidos,
    atualizarStatusProduto
} from "./estado.js";

// =====================================================
// ALTERAR STATUS DA IMPORTAÇÃO
// =====================================================
export function mudarStatusImportacao(id, novoStatus) {
    atualizarStatusProduto(id, novoStatus);
}

// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caractere];
    });
}

// =====================================================
// INICIALIZAR EVENTOS DOS RESULTADOS
// =====================================================

export function inicializarEventosResultados() {
    const divValidos = document.getElementById("listaValidos");

    if (!divValidos) {
        return;
    }

    // Evita registrar o mesmo evento mais de uma vez.
    if (divValidos.dataset.eventosInicializados === "true") {
        return;
    }

    divValidos.dataset.eventosInicializados = "true";

    divValidos.addEventListener("change", (evento) => {
        const seletor = evento.target.closest(
            ".select-status-importacao"
        );

        if (!seletor || !divValidos.contains(seletor)) {
            return;
        }

        const id = Number(seletor.dataset.identificador);

        atualizarStatusProduto(id, seletor.value);
    });
}

// =====================================================
// APRESENTAR RESULTADOS
// =====================================================

export function apresentarResultadosNoModal(
    totalValidos,
    listaErros = []
) {
    // =================================================
    // ESTADOS DO MODAL
    // =================================================

    const estadoUpload = document.getElementById("estadoUpload");
    const estadoResultado = document.getElementById("estadoResultado");

    if (estadoUpload) {
        estadoUpload.classList.remove("active");
    }

    if (estadoResultado) {
        estadoResultado.classList.add("active");
    }

    // =================================================
    // QUANTIDADES
    // =================================================

    const qtdValidos = document.getElementById("qtdValidos");
    const qtdErros = document.getElementById("qtdErros");

    if (qtdValidos) {
        qtdValidos.textContent = totalValidos;
    }

    if (qtdErros) {
        qtdErros.textContent = listaErros.length;
    }

    // =================================================
    // CONTAINERS
    // =================================================

    const divErros = document.getElementById("listaErros");
    const divValidos = document.getElementById("listaValidos");

    // =================================================
    // SEÇÕES
    // =================================================

    const secaoErros = document.getElementById("secaoErros");
    const secaoValidos = document.getElementById("secaoValidos");

    if (secaoErros) {
        secaoErros.style.display =
            listaErros.length > 0 ? "block" : "none";
    }

    if (secaoValidos) {
        secaoValidos.style.display =
            totalValidos > 0 ? "block" : "none";
    }

    // =================================================
    // CARDS DE ERRO
    // =================================================

    if (divErros) {
        divErros.innerHTML = listaErros.map(erro => `
            <div class="card-erro-planilha">
                <div class="card-erro-header">
                    <h4>${escaparHTML(erro.nome)}</h4>
                </div>

                <div class="card-erro-info">
                    <p>
                        Localizado na
                        <strong>Linha ${escaparHTML(erro.linha)}</strong>
                        do arquivo Excel.
                    </p>
                </div>

                <div class="card-erro-motivos">
                    <p>Inconsistências encontradas:</p>

                    <ul>
                        ${erro.detalhes.map(detalhe => `
                            <li>${escaparHTML(detalhe)}</li>
                        `).join("")}
                    </ul>
                </div>
            </div>
        `).join("");
    }

    // =================================================
    // CARDS VÁLIDOS
    // =================================================

    const produtos = obterProdutosValidos();

    if (divValidos) {
        divValidos.innerHTML = produtos.map(produto => `
            <div class="card-erro-planilha card-valido-planilha">
                <div class="card-erro-header">
                    <h4>${escaparHTML(produto.nome)}</h4>

                    <select
                        class="select-status-importacao"
                        data-identificador="${escaparHTML(produto.identificadorTemporario)}"
                        aria-label="Status de importação de ${escaparHTML(produto.nome)}"
                    >
                        <option
                            value="publicado"
                            ${produto.status === "publicado" ? "selected" : ""}
                        >
                            Publicar
                        </option>

                        <option
                            value="rascunho"
                            ${produto.status === "rascunho" ? "selected" : ""}
                        >
                            Salvar Rascunho
                        </option>
                    </select>
                </div>

                <div class="card-erro-info">
                    <p>
                        <strong>Estoque mapeado:</strong>
                        ${escaparHTML(produto.exibicaoQuantidade)}
                    </p>

                    <p>
                        <strong>Preço unitário:</strong>
                        ${escaparHTML(produto.exibicaoPreco)}
                    </p>
                </div>
            </div>
        `).join("");
    }

    // =================================================
    // BOTÃO DE IMPORTAÇÃO
    // =================================================

    const btn = document.getElementById("btnConfirmarPlanilha");

    if (btn) {
        btn.disabled = totalValidos === 0;

        btn.textContent = `Importar ${totalValidos} Produtos`;
    }
}