import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

vi.mock("../../static/js/produtores/planilha/estado.js", () => ({
    obterProdutosValidos: vi.fn(),
    atualizarStatusProduto: vi.fn()
}));

import {
    obterProdutosValidos,
    atualizarStatusProduto
} from "../../static/js/produtores/planilha/estado.js";

import {
    mudarStatusImportacao,
    inicializarEventosResultados,
    apresentarResultadosNoModal
} from "../../static/js/produtores/planilha/resultados.js";

describe("Resultados da importação de planilha", () => {

    beforeEach(() => {
        vi.clearAllMocks();

        document.body.innerHTML = `
            <div id="estadoUpload"></div>
            <div id="estadoResultado"></div>

            <span id="qtdValidos"></span>
            <span id="qtdErros"></span>

            <div id="listaErros"></div>
            <div id="listaValidos"></div>

            <div id="secaoErros"></div>
            <div id="secaoValidos"></div>

            <button id="btnConfirmarPlanilha"></button>
        `;

        obterProdutosValidos.mockReturnValue([]);
    });

    describe("mudarStatusImportacao", () => {

        it("encaminha a alteração de status para o estado", () => {
            mudarStatusImportacao(1, "rascunho");

            expect(atualizarStatusProduto).toHaveBeenCalledWith(
                1,
                "rascunho"
            );
        });
    });

    describe("inicializarEventosResultados", () => {

        it("não gera erro quando a lista de válidos não existe", () => {
            document.body.innerHTML = "";

            expect(() => inicializarEventosResultados()).not.toThrow();
        });

        it("registra o evento change na lista de válidos", () => {
            const lista = document.getElementById("listaValidos");

            const spy = vi.spyOn(lista, "addEventListener");

            inicializarEventosResultados();

            expect(spy).toHaveBeenCalledWith(
                "change",
                expect.any(Function)
            );
        });

        it("marca os eventos como inicializados", () => {
            inicializarEventosResultados();

            expect(
                document.getElementById("listaValidos")
                    .dataset.eventosInicializados
            ).toBe("true");
        });

        it("não registra eventos duplicados", () => {
            const lista = document.getElementById("listaValidos");

            const spy = vi.spyOn(lista, "addEventListener");

            inicializarEventosResultados();
            inicializarEventosResultados();

            expect(spy).toHaveBeenCalledTimes(1);
        });

        it("atualiza o status quando um seletor válido muda", () => {
            obterProdutosValidos.mockReturnValue([
                {
                    identificadorTemporario: 5,
                    nome: "Maçã",
                    status: "publicado"
                }
            ]);

            apresentarResultadosNoModal(1, []);

            inicializarEventosResultados();

            const seletor = document.querySelector(
                ".select-status-importacao"
            );

            seletor.value = "rascunho";

            seletor.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(atualizarStatusProduto).toHaveBeenCalledWith(
                5,
                "rascunho"
            );
        });

        it("ignora mudanças que não partem de um seletor de status", () => {
            inicializarEventosResultados();

            const lista = document.getElementById("listaValidos");

            const elemento = document.createElement("input");
            lista.appendChild(elemento);

            elemento.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(atualizarStatusProduto).not.toHaveBeenCalled();
        });

        it("ignora seletores fora da lista de válidos", () => {
            inicializarEventosResultados();

            const seletor = document.createElement("select");
            seletor.className = "select-status-importacao";
            seletor.dataset.identificador = "10";
            seletor.value = "rascunho";

            document.body.appendChild(seletor);

            seletor.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(atualizarStatusProduto).not.toHaveBeenCalled();
        });
    });

    describe("apresentarResultadosNoModal", () => {

        it("ativa o estado de resultados", () => {
            apresentarResultadosNoModal(1, []);

            expect(
                document.getElementById("estadoResultado")
                    .classList.contains("active")
            ).toBe(true);
        });

        it("desativa o estado de upload", () => {
            document.getElementById("estadoUpload")
                .classList.add("active");

            apresentarResultadosNoModal(1, []);

            expect(
                document.getElementById("estadoUpload")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("apresenta a quantidade de produtos válidos", () => {
            apresentarResultadosNoModal(3, []);

            expect(
                document.getElementById("qtdValidos").textContent
            ).toBe("3");
        });

        it("apresenta a quantidade de erros", () => {
            apresentarResultadosNoModal(1, [
                {
                    nome: "Maçã",
                    linha: 2,
                    detalhes: ["Preço inválido"]
                },
                {
                    nome: "Banana",
                    linha: 3,
                    detalhes: ["Categoria inválida"]
                }
            ]);

            expect(
                document.getElementById("qtdErros").textContent
            ).toBe("2");
        });

        it("exibe a seção de erros quando existem erros", () => {
            apresentarResultadosNoModal(0, [
                {
                    nome: "Maçã",
                    linha: 2,
                    detalhes: ["Preço inválido"]
                }
            ]);

            expect(
                document.getElementById("secaoErros").style.display
            ).toBe("block");
        });

        it("oculta a seção de erros quando não existem erros", () => {
            apresentarResultadosNoModal(1, []);

            expect(
                document.getElementById("secaoErros").style.display
            ).toBe("none");
        });

        it("exibe a seção de produtos válidos quando existem produtos", () => {
            apresentarResultadosNoModal(1, []);

            expect(
                document.getElementById("secaoValidos").style.display
            ).toBe("block");
        });

        it("oculta a seção de produtos válidos quando não existem produtos", () => {
            apresentarResultadosNoModal(0, []);

            expect(
                document.getElementById("secaoValidos").style.display
            ).toBe("none");
        });

        it("apresenta os cards de erro", () => {
            apresentarResultadosNoModal(0, [
                {
                    nome: "Maçã",
                    linha: 5,
                    detalhes: ["Preço inválido"]
                }
            ]);

            expect(
                document.querySelector(".card-erro-planilha")
            ).not.toBeNull();

            expect(
                document.getElementById("listaErros").textContent
            ).toContain("Maçã");
        });

        it("escapa HTML no nome do produto com erro", () => {
            apresentarResultadosNoModal(0, [
                {
                    nome: "<script>alert(1)</script>",
                    linha: 2,
                    detalhes: ["Erro"]
                }
            ]);

            expect(
                document.getElementById("listaErros").innerHTML
            ).not.toContain("<script>");
        });

        it("escapa HTML nos detalhes do erro", () => {
            apresentarResultadosNoModal(0, [
                {
                    nome: "Maçã",
                    linha: 2,
                    detalhes: ["<img src=x onerror=alert(1)>"]
                }
            ]);

            expect(
                document.getElementById("listaErros").innerHTML
            ).not.toContain("<img src=x");
        });

        it("apresenta os produtos válidos", () => {
            obterProdutosValidos.mockReturnValue([
                {
                    identificadorTemporario: 1,
                    nome: "Maçã",
                    status: "publicado",
                    exibicaoQuantidade: "10 (kg) em estoque",
                    exibicaoPreco: "R$ 5,00 / kg"
                }
            ]);

            apresentarResultadosNoModal(1, []);

            expect(
                document.querySelector(".card-valido-planilha")
            ).not.toBeNull();

            expect(
                document.getElementById("listaValidos").textContent
            ).toContain("Maçã");
        });

        it("marca publicado como selecionado", () => {
            obterProdutosValidos.mockReturnValue([
                {
                    identificadorTemporario: 1,
                    nome: "Maçã",
                    status: "publicado",
                    exibicaoQuantidade: "10 kg",
                    exibicaoPreco: "R$ 5,00"
                }
            ]);

            apresentarResultadosNoModal(1, []);

            expect(
                document.querySelector(
                    '.select-status-importacao option[value="publicado"]'
                ).selected
            ).toBe(true);
        });

        it("marca rascunho como selecionado", () => {
            obterProdutosValidos.mockReturnValue([
                {
                    identificadorTemporario: 1,
                    nome: "Maçã",
                    status: "rascunho",
                    exibicaoQuantidade: "10 kg",
                    exibicaoPreco: "R$ 5,00"
                }
            ]);

            apresentarResultadosNoModal(1, []);

            expect(
                document.querySelector(
                    '.select-status-importacao option[value="rascunho"]'
                ).selected
            ).toBe(true);
        });

        it("desabilita o botão quando não existem produtos válidos", () => {
            apresentarResultadosNoModal(0, []);

            expect(
                document.getElementById("btnConfirmarPlanilha").disabled
            ).toBe(true);
        });

        it("habilita o botão quando existem produtos válidos", () => {
            apresentarResultadosNoModal(2, []);

            expect(
                document.getElementById("btnConfirmarPlanilha").disabled
            ).toBe(false);
        });

        it("atualiza o texto do botão de importação", () => {
            apresentarResultadosNoModal(3, []);

            expect(
                document.getElementById("btnConfirmarPlanilha").textContent
            ).toBe("Importar 3 Produtos");
        });

        it("funciona quando os elementos opcionais não existem", () => {
            document.body.innerHTML = "";

            obterProdutosValidos.mockReturnValue([]);

            expect(() => apresentarResultadosNoModal(0, [])).not.toThrow();
        });

        it("escapa caracteres especiais HTML", () => {
    apresentarResultadosNoModal(0, [
        {
            nome: `A&B <produto> "teste" 'x'`,
            linha: 2,
            detalhes: ["Erro & <inconsistência>"]
        }
    ]);

    const html = document.getElementById("listaErros").innerHTML;

    // Verifica o escape dos caracteres especiais.
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;");
    expect(html).toContain("&gt;");

    // Aspas podem permanecer sem escape em conteúdo textual.
    expect(html).toContain('"teste"');
    expect(html).toContain("'x'");
});
    });
});