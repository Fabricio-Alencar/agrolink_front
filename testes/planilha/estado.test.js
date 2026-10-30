import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

import {
    obterProdutosValidos,
    definirProdutosValidos,
    limparProdutosValidos,
    atualizarStatusProduto
} from "../../static/js/produtores/planilha/estado.js";

describe("Estado da importação de planilha", () => {

    beforeEach(() => {
        limparProdutosValidos();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    it("inicia com uma lista vazia", () => {
        expect(obterProdutosValidos()).toEqual([]);
    });

    it("define a lista de produtos válidos", () => {
        const produtos = [
            { identificadorTemporario: 1, nome: "Maçã" },
            { identificadorTemporario: 2, nome: "Banana" }
        ];

        definirProdutosValidos(produtos);

        expect(obterProdutosValidos()).toBe(produtos);
    });

    it("retorna a mesma lista definida", () => {
        const produtos = [{ nome: "Tomate" }];

        definirProdutosValidos(produtos);

        expect(obterProdutosValidos()).toEqual(produtos);
    });

    it("substitui a lista anterior", () => {
        definirProdutosValidos([{ nome: "Maçã" }]);
        definirProdutosValidos([{ nome: "Banana" }]);

        expect(obterProdutosValidos()).toEqual([
            { nome: "Banana" }
        ]);
    });

    it("limpa a lista de produtos", () => {
        definirProdutosValidos([{ nome: "Maçã" }]);

        limparProdutosValidos();

        expect(obterProdutosValidos()).toEqual([]);
    });

    it("atualiza o status para publicado", () => {
        definirProdutosValidos([
            {
                identificadorTemporario: 1,
                nome: "Maçã",
                status: "rascunho"
            }
        ]);

        atualizarStatusProduto(1, "publicado");

        expect(obterProdutosValidos()[0].status).toBe("publicado");
    });

    it("atualiza o status para rascunho", () => {
        definirProdutosValidos([
            {
                identificadorTemporario: 1,
                nome: "Maçã",
                status: "publicado"
            }
        ]);

        atualizarStatusProduto(1, "rascunho");

        expect(obterProdutosValidos()[0].status).toBe("rascunho");
    });

    it("registra no console a alteração do status", () => {
        definirProdutosValidos([
            {
                identificadorTemporario: 1,
                nome: "Maçã",
                status: "rascunho"
            }
        ]);

        atualizarStatusProduto(1, "publicado");

        expect(console.log).toHaveBeenCalledWith(
            'Produto "Maçã" alterado para: publicado'
        );
    });

    it("não altera o status quando o identificador não existe", () => {
        definirProdutosValidos([
            {
                identificadorTemporario: 1,
                nome: "Maçã",
                status: "rascunho"
            }
        ]);

        atualizarStatusProduto(99, "publicado");

        expect(obterProdutosValidos()[0].status).toBe("rascunho");
        expect(console.log).not.toHaveBeenCalled();
    });

    it("não altera o status quando o novo status é inválido", () => {
        definirProdutosValidos([
            {
                identificadorTemporario: 1,
                nome: "Maçã",
                status: "rascunho"
            }
        ]);

        atualizarStatusProduto(1, "cancelado");

        expect(obterProdutosValidos()[0].status).toBe("rascunho");
        expect(console.log).not.toHaveBeenCalled();
    });

    it("não altera o status quando recebe uma string vazia", () => {
        definirProdutosValidos([
            {
                identificadorTemporario: 1,
                nome: "Maçã",
                status: "publicado"
            }
        ]);

        atualizarStatusProduto(1, "");

        expect(obterProdutosValidos()[0].status).toBe("publicado");
    });

    it("altera somente o produto com identificador correspondente", () => {
        definirProdutosValidos([
            {
                identificadorTemporario: 1,
                nome: "Maçã",
                status: "publicado"
            },
            {
                identificadorTemporario: 2,
                nome: "Banana",
                status: "rascunho"
            }
        ]);

        atualizarStatusProduto(2, "publicado");

        expect(obterProdutosValidos()[0].status).toBe("publicado");
        expect(obterProdutosValidos()[1].status).toBe("publicado");
    });
});