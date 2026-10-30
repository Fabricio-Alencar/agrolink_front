
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

vi.mock("../../static/js/produtores/renderizar.js", () => ({
    renderProdutos: vi.fn()
}));

import { renderProdutos } from "../../static/js/produtores/renderizar.js";

describe("Criação de produtos", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        document.body.innerHTML = `
            <div id="modalProduto">
                <h2></h2>
            </div>
        `;

        globalThis.API = {
            criarProduto: vi.fn()
        };

        globalThis.fecharModal = vi.fn();
        globalThis.exibirNotificacao = vi.fn();

        await import("../../static/js/produtores/criar_produto.js");
    });

    it("não envia dados quando o FormData é null", async () => {
        await window.executarCriacao(null);

        expect(API.criarProduto).not.toHaveBeenCalled();
        expect(exibirNotificacao).not.toHaveBeenCalled();
    });

    it("cria produto com sucesso", async () => {
        const formData = new FormData();

        API.criarProduto.mockResolvedValue({
            mensagem: "Criado"
        });

        await window.executarCriacao(formData);

        expect(API.criarProduto).toHaveBeenCalledWith(formData);
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "cadastro",
            "Produto cadastrado com sucesso!"
        );
        expect(fecharModal).toHaveBeenCalled();
        expect(renderProdutos).toHaveBeenCalled();
    });

    it("não exibe notificação de sucesso quando a função global não existe", async () => {
        delete globalThis.exibirNotificacao;

        API.criarProduto.mockResolvedValue({});

        await window.executarCriacao(new FormData());

        expect(fecharModal).toHaveBeenCalled();
        expect(renderProdutos).toHaveBeenCalled();
    });

    it("exibe erro retornado pela API", async () => {
        API.criarProduto.mockResolvedValue({
            erro: "Nome já cadastrado"
        });

        await window.executarCriacao(new FormData());

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Nome já cadastrado"
        );
        expect(fecharModal).not.toHaveBeenCalled();
        expect(renderProdutos).not.toHaveBeenCalled();
    });

    it("exibe mensagem padrão quando a API retorna null", async () => {
        API.criarProduto.mockResolvedValue(null);

        await window.executarCriacao(new FormData());

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Erro ao salvar!"
        );
    });

    it("trata erro lançado durante a criação", async () => {
        const erro = new Error("Falha de conexão");
        API.criarProduto.mockRejectedValue(erro);
        vi.spyOn(console, "error").mockImplementation(() => {});

        await window.executarCriacao(new FormData());

        expect(console.error).toHaveBeenCalledWith(
            "🚨 Erro na criação:",
            erro
        );
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Erro de conexão com o servidor!"
        );
    });

    it("abre o modal de criação após limpar o modal anterior", async () => {
        window.abrirModalCriar();

        expect(fecharModal).toHaveBeenCalled();
        expect(document.querySelector("#modalProduto h2").innerText)
            .toBe("Adicionar Produto");
        expect(document.getElementById("modalProduto").classList.contains("active"))
            .toBe(true);
    });
});
