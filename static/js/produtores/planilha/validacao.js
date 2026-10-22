/**
 * ARQUIVO: validacao.js
 * OBJETIVO:
 * - Validar os dados recebidos do Excel
 * - Normalizar categorias e unidades
 * - Validar preços e estoque
 * - Separar produtos válidos dos produtos com erros
 */

import {
    definirProdutosValidos
} from "./estado.js";

import {
    apresentarResultadosNoModal
} from "./resultados.js";

// =====================================================
// MAPEAMENTO E VALIDAÇÃO
// =====================================================

export function validarDadosDaPlanilha(produtosRecebidos) {
    const listaDeErrosEncontrados = [];
    const listaProdutosValidos = [];

    const categoriasValidas = [
        "frutas",
        "legumes",
        "hortalicas",
        "graos",
        "oleaginosas",
        "ervas",
        "outros"
    ];

    const unidadesValidas = [
        "kg",
        "g",
        "arroba",
        "t",
        "unidade",
        "duzia",
        "cento",
        "milheiro",
        "caixa",
        "saca",
        "maco",
        "bandeja",
        "litro"
    ];

    // =================================================
    // VALIDAR CADA PRODUTO
    // =================================================

    produtosRecebidos.forEach((item) => {
        const errosDesteProduto = [];

        const numeroLinhaReal = item._linhaExcelOriginal || 2;

        // =============================================
        // NOME
        // =============================================

        const nome = item.nomedoproduto || item.nome;

        if (
            nome === undefined ||
            nome === null ||
            String(nome).trim() === ""
        ) {
            errosDesteProduto.push(
                "Nome do produto é obrigatório"
            );
        }

        // =============================================
        // CATEGORIA
        // =============================================

        const categoriaRaw = item.categoria ?? "";

        let catTratada = String(categoriaRaw)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        if (catTratada === "fruta") {
            catTratada = "frutas";
        }

        if (catTratada === "legume") {
            catTratada = "legumes";
        }

        if (catTratada === "hortalica") {
            catTratada = "hortalicas";
        }

        if (
            catTratada.includes("grao") ||
            catTratada.includes("cereais")
        ) {
            catTratada = "graos";
        }

        if (
            catTratada.includes("oleaginosa") ||
            catTratada.includes("semente")
        ) {
            catTratada = "oleaginosas";
        }

        if (
            catTratada.includes("erva") ||
            catTratada.includes("tempero")
        ) {
            catTratada = "ervas";
        }

        if (
            !catTratada ||
            !categoriasValidas.includes(catTratada)
        ) {
            errosDesteProduto.push(
                `Categoria inválida ("${categoriaRaw || "Vazia"}")`
            );
        }

        // =============================================
        // UNIDADE
        // =============================================

        const unidadeRaw =
            item.formadevendaunidadedemedida ||
            item.unidade ||
            item.unidadedemedida ||
            "";

        let unidadeTratada = String(unidadeRaw)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        if (unidadeTratada.includes("arroba")) {
            unidadeTratada = "arroba";

        } else if (
            unidadeTratada.includes("quilograma") ||
            unidadeTratada.includes("kg")
        ) {
            unidadeTratada = "kg";

        } else if (
            unidadeTratada.includes("grama") ||
            unidadeTratada === "g"
        ) {
            unidadeTratada = "g";

        } else if (
            unidadeTratada.includes("unidade") ||
            unidadeTratada === "un"
        ) {
            unidadeTratada = "unidade";

        } else if (unidadeTratada.includes("duzia")) {
            unidadeTratada = "duzia";

        } else if (unidadeTratada.includes("cento")) {
            unidadeTratada = "cento";

        } else if (unidadeTratada.includes("milheiro")) {
            unidadeTratada = "milheiro";

        } else if (unidadeTratada.includes("saca")) {
            unidadeTratada = "saca";

        } else if (unidadeTratada.includes("maco")) {
            unidadeTratada = "maco";

        } else if (unidadeTratada.includes("litro")) {
            unidadeTratada = "litro";

        } else if (unidadeTratada.includes("caixa")) {
            unidadeTratada = "caixa";

        } else if (unidadeTratada.includes("bandeja")) {
            unidadeTratada = "bandeja";

        } else if (
            unidadeTratada.includes("tonelada") ||
            unidadeTratada === "t"
        ) {
            unidadeTratada = "t";
        }

        if (
            !unidadeTratada ||
            !unidadesValidas.includes(unidadeTratada)
        ) {
            errosDesteProduto.push(
                `Forma de Venda inválida ("${unidadeRaw || "Vazia"}")`
            );
        }

        // =============================================
        // PREÇO
        // =============================================

        const precoRaw =
            item.precorporunidadeescolhida ??
            item.precor ??
            item.preco;

        const preco = parseFloat(precoRaw);

        if (isNaN(preco) || preco <= 0) {
            errosDesteProduto.push(
                "Preço deve ser maior que zero"
            );
        }

        // =============================================
        // QUANTIDADE
        // =============================================

        const qtdRaw =
            item.estoquedisponivelnaunidadeescolhida ??
            item.quantidade ??
            item.estoque;

        const qtd = parseFloat(qtdRaw);

        if (isNaN(qtd) || qtd < 0) {
            errosDesteProduto.push(
                "Estoque inválido ou negativo"
            );
        }

        // =============================================
        // DESCRIÇÃO
        // =============================================

        const descricao =
            item.descricaoopcional ??
            item.descricao ??
            "";

        // =============================================
        // RESULTADO DA VALIDAÇÃO
        // =============================================

        if (errosDesteProduto.length > 0) {
            listaDeErrosEncontrados.push({
                linha: numeroLinhaReal,
                nome: nome || "Sem Nome",
                detalhes: errosDesteProduto
            });

        } else {
            listaProdutosValidos.push({
                identificadorTemporario: numeroLinhaReal,
                nome: nome,
                categoria: catTratada,
                unidade: unidadeTratada,
                precoOriginal: preco,
                quantidadeOriginal: qtd,
                descricao: descricao,
                status: "publicado",

                exibicaoPreco:
                    `R$ ${preco.toFixed(2).replace(".", ",")} / ${unidadeTratada}`,

                exibicaoQuantidade:
                    `${qtd} (${unidadeTratada}) em estoque`
            });
        }
    });

    // =================================================
    // COMPARTILHAR RESULTADOS
    // =================================================

    definirProdutosValidos(listaProdutosValidos);

    apresentarResultadosNoModal(
        listaProdutosValidos.length,
        listaDeErrosEncontrados
    );
}