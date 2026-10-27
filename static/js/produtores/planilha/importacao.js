
/**
 * ARQUIVO: importacao.js
 * OBJETIVO:
 * - Enviar os produtos válidos para a API
 * - Preservar o status escolhido pelo usuário
 * - Registrar falhas individuais
 * - Permitir tentar novamente os produtos que falharam
 * - Atualizar o marketplace após importações bem-sucedidas
 * - Exibir loader e barra de progresso durante o envio
 */

import {
    obterProdutosValidos,
    definirProdutosValidos
} from "./estado.js";

import {
    apresentarResultadosNoModal
} from "./resultados.js";

import {
    fecharModalPlanilha
} from "./modal.js";

import { renderProdutos } from "../renderizar.js";

// =====================================================
// FUNÇÕES DE AUXÍLIO PARA A BARRA DE PROGRESSO
// =====================================================

function criarOverlayProgresso() {
    let overlay = document.getElementById("overlayProgressoModal");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "overlayProgressoModal";
        overlay.className = "progresso-overlay";

        overlay.innerHTML = `
            <div
                class="progresso-card"
                role="status"
                aria-live="polite"
                aria-label="Importação de produtos em andamento"
            >
                <div class="loader-container" aria-hidden="true">
                    <span class="loader"></span>
                </div>

                <h3>Cadastrando produtos...</h3>

                <p id="textoProgressoModal">
                    Preparando sua colheita...
                </p>

                <div
                    class="progresso-trilho"
                    role="progressbar"
                    aria-label="Progresso da importação"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="0"
                    id="progressoAcessivel"
                >
                    <div
                        id="barraProgressoInterna"
                        class="progresso-barra"
                    ></div>
                </div>

                <p id="textoPorcentagem">0% concluído</p>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    const barra = document.getElementById("barraProgressoInterna");
    const porcentagem = document.getElementById("textoPorcentagem");
    const texto = document.getElementById("textoProgressoModal");
    const progressoAcessivel = document.getElementById("progressoAcessivel");

    // Reinicia o progresso caso o modal seja reutilizado.
    if (barra) barra.style.width = "0%";
    if (porcentagem) porcentagem.textContent = "0% concluído";
    if (texto) texto.textContent = "Preparando sua colheita...";
    if (progressoAcessivel) {
        progressoAcessivel.setAttribute("aria-valuenow", "0");
    }

    overlay.style.display = "flex";
}

// =====================================================
// ATUALIZAR PROGRESSO
// =====================================================

function atualizarProgresso(atual, total, nomeProduto) {
    const barra = document.getElementById("barraProgressoInterna");
    const textoPorcentagem = document.getElementById("textoPorcentagem");
    const textoProgresso = document.getElementById("textoProgressoModal");
    const progressoAcessivel = document.getElementById("progressoAcessivel");

    const porcentagem = Math.round((atual / total) * 100);

    if (barra) {
        barra.style.width = `${porcentagem}%`;
    }

    if (textoPorcentagem) {
        textoPorcentagem.textContent = `${porcentagem}% concluído`;
    }

    if (textoProgresso) {
        textoProgresso.textContent =
            `Enviando (${atual}/${total}): ${nomeProduto}`;
    }

    if (progressoAcessivel) {
        progressoAcessivel.setAttribute(
            "aria-valuenow",
            String(porcentagem)
        );
    }
}

// =====================================================
// REMOVER OVERLAY DE PROGRESSO
// =====================================================

function removerOverlayProgresso() {
    const overlay = document.getElementById("overlayProgressoModal");

    if (overlay) {
        overlay.style.display = "none";
    }
}

// =====================================================
// IMPORTAÇÃO FINAL VIA API
// =====================================================

export async function importarProdutos() {
    const produtos = obterProdutosValidos();

    if (produtos.length === 0) {
        return;
    }

    const btn = document.getElementById("btnConfirmarPlanilha");

    if (btn) {
        btn.disabled = true;
    }

    criarOverlayProgresso();

    let totalSucessos = 0;
    const listaErrosServidor = [];
    const produtosQueFalharam = [];
    const totalProdutos = produtos.length;

    // =================================================
    // ENVIAR CADA PRODUTO
    // =================================================

    for (let i = 0; i < totalProdutos; i++) {
        const produto = produtos[i];

        atualizarProgresso(
            i + 1,
            totalProdutos,
            produto.nome
        );

        try {
            const formData = new FormData();

            formData.append("nome", produto.nome);
            formData.append("categoria", produto.categoria);
            formData.append("preco", produto.precoOriginal);
            formData.append("unidade", produto.unidade);
            formData.append("quantidade", produto.quantidadeOriginal);
            formData.append("descricao", produto.descricao);
            formData.append("status_produto", produto.status);

            // =========================================
            // DEBUG
            // =========================================

            console.log("Importando produto:", produto.nome);
            console.log("Status:", produto.status);

            // =========================================
            // API
            // =========================================

            const resposta = await API.criarProduto(formData);

            // =========================================
            // RESULTADO
            // =========================================

            if (resposta && !resposta.erro) {
                totalSucessos++;
            } else {
                listaErrosServidor.push({
                    linha: "API",
                    nome: produto.nome,
                    detalhes: [
                        resposta?.erro ||
                        "Recusado pelas regras do servidor."
                    ]
                });

                produtosQueFalharam.push(produto);
            }

        } catch (error) {
            console.error(
                "Erro ao importar produto:",
                produto.nome,
                error
            );

            listaErrosServidor.push({
                linha: "Rede",
                nome: produto.nome,
                detalhes: [
                    "Falha crítica de comunicação com o servidor."
                ]
            });

            produtosQueFalharam.push(produto);
        }
    }

    // Esconde a barra ao terminar.
    removerOverlayProgresso();

    if (btn) {
        btn.disabled = false;
    }

    // =================================================
    // ATUALIZAR MARKETPLACE
    // =================================================

    if (totalSucessos > 0) {
        await renderProdutos();

        const plural = totalSucessos > 1 ? "s" : "";

        exibirNotificacao(
            "cadastro",
            `${totalSucessos} produto${plural} adicionado${plural}!`
        );
    }

    // =================================================
    // PRODUTOS QUE FALHARAM
    // =================================================

    if (listaErrosServidor.length > 0) {
        definirProdutosValidos(produtosQueFalharam);

        apresentarResultadosNoModal(
            produtosQueFalharam.length,
            listaErrosServidor
        );

        exibirNotificacao(
            "erro",
            `${listaErrosServidor.length} produto(s) falharam no processamento externo.`
        );

    } else {
        fecharModalPlanilha();
    }
}
