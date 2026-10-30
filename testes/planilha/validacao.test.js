import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

vi.mock("../../static/js/produtores/planilha/estado.js", () => ({
    definirProdutosValidos: vi.fn()
}));

vi.mock("../../static/js/produtores/planilha/resultados.js", () => ({
    apresentarResultadosNoModal: vi.fn()
}));

import {
    definirProdutosValidos
} from "../../static/js/produtores/planilha/estado.js";

import {
    apresentarResultadosNoModal
} from "../../static/js/produtores/planilha/resultados.js";

import {
    validarDadosDaPlanilha
} from "../../static/js/produtores/planilha/validacao.js";

describe("Validação dos dados da planilha", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function produtoValido(alteracoes = {}) {
        return {
            nome: "Maçã",
            categoria: "frutas",
            unidade: "kg",
            preco: "5.50",
            quantidade: "10",
            descricao: "Produto fresco",
            _linhaExcelOriginal: 2,
            ...alteracoes
        };
    }

    it("aceita um produto com todos os dados válidos", () => {
        validarDadosDaPlanilha([
            produtoValido()
        ]);

        expect(definirProdutosValidos).toHaveBeenCalledWith([
            expect.objectContaining({
                nome: "Maçã",
                categoria: "frutas",
                unidade: "kg",
                precoOriginal: 5.5,
                quantidadeOriginal: 10,
                descricao: "Produto fresco",
                status: "publicado"
            })
        ]);

        expect(apresentarResultadosNoModal).toHaveBeenCalledWith(
            1,
            []
        );
    });

    it("utiliza nomedoproduto como alternativa para nome", () => {
        validarDadosDaPlanilha([
            produtoValido({
                nome: undefined,
                nomedoproduto: "Banana"
            })
        ]);

        expect(definirProdutosValidos).toHaveBeenCalledWith([
            expect.objectContaining({
                nome: "Banana"
            })
        ]);
    });

    it("registra erro quando o nome está ausente", () => {
        validarDadosDaPlanilha([
            produtoValido({
                nome: "",
                nomedoproduto: undefined
            })
        ]);

        const erros = apresentarResultadosNoModal.mock.calls[0][1];

        expect(erros[0].detalhes).toContain(
            "Nome do produto é obrigatório"
        );
    });

    it("registra erro quando o nome contém apenas espaços", () => {
        validarDadosDaPlanilha([
            produtoValido({ nome: "   " })
        ]);

        const erros = apresentarResultadosNoModal.mock.calls[0][1];

        expect(erros[0].detalhes).toContain(
            "Nome do produto é obrigatório"
        );
    });

    it("utiliza a linha 2 quando a linha original não foi informada", () => {
        validarDadosDaPlanilha([
            produtoValido({
                _linhaExcelOriginal: undefined,
                categoria: "invalida"
            })
        ]);

        const erros = apresentarResultadosNoModal.mock.calls[0][1];

        expect(erros[0].linha).toBe(2);
    });

    it("preserva a linha original do Excel", () => {
        validarDadosDaPlanilha([
            produtoValido({
                _linhaExcelOriginal: 15,
                categoria: "invalida"
            })
        ]);

        const erros = apresentarResultadosNoModal.mock.calls[0][1];

        expect(erros[0].linha).toBe(15);
    });

    describe("Categorias", () => {

        it.each([
            ["frutas", "frutas"],
            ["fruta", "frutas"],
            ["legume", "legumes"],
            ["legumes", "legumes"],
            ["hortalica", "hortalicas"],
            ["hortaliças", "hortalicas"],
            ["grão", "graos"],
            ["cereais", "graos"],
            ["oleaginosa", "oleaginosas"],
            ["semente", "oleaginosas"],
            ["erva", "ervas"],
            ["tempero", "ervas"],
            ["outros", "outros"]
        ])("normaliza a categoria %s", (entrada, esperado) => {
            validarDadosDaPlanilha([
                produtoValido({ categoria: entrada })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].categoria).toBe(esperado);
        });

        it("normaliza acentos e letras maiúsculas", () => {
            validarDadosDaPlanilha([
                produtoValido({ categoria: "FRUTAS" })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].categoria).toBe("frutas");
        });

        it("registra erro para categoria inválida", () => {
            validarDadosDaPlanilha([
                produtoValido({ categoria: "carnes" })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].detalhes[0]).toContain("Categoria inválida");
        });

        it("registra erro para categoria vazia", () => {
            validarDadosDaPlanilha([
                produtoValido({ categoria: "" })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].detalhes).toContain(
                'Categoria inválida ("Vazia")'
            );
        });
    });

    describe("Unidades", () => {

        it.each([
            ["arroba", "arroba"],
            ["quilograma", "kg"],
            ["kg", "kg"],
            ["grama", "g"],
            ["g", "g"],
            ["unidade", "unidade"],
            ["un", "unidade"],
            ["dúzia", "duzia"],
            ["cento", "cento"],
            ["milheiro", "milheiro"],
            ["saca", "saca"],
            ["maço", "maco"],
            ["litro", "litro"],
            ["caixa", "caixa"],
            ["bandeja", "bandeja"],
            ["tonelada", "t"],
            ["t", "t"]
        ])("normaliza a unidade %s", (entrada, esperado) => {
            validarDadosDaPlanilha([
                produtoValido({ unidade: entrada })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].unidade).toBe(esperado);
        });

        it("prioriza a unidade do campo forma de venda", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    unidade: "kg",
                    formadevendaunidadedemedida: "litro"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].unidade).toBe("litro");
        });

        it("utiliza unidadedemedida como alternativa", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    unidade: undefined,
                    unidadedemedida: "caixa"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].unidade).toBe("caixa");
        });

        it("registra erro para unidade inválida", () => {
            validarDadosDaPlanilha([
                produtoValido({ unidade: "pacote" })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].detalhes[0]).toContain(
                "Forma de Venda inválida"
            );
        });

        it("registra erro para unidade vazia", () => {
            validarDadosDaPlanilha([
                produtoValido({ unidade: "" })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].detalhes).toContain(
                'Forma de Venda inválida ("Vazia")'
            );
        });
    });

    describe("Preço", () => {

        it("utiliza precorporunidadeescolhida como prioridade", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    precorporunidadeescolhida: "8.50",
                    preco: "2.00"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].precoOriginal).toBe(8.5);
        });

        it("utiliza precor como alternativa", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    preco: undefined,
                    precor: "7.25"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].precoOriginal).toBe(7.25);
        });

        it("aceita preço válido", () => {
            validarDadosDaPlanilha([
                produtoValido({ preco: "12.50" })
            ]);

            expect(definirProdutosValidos.mock.calls[0][0]).toHaveLength(1);
        });

        it.each([
            ["0"],
            ["-5"],
            ["abc"],
            [""],
            [undefined]
        ])("rejeita preço inválido: %s", (preco) => {
            validarDadosDaPlanilha([
                produtoValido({ preco })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].detalhes).toContain(
                "Preço deve ser maior que zero"
            );
        });
    });

    describe("Quantidade", () => {

        it("utiliza estoquedisponivelnaunidadeescolhida como prioridade", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    estoquedisponivelnaunidadeescolhida: "20",
                    quantidade: "5"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].quantidadeOriginal).toBe(20);
        });

        it("utiliza estoque como alternativa", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    quantidade: undefined,
                    estoque: "30"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].quantidadeOriginal).toBe(30);
        });

        it("aceita quantidade igual a zero", () => {
            validarDadosDaPlanilha([
                produtoValido({ quantidade: "0" })
            ]);

            expect(definirProdutosValidos.mock.calls[0][0]).toHaveLength(1);
        });

        it.each([
            ["-1"],
            ["abc"],
            [""],
            [undefined]
        ])("rejeita quantidade inválida: %s", (quantidade) => {
            validarDadosDaPlanilha([
                produtoValido({ quantidade })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].detalhes).toContain(
                "Estoque inválido ou negativo"
            );
        });
    });

    describe("Descrição e apresentação", () => {

        it("utiliza descricaoopcional como prioridade", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    descricaoopcional: "Descrição principal",
                    descricao: "Descrição alternativa"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].descricao).toBe("Descrição principal");
        });

        it("utiliza descricao como alternativa", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    descricaoopcional: undefined,
                    descricao: "Descrição alternativa"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].descricao).toBe("Descrição alternativa");
        });

        it("utiliza descrição vazia quando não informada", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    descricao: undefined,
                    descricaoopcional: undefined
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].descricao).toBe("");
        });

        it("formata o preço para exibição", () => {
            validarDadosDaPlanilha([
                produtoValido({ preco: "5.5" })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].exibicaoPreco).toBe("R$ 5,50 / kg");
        });

        it("formata a quantidade para exibição", () => {
            validarDadosDaPlanilha([
                produtoValido({ quantidade: "10" })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];

            expect(produtos[0].exibicaoQuantidade).toBe(
                "10 (kg) em estoque"
            );
        });

        it("separa produtos válidos e inválidos", () => {
            validarDadosDaPlanilha([
                produtoValido(),
                produtoValido({
                    nome: "Produto inválido",
                    categoria: "categoria inexistente"
                })
            ]);

            const produtos = definirProdutosValidos.mock.calls[0][0];
            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(produtos).toHaveLength(1);
            expect(erros).toHaveLength(1);
        });

        it("apresenta os resultados ao final da validação", () => {
            validarDadosDaPlanilha([
                produtoValido()
            ]);

            expect(apresentarResultadosNoModal).toHaveBeenCalledWith(
                1,
                []
            );
        });

        it("compartilha a lista de produtos válidos com o estado", () => {
            validarDadosDaPlanilha([
                produtoValido()
            ]);

            expect(definirProdutosValidos).toHaveBeenCalledTimes(1);
            expect(definirProdutosValidos.mock.calls[0][0]).toHaveLength(1);
        });

        it("aceita uma lista vazia", () => {
            validarDadosDaPlanilha([]);

            expect(definirProdutosValidos).toHaveBeenCalledWith([]);
            expect(apresentarResultadosNoModal).toHaveBeenCalledWith(0, []);
        });

        it("registra o nome Sem Nome quando o nome está ausente", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    nome: undefined,
                    nomedoproduto: undefined
                })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].nome).toBe("Sem Nome");
        });

        it("registra todos os erros encontrados no mesmo produto", () => {
            validarDadosDaPlanilha([
                produtoValido({
                    nome: "",
                    categoria: "inválida",
                    unidade: "inválida",
                    preco: "0",
                    quantidade: "-1"
                })
            ]);

            const erros = apresentarResultadosNoModal.mock.calls[0][1];

            expect(erros[0].detalhes).toHaveLength(5);
        });
    });
});