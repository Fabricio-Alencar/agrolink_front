import {
    describe,
    it,
    expect,
    beforeEach
} from "vitest";

import {
    abrirModalPlanilha,
    fecharModalPlanilha,
    resetarModalPlanilha
} from "../../static/js/produtores/planilha/modal.js";

import {
    definirProdutosValidos,
    obterProdutosValidos
} from "../../static/js/produtores/planilha/estado.js";

describe("Modal de importação de planilha", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="modalPlanilha">
                <div id="estadoUpload"></div>
                <div id="estadoResultado"></div>
                <input id="inputPlanilha" type="file">
            </div>
        `;

        definirProdutosValidos([
            { nome: "Maçã" }
        ]);
    });

    describe("abrirModalPlanilha", () => {

        it("adiciona a classe active ao modal", () => {
            abrirModalPlanilha();

            expect(
                document.getElementById("modalPlanilha")
                    .classList.contains("active")
            ).toBe(true);
        });

        it("reseta os estados ao abrir o modal", () => {
            document.getElementById("estadoResultado")
                .classList.add("active");

            abrirModalPlanilha();

            expect(
                document.getElementById("estadoUpload")
                    .classList.contains("active")
            ).toBe(true);

            expect(
                document.getElementById("estadoResultado")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("limpa os produtos válidos ao abrir o modal", () => {
            abrirModalPlanilha();

            expect(obterProdutosValidos()).toEqual([]);
        });

        it("não gera erro quando o modal não existe", () => {
            document.body.innerHTML = "";

            expect(() => abrirModalPlanilha()).not.toThrow();
        });
    });

    describe("fecharModalPlanilha", () => {

        it("remove a classe active do modal", () => {
            const modal = document.getElementById("modalPlanilha");
            modal.classList.add("active");

            fecharModalPlanilha();

            expect(modal.classList.contains("active")).toBe(false);
        });

        it("não gera erro quando o modal não existe", () => {
            document.body.innerHTML = "";

            expect(() => fecharModalPlanilha()).not.toThrow();
        });
    });

    describe("resetarModalPlanilha", () => {

        it("ativa o estado de upload", () => {
            resetarModalPlanilha();

            expect(
                document.getElementById("estadoUpload")
                    .classList.contains("active")
            ).toBe(true);
        });

        it("desativa o estado de resultado", () => {
            document.getElementById("estadoResultado")
                .classList.add("active");

            resetarModalPlanilha();

            expect(
                document.getElementById("estadoResultado")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("limpa o campo de arquivo", () => {
            const input = document.getElementById("inputPlanilha");

            const arquivo = new File(["conteúdo"], "produtos.xlsx");

            Object.defineProperty(input, "files", {
                configurable: true,
                value: [arquivo]
            });

            resetarModalPlanilha();

            expect(input.value).toBe("");
        });

        it("limpa a lista de produtos válidos", () => {
            resetarModalPlanilha();

            expect(obterProdutosValidos()).toEqual([]);
        });

        it("não gera erro quando os elementos não existem", () => {
            document.body.innerHTML = "";

            expect(() => resetarModalPlanilha()).not.toThrow();
        });
    });
});