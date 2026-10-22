/**
 * ARQUIVO: leitor.js
 * OBJETIVO:
 * - Configurar o upload de arquivos Excel
 * - Permitir drag and drop
 * - Ler e normalizar a estrutura da planilha
 * - Encaminhar os dados para validação
 */

import {
    validarDadosDaPlanilha
} from "./validacao.js";

// =====================================================
// INICIALIZAR EVENTOS DO LEITOR
// =====================================================

export function inicializarLeitorPlanilha() {
    const zonaDrop = document.getElementById("dropZonePlanilha");
    const seletorArquivo = document.getElementById("inputPlanilha");

    // =================================================
    // DRAG & DROP
    // =================================================

    if (zonaDrop) {
        zonaDrop.addEventListener("dragover", (e) => {
            e.preventDefault();
            zonaDrop.classList.add("drag-over");
        });

        zonaDrop.addEventListener("dragleave", () => {
            zonaDrop.classList.remove("drag-over");
        });

        zonaDrop.addEventListener("drop", (e) => {
            e.preventDefault();

            zonaDrop.classList.remove("drag-over");

            if (e.dataTransfer.files.length > 0) {
                processarArquivoExcel(e.dataTransfer.files[0]);
            }
        });
    }

    // =================================================
    // INPUT DE ARQUIVO
    // =================================================

    if (seletorArquivo) {
        seletorArquivo.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                processarArquivoExcel(e.target.files[0]);
            }
        });
    }
}

// =====================================================
// PROCESSAR ARQUIVO EXCEL
// =====================================================

export function processarArquivoExcel(arquivo) {
    if (!arquivo) {
        return;
    }

    const nomeMinusculo = arquivo.name.toLowerCase();

    if (
        !nomeMinusculo.endsWith(".xlsx") &&
        !nomeMinusculo.endsWith(".xls")
    ) {
        exibirNotificacao(
            "exclusao",
            "Erro: Apenas arquivos Excel!"
        );

        return;
    }

    // =================================================
    // NOME DO ARQUIVO
    // =================================================

    const elNome = document.getElementById("nomeArquivo");

    if (elNome) {
        elNome.textContent = arquivo.name;
    }

    // =================================================
    // FILE READER
    // =================================================

    const leitor = new FileReader();

    leitor.onload = (e) => {
        try {
            const binario = e.target.result;

            const livroExcel = XLSX.read(binario, {
                type: "binary"
            });

            const nomePrimeiraAba = livroExcel.SheetNames[0];

            if (!nomePrimeiraAba) {
                exibirNotificacao(
                    "exclusao",
                    "A planilha não possui abas para leitura."
                );

                return;
            }

            const aba = livroExcel.Sheets[nomePrimeiraAba];

            const linhasMatriz = XLSX.utils.sheet_to_json(aba, {
                header: 1
            });

            // =========================================
            // LOCALIZAR CABEÇALHO
            // =========================================

            let indiceCabecalho = -1;

            for (let i = 0; i < linhasMatriz.length; i++) {
                const linha = linhasMatriz[i];

                if (linha && linha.length > 0) {
                    const temNome = linha.some(
                        coluna =>
                            coluna &&
                            coluna.toString().toLowerCase().includes("nome")
                    );

                    const temCategoria = linha.some(
                        coluna =>
                            coluna &&
                            coluna.toString().toLowerCase().includes("categoria")
                    );

                    if (temNome && temCategoria) {
                        indiceCabecalho = i;
                        break;
                    }
                }
            }

            if (indiceCabecalho === -1) {
                exibirNotificacao(
                    "exclusao",
                    "Não foi possível encontrar as colunas de produtos na planilha."
                );

                return;
            }

            // =========================================
            // LIMPAR CABEÇALHOS
            // =========================================

            const cabecalhosBrutos = linhasMatriz[indiceCabecalho];

            const cabecalhosLimpos = cabecalhosBrutos.map(coluna => {
                if (!coluna) {
                    return "";
                }

                return coluna
                    .toString()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, "");
            });

            // =========================================
            // NORMALIZAR DADOS
            // =========================================

            const dadosNormalizados = [];

            for (
                let i = indiceCabecalho + 1;
                i < linhasMatriz.length;
                i++
            ) {
                const linhaDados = linhasMatriz[i];

                if (
                    !linhaDados ||
                    linhaDados.length === 0 ||
                    linhaDados.every(
                        coluna =>
                            coluna === null ||
                            coluna === undefined ||
                            coluna === ""
                    )
                ) {
                    continue;
                }

                const novaLinha = {};

                cabecalhosLimpos.forEach((colunaLimpa, indexCol) => {
                    if (colunaLimpa) {
                        novaLinha[colunaLimpa] =
                            linhaDados[indexCol] !== undefined
                                ? linhaDados[indexCol]
                                : "";
                    }
                });

                novaLinha._linhaExcelOriginal = i + 1;

                dadosNormalizados.push(novaLinha);
            }

            // =========================================
            // ENCAMINHAR PARA VALIDAÇÃO
            // =========================================

            validarDadosDaPlanilha(dadosNormalizados);

        } catch (erroParsing) {
            console.error(
                "Erro ao processar a planilha:",
                erroParsing
            );

            exibirNotificacao(
                "exclusao",
                "Erro crítico ao ler a estrutura do arquivo."
            );
        }
    };

    leitor.onerror = () => {
        exibirNotificacao(
            "exclusao",
            "Não foi possível ler o arquivo selecionado."
        );
    };

    leitor.readAsBinaryString(arquivo);
}