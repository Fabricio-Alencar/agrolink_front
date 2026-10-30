
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [
        {
            name: "expor-funcoes-produtores-para-testes",

            transform(codigo, id) {
                const caminho = id.replace(/\\/g, "/");

                // API
                if (caminho.endsWith("/static/js/produtores/api.js")) {
                    return {
                        code: `${codigo}\nexport { API };`,
                        map: null
                    };
                }

                // Botão CEAGESP: executa os eventos e disponibiliza
                // a função global selecionarPrecoCeagesp.
                if (caminho.endsWith("/static/js/produtores/botao_ceagesp.js")) {
                    return {
                        code: `${codigo}\nexport {};`,
                        map: null
                    };
                }

                // Formulário de produtos
                if (caminho.endsWith("/static/js/produtores/form_base.js")) {
                    return {
                        code: `${codigo}
export {
    obterDadosFormulario,
    finalizarAcao,
    fecharModal,
    processarImagem,
    atualizarLabelsUnidade
};`,
                        map: null
                    };
                }

                // Importação de planilhas
                if (caminho.endsWith("/static/js/produtores/planilha.js")) {
                    return {
                        code: `${codigo}
export {
    abrirModalPlanilha,
    fecharModalPlanilha,
    resetarModalPlanilha,
    processarArquivoExcel,
    validarDadosDaPlanilha,
    mudarStatusImportacao,
    apresentarResultadosNoModal,
    listaProdutosValidos
};`,
                        map: null
                    };
                }

                // Download do modelo Excel
                if (caminho.endsWith("/static/js/produtores/template_excel.js")) {
                    return {
                        code: `${codigo}\nexport {};`,
                        map: null
                    };
                }

                return null;
            }
        }
    ],

    test: {
        environment: "jsdom",
        include: ["testes/**/*.test.js"],
        clearMocks: true,
        restoreMocks: true,

        coverage: {
            provider: "v8",
            include: ["static/js/**/*.js"],
            exclude: ["static/js/**/*.test.js"],
            reporter: ["text", "html"],
            all: true
        }
    }
});
