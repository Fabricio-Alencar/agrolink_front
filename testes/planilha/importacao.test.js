
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const mocks = vi.hoisted(() => ({
    obterProdutosValidos: vi.fn(),
    definirProdutosValidos: vi.fn(),
    apresentarResultadosNoModal: vi.fn(),
    fecharModalPlanilha: vi.fn(),
    renderProdutos: vi.fn()
}));

vi.mock("../../static/js/produtores/planilha/estado.js", () => ({
    obterProdutosValidos: mocks.obterProdutosValidos,
    definirProdutosValidos: mocks.definirProdutosValidos
}));

vi.mock("../../static/js/produtores/planilha/resultados.js", () => ({
    apresentarResultadosNoModal: mocks.apresentarResultadosNoModal
}));

vi.mock("../../static/js/produtores/planilha/modal.js", () => ({
    fecharModalPlanilha: mocks.fecharModalPlanilha
}));

vi.mock("../../static/js/produtores/renderizar.js", () => ({
    renderProdutos: mocks.renderProdutos
}));

import {
    importarProdutos
} from "../../static/js/produtores/planilha/importacao.js";

describe("Importação de produtos da planilha", () => {

    let apiCriarProduto;
    let notificacao;
    let erroConsole;

    function produto(nome, alteracoes = {}) {
        return {
            nome,
            categoria: "frutas",
            precoOriginal: 5,
            unidade: "kg",
            quantidadeOriginal: 10,
            descricao: "Produto de teste",
            status: "publicado",
            ...alteracoes
        };
    }

    beforeEach(() => {
        vi.clearAllMocks();

        document.body.innerHTML = `
            <button id="btnConfirmarPlanilha">
                Importar produtos
            </button>
        `;

        mocks.obterProdutosValidos.mockReturnValue([]);
        mocks.renderProdutos.mockResolvedValue();

        apiCriarProduto = vi.fn().mockResolvedValue({
            sucesso: true
        });

        notificacao = vi.fn();

        erroConsole = vi.spyOn(console, "error")
            .mockImplementation(() => {});

        globalThis.API = {
            criarProduto: apiCriarProduto
        };

        globalThis.exibirNotificacao = notificacao;
    });

    afterEach(() => {
        delete globalThis.API;
        delete globalThis.exibirNotificacao;

        erroConsole.mockRestore();
    });

    it("não faz nada quando não existem produtos válidos", async () => {
        mocks.obterProdutosValidos.mockReturnValue([]);

        await importarProdutos();

        expect(apiCriarProduto).not.toHaveBeenCalled();
        expect(mocks.renderProdutos).not.toHaveBeenCalled();
        expect(mocks.fecharModalPlanilha).not.toHaveBeenCalled();
    });

    it("cria o overlay de progresso", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(
            document.getElementById("overlayProgressoModal")
        ).not.toBeNull();
    });

    it("configura o conteúdo do overlay", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(
            document.querySelector(".progresso-card")
        ).not.toBeNull();

        expect(
            document.querySelector('[role="progressbar"]')
        ).not.toBeNull();

        expect(
            document.getElementById("textoProgressoModal")
        ).not.toBeNull();
    });

    it("desabilita o botão durante a importação", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(
            document.getElementById("btnConfirmarPlanilha").disabled
        ).toBe(false);
    });

    it("envia os dados do produto para a API", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(apiCriarProduto).toHaveBeenCalledTimes(1);

        const formData = apiCriarProduto.mock.calls[0][0];

        expect(formData).toBeInstanceOf(FormData);
        expect(formData.get("nome")).toBe("Maçã");
        expect(formData.get("categoria")).toBe("frutas");
        expect(formData.get("preco")).toBe("5");
        expect(formData.get("unidade")).toBe("kg");
        expect(formData.get("quantidade")).toBe("10");
        expect(formData.get("descricao")).toBe("Produto de teste");
        expect(formData.get("status_produto")).toBe("publicado");
    });

    it("preserva o status rascunho no envio", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã", {
                status: "rascunho"
            })
        ]);

        await importarProdutos();

        const formData = apiCriarProduto.mock.calls[0][0];

        expect(formData.get("status_produto")).toBe("rascunho");
    });

    it("envia todos os produtos da lista", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã"),
            produto("Banana"),
            produto("Laranja")
        ]);

        await importarProdutos();

        expect(apiCriarProduto).toHaveBeenCalledTimes(3);
    });

    it("atualiza o progresso durante o envio", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(
            document.getElementById("textoPorcentagem").textContent
        ).toBe("100% concluído");

        expect(
            document.getElementById("barraProgressoInterna").style.width
        ).toBe("100%");

        expect(
            document.getElementById("progressoAcessivel")
                .getAttribute("aria-valuenow")
        ).toBe("100");
    });

    it("apresenta o nome do produto no texto de progresso", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(
            document.getElementById("textoProgressoModal").textContent
        ).toContain("Maçã");
    });

    it("oculta o overlay ao terminar a importação", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(
            document.getElementById("overlayProgressoModal").style.display
        ).toBe("none");
    });

    it("reativa o botão após a importação", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        const btn = document.getElementById("btnConfirmarPlanilha");
        btn.disabled = true;

        await importarProdutos();

        expect(btn.disabled).toBe(false);
    });

    it("atualiza o marketplace quando existe sucesso", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(mocks.renderProdutos).toHaveBeenCalledTimes(1);
    });

    it("exibe notificação de sucesso para um produto", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(notificacao).toHaveBeenCalledWith(
            "cadastro",
            "1 produto adicionado!"
        );
    });

    it("utiliza plural quando mais de um produto é importado", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã"),
            produto("Banana")
        ]);

        await importarProdutos();

        expect(notificacao).toHaveBeenCalledWith(
            "cadastro",
            "2 produtos adicionados!"
        );
    });

    it("fecha o modal quando todos os produtos são importados", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(mocks.fecharModalPlanilha).toHaveBeenCalledTimes(1);
    });

    it("registra falha quando a API retorna erro", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        apiCriarProduto.mockResolvedValue({
            erro: "Preço inválido"
        });

        await importarProdutos();

        expect(mocks.definirProdutosValidos).toHaveBeenCalledWith([
            expect.objectContaining({
                nome: "Maçã"
            })
        ]);

        expect(mocks.apresentarResultadosNoModal).toHaveBeenCalledWith(
            1,
            [
                expect.objectContaining({
                    linha: "API",
                    nome: "Maçã",
                    detalhes: ["Preço inválido"]
                })
            ]
        );
    });

    it("utiliza o valor de erro retornado pela API quando não existe mensagem textual", async () => {
    mocks.obterProdutosValidos.mockReturnValue([
        produto("Maçã")
    ]);

    apiCriarProduto.mockResolvedValue({
        erro: true
    });

    await importarProdutos();

    expect(mocks.apresentarResultadosNoModal).toHaveBeenCalledWith(
        1,
        [
            expect.objectContaining({
                linha: "API",
                nome: "Maçã",
                detalhes: [true]
            })
        ]
    );
});

    it("registra falha quando a API retorna null", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        apiCriarProduto.mockResolvedValue(null);

        await importarProdutos();

        expect(mocks.apresentarResultadosNoModal).toHaveBeenCalledWith(
            1,
            [
                expect.objectContaining({
                    linha: "API",
                    nome: "Maçã"
                })
            ]
        );
    });

    it("trata exceção durante a comunicação com a API", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        apiCriarProduto.mockRejectedValue(
            new Error("Falha de rede")
        );

        await importarProdutos();

        expect(erroConsole).toHaveBeenCalled();

        expect(mocks.apresentarResultadosNoModal).toHaveBeenCalledWith(
            1,
            [
                expect.objectContaining({
                    linha: "Rede",
                    nome: "Maçã",
                    detalhes: [
                        "Falha crítica de comunicação com o servidor."
                    ]
                })
            ]
        );
    });

    it("mantém somente os produtos que falharam", async () => {
        const produtos = [
            produto("Maçã"),
            produto("Banana"),
            produto("Laranja")
        ];

        mocks.obterProdutosValidos.mockReturnValue(produtos);

        apiCriarProduto
            .mockResolvedValueOnce({ sucesso: true })
            .mockResolvedValueOnce({ erro: "Erro na API" })
            .mockResolvedValueOnce({ sucesso: true });

        await importarProdutos();

        expect(mocks.definirProdutosValidos).toHaveBeenCalledWith([
            produtos[1]
        ]);
    });

    it("apresenta os resultados quando existem falhas", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        apiCriarProduto.mockResolvedValue({
            erro: "Falha"
        });

        await importarProdutos();

        expect(mocks.apresentarResultadosNoModal).toHaveBeenCalled();
    });

    it("exibe notificação de erro quando existem falhas", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        apiCriarProduto.mockResolvedValue({
            erro: "Falha"
        });

        await importarProdutos();

        expect(notificacao).toHaveBeenCalledWith(
            "erro",
            "1 produto(s) falharam no processamento externo."
        );
    });

    it("não fecha o modal quando existem produtos com falha", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        apiCriarProduto.mockResolvedValue({
            erro: "Falha"
        });

        await importarProdutos();

        expect(mocks.fecharModalPlanilha).not.toHaveBeenCalled();
    });

    it("atualiza o marketplace mesmo quando parte dos produtos falha", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã"),
            produto("Banana")
        ]);

        apiCriarProduto
            .mockResolvedValueOnce({ sucesso: true })
            .mockResolvedValueOnce({ erro: "Falha" });

        await importarProdutos();

        expect(mocks.renderProdutos).toHaveBeenCalledTimes(1);
    });

    it("não atualiza o marketplace quando todos falham", async () => {
        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        apiCriarProduto.mockResolvedValue({
            erro: "Falha"
        });

        await importarProdutos();

        expect(mocks.renderProdutos).not.toHaveBeenCalled();
    });

    it("reutiliza o overlay existente sem criar outro", async () => {
        document.body.innerHTML += `
            <div id="overlayProgressoModal">
                <div id="barraProgressoInterna"></div>
                <p id="textoPorcentagem"></p>
                <p id="textoProgressoModal"></p>
                <div id="progressoAcessivel"></div>
            </div>
        `;

        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await importarProdutos();

        expect(
            document.querySelectorAll("#overlayProgressoModal")
        ).toHaveLength(1);
    });

    it("funciona sem o botão de confirmação", async () => {
        document.body.innerHTML = "";

        mocks.obterProdutosValidos.mockReturnValue([
            produto("Maçã")
        ]);

        await expect(importarProdutos()).resolves.not.toThrow();

        expect(apiCriarProduto).toHaveBeenCalledTimes(1);
    });
});
