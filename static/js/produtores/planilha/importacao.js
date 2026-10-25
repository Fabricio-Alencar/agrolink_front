/**
 * ARQUIVO: importacao.js
 * OBJETIVO:
 * - Enviar os produtos válidos para a API
 * - Preservar o status escolhido pelo usuário
 * - Registrar falhas individuais
 * - Permitir tentar novamente os produtos que falharam
 * - Atualizar o marketplace após importações bem-sucedidas
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

import { renderProdutos } from '../renderizar.js';

// =====================================================
// IMPORTAÇÃO FINAL VIA API
// =====================================================

export async function importarProdutos() {
    const produtos = obterProdutosValidos();

    if (produtos.length === 0) {
        return;
    }

    const btn = document.getElementById("btnConfirmarPlanilha");

    if (!btn) {
        return;
    }

    btn.disabled = true;
    btn.textContent = "Enviando para o Servidor...";

    let totalSucessos = 0;

    const listaErrosServidor = [];
    const produtosQueFalharam = [];

    // =================================================
    // ENVIAR CADA PRODUTO
    // =================================================

    for (const produto of produtos) {
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