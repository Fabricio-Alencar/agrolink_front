
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

describe("Exclusão de produtos", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        document.body.innerHTML = `
            <div id="modalExcluir"></div>
            <div id="mensagemExcluir"></div>
            <button id="btnConfirmarExclusao"></button>
        `;

        globalThis.API = {
            excluirProduto: vi.fn()
        };

        globalThis.exibirNotificacao = vi.fn();
        globalThis.fecharModalExcluir = undefined;

        await import("../../static/js/produtores/excluir_produto.js");
    });

    it("prepara a exclusão e apresenta o nome do produto", () => {
        window.prepararExclusao(10, "Maçã");

        expect(document.getElementById("mensagemExcluir").innerHTML)
            .toBe("Excluir o produto <strong>Maçã</strong>?");
        expect(document.getElementById("modalExcluir").classList.contains("active"))
            .toBe(true);
    });

    it("fecha o modal pela função global", () => {
        window.prepararExclusao(10, "Maçã");
        window.fecharModalExcluir();

        expect(document.getElementById("modalExcluir").classList.contains("active"))
            .toBe(false);
    });

    it("exclui produto com sucesso", async () => {
        window.prepararExclusao(10, "Maçã");
        API.excluirProduto.mockResolvedValue({ mensagem: "Excluído" });

        const evento = {
            preventDefault: vi.fn()
        };

        await document
            .getElementById("btnConfirmarExclusao")
            .onclick(evento);

        expect(evento.preventDefault).toHaveBeenCalled();
        expect(API.excluirProduto).toHaveBeenCalledWith(10);
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "exclusao",
            "Produto removido com sucesso!"
        );
        expect(renderProdutos).toHaveBeenCalled();
        expect(document.getElementById("modalExcluir").classList.contains("active"))
            .toBe(false);
    });

    it("não chama preventDefault quando o evento não é informado", async () => {
        window.prepararExclusao(10, "Maçã");
        API.excluirProduto.mockResolvedValue({});

        await document
            .getElementById("btnConfirmarExclusao")
            .onclick();

        expect(API.excluirProduto).toHaveBeenCalledWith(10);
    });

    it("exibe erro quando a API retorna null", async () => {
        window.prepararExclusao(20, "Banana");
        API.excluirProduto.mockResolvedValue(null);

        await document
            .getElementById("btnConfirmarExclusao")
            .onclick();

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "exclusao",
            "Erro ao excluir no servidor."
        );
        expect(renderProdutos).not.toHaveBeenCalled();
        expect(document.getElementById("modalExcluir").classList.contains("active"))
            .toBe(false);
    });

    it("trata exceção durante a exclusão", async () => {
        window.prepararExclusao(30, "Tomate");
        const erro = new Error("Falha de rede");

        API.excluirProduto.mockRejectedValue(erro);
        vi.spyOn(console, "error").mockImplementation(() => {});

        await document
            .getElementById("btnConfirmarExclusao")
            .onclick();

        expect(console.error).toHaveBeenCalledWith("Erro:", erro);
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Falha na conexão."
        );
        expect(document.getElementById("modalExcluir").classList.contains("active"))
            .toBe(false);
    });

    it("limpa o estado após a exclusão para não repetir a operação", async () => {
        window.prepararExclusao(40, "Alface");
        API.excluirProduto.mockResolvedValue({});

        const botao = document.getElementById("btnConfirmarExclusao");

        await botao.onclick();
        API.excluirProduto.mockClear();

        await botao.onclick();

        expect(API.excluirProduto).not.toHaveBeenCalled();
    });
});
