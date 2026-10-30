
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

import {
    criarPaginacao
} from "../../static/js/paginacao.js";

describe("Paginação", () => {

    let container;
    let callback;
    let produtos;

    beforeEach(() => {

        // Cria o container onde os controles serão inseridos.
        document.body.innerHTML = `
            <div id="paginacao"></div>
        `;

        container = document.getElementById("paginacao");

        callback = vi.fn();

        // Cria uma lista com 25 produtos para testar várias páginas.
        produtos = Array.from({ length: 25 }, (_, indice) => ({
            id: indice + 1,
            nome: `Produto ${indice + 1}`
        }));

    });

    it("deve criar a paginação corretamente", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        expect(container.querySelector(".paginacao")).not.toBeNull();

        expect(
            container.querySelector(".paginacao")
                .getAttribute("aria-label")
        ).toBe("Navegação entre páginas");

        paginacao.destruir();

    });

    it("deve lançar erro quando o container não for informado", () => {

        expect(() => {
            criarPaginacao({
                container: null,
                itensPorPagina: 10,
                aoMudarPagina: callback
            });
        }).toThrow("O container da paginação é obrigatório.");

    });

    it("deve lançar erro quando a quantidade de itens for inválida", () => {

        expect(() => {
            criarPaginacao({
                container,
                itensPorPagina: 0,
                aoMudarPagina: callback
            });
        }).toThrow("itensPorPagina deve ser um inteiro positivo.");

        expect(() => {
            criarPaginacao({
                container,
                itensPorPagina: 1.5,
                aoMudarPagina: callback
            });
        }).toThrow("itensPorPagina deve ser um inteiro positivo.");

    });

    it("deve lançar erro quando o callback não for uma função", () => {

        expect(() => {
            criarPaginacao({
                container,
                itensPorPagina: 10,
                aoMudarPagina: null
            });
        }).toThrow("aoMudarPagina deve ser uma função.");

    });

    it("deve iniciar na primeira página", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        expect(paginacao.obterPaginaAtual()).toBe(1);

        paginacao.destruir();

    });

    it("deve calcular corretamente o total de páginas", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        expect(paginacao.obterTotalPaginas()).toBe(3);

        paginacao.destruir();

    });

    it("deve retornar os itens da primeira página", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        const itens = paginacao.obterItensDaPagina();

        expect(itens).toHaveLength(10);
        expect(itens[0].id).toBe(1);
        expect(itens[9].id).toBe(10);

        paginacao.destruir();

    });

    it("deve notificar a página quando a lista for atualizada", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        expect(callback).toHaveBeenCalledWith({
            itens: produtos.slice(0, 10),
            paginaAtual: 1,
            totalPaginas: 3,
            totalItens: 25
        });

        paginacao.destruir();

    });

    it("deve navegar para a próxima página", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        paginacao.irParaPagina(2);

        expect(paginacao.obterPaginaAtual()).toBe(2);
        expect(paginacao.obterItensDaPagina()[0].id).toBe(11);

        paginacao.destruir();

    });

    it("deve navegar ao clicar no botão Próxima", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        const botaoProxima = Array.from(
            container.querySelectorAll("button")
        ).find(botao => botao.textContent === "Próxima");

        botaoProxima.click();

        expect(paginacao.obterPaginaAtual()).toBe(2);

        paginacao.destruir();

    });

    it("deve navegar ao clicar no botão Anterior", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);
        paginacao.irParaPagina(2);

        const botaoAnterior = Array.from(
            container.querySelectorAll("button")
        ).find(botao => botao.textContent === "Anterior");

        botaoAnterior.click();

        expect(paginacao.obterPaginaAtual()).toBe(1);

        paginacao.destruir();

    });

    it("não deve permitir navegar para uma página inexistente", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        paginacao.irParaPagina(0);
        paginacao.irParaPagina(4);

        expect(paginacao.obterPaginaAtual()).toBe(1);

        paginacao.destruir();

    });

    it("não deve navegar para a página atual", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        callback.mockClear();

        paginacao.irParaPagina(1);

        expect(callback).not.toHaveBeenCalled();

        paginacao.destruir();

    });

    it("deve ocultar os controles quando existir apenas uma página", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos.slice(0, 5));

        const nav = container.querySelector(".paginacao");

        expect(nav.hidden).toBe(true);

        paginacao.destruir();

    });

    it("deve exibir os controles quando existirem várias páginas", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        const nav = container.querySelector(".paginacao");

        expect(nav.hidden).toBe(false);

        paginacao.destruir();

    });

    it("deve exibir o resumo dos itens da página", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);

        const resumo = container.querySelector(".paginacao-resumo");

        expect(resumo.textContent).toBe("Exibindo 1–10 de 25 itens");

        paginacao.destruir();

    });

    it("deve exibir corretamente o resumo da última página", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);
        paginacao.irParaPagina(3);

        const resumo = container.querySelector(".paginacao-resumo");

        expect(resumo.textContent).toBe("Exibindo 21–25 de 25 itens");

        paginacao.destruir();

    });

    it("deve aceitar uma lista vazia", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar([]);

        expect(paginacao.obterTotalPaginas()).toBe(0);
        expect(paginacao.obterItensDaPagina()).toEqual([]);

        paginacao.destruir();

    });

    it("deve aceitar valores que não sejam arrays como lista vazia", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(null);

        expect(paginacao.obterTotalPaginas()).toBe(0);
        expect(paginacao.obterItensDaPagina()).toEqual([]);

        paginacao.destruir();

    });

    it("deve reiniciar na primeira página ao atualizar a lista", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);
        paginacao.irParaPagina(3);

        paginacao.atualizar(produtos);

        expect(paginacao.obterPaginaAtual()).toBe(1);

        paginacao.destruir();

    });

    it("deve manter a página atual quando reiniciar for false", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);
        paginacao.irParaPagina(2);

        paginacao.atualizar(produtos, false);

        expect(paginacao.obterPaginaAtual()).toBe(2);

        paginacao.destruir();

    });

    it("deve ajustar a página atual se a nova lista tiver menos páginas", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);
        paginacao.irParaPagina(3);

        paginacao.atualizar(produtos.slice(0, 15), false);

        expect(paginacao.obterPaginaAtual()).toBe(2);

        paginacao.destruir();

    });

    it("deve remover os controles ao destruir a paginação", () => {

        const paginacao = criarPaginacao({
            container,
            itensPorPagina: 10,
            aoMudarPagina: callback
        });

        paginacao.atualizar(produtos);
        paginacao.destruir();

        expect(container.querySelector(".paginacao")).toBeNull();
        expect(paginacao.obterPaginaAtual()).toBe(1);
        expect(paginacao.obterTotalPaginas()).toBe(0);

    });

});
