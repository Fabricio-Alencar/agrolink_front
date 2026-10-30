
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

describe("Edição de produtos", () => {
    let preview;
    let placeholder;
    let btnRemover;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        document.body.innerHTML = `
            <div id="modalProduto"><h2></h2></div>
            <input id="editandoNomeOriginal">
            <input id="nomeProduto">
            <input id="categoriaProduto">
            <input id="unidadeProduto">
            <input id="descricaoProduto">
            <input id="precoProduto">
            <input id="quantidadeProduto">
        `;

        preview = document.createElement("img");
        placeholder = document.createElement("div");
        btnRemover = document.createElement("button");

        globalThis.window.uploadElements = {
            preview,
            placeholder,
            btnRemover
        };

        globalThis.API_URL = "http://localhost:5000";
        globalThis.API = {
            atualizarProduto: vi.fn()
        };

        globalThis.exibirNotificacao = vi.fn();
        globalThis.fecharModal = vi.fn();
        globalThis.atualizarLabelsUnidade = vi.fn();

        await import("../../static/js/produtores/editar_produto.js");
    });

    const produtoBase = {
        id: 12,
        nome: "Maçã",
        categoria: "frutas",
        unidade: "kg",
        descricao: "Produto fresco",
        preco: 5.5,
        quantidade: 20
    };

    it("não prepara edição quando o produto é null", async () => {
        await window.prepararEdicao(null);

        expect(document.getElementById("modalProduto").classList.contains("active"))
            .toBe(false);
    });

    it("preenche os campos do formulário", async () => {
        await window.prepararEdicao(produtoBase);

        expect(document.querySelector("#modalProduto h2").innerText)
            .toBe("Editar Produto");
        expect(document.getElementById("editandoNomeOriginal").value).toBe("12");
        expect(document.getElementById("nomeProduto").value).toBe("Maçã");
        expect(document.getElementById("categoriaProduto").value).toBe("frutas");
        expect(document.getElementById("unidadeProduto").value).toBe("kg");
        expect(document.getElementById("descricaoProduto").value).toBe("Produto fresco");
        expect(document.getElementById("precoProduto").value).toBe("5.5");
        expect(document.getElementById("quantidadeProduto").value).toBe("20");
        expect(document.getElementById("modalProduto").classList.contains("active"))
            .toBe(true);
        expect(atualizarLabelsUnidade).toHaveBeenCalled();
    });

    it("usa descrição vazia quando o produto não possui descrição", async () => {
        await window.prepararEdicao({
            ...produtoBase,
            descricao: null
        });

        expect(document.getElementById("descricaoProduto").value).toBe("");
    });

    it("mantém o caminho de foto quando a URL já é HTTP", async () => {
        await window.prepararEdicao({
            ...produtoBase,
            foto: "https://cdn.exemplo.com/foto.png"
        });

        expect(preview.src).toBe("https://cdn.exemplo.com/foto.png");
        expect(preview.style.display).toBe("block");
        expect(placeholder.style.display).toBe("none");
        expect(btnRemover.style.display).toBe("block");
    });

    it("monta caminho da foto quando começa com /static", async () => {
        await window.prepararEdicao({
            ...produtoBase,
            foto: "/static/uploads/produtos/maca.png"
        });

        expect(preview.src).toBe(
            "http://localhost:5000/static/uploads/produtos/maca.png"
        );
    });

    it("monta caminho da foto para nome de arquivo simples", async () => {
        await window.prepararEdicao({
            ...produtoBase,
            foto: "maca.png"
        });

        expect(preview.src).toBe(
            "http://localhost:5000/static/uploads/produtos/maca.png"
        );
    });

    it("usa imagem genérica quando o produto não possui foto", async () => {
        await window.prepararEdicao({
            ...produtoBase,
            foto: ""
        });

        expect(preview.getAttribute("src"))
            .toBe("../static/uploads/produtos/foto_generica.png");
        expect(preview.style.display).toBe("block");
        expect(placeholder.style.display).toBe("none");
        expect(btnRemover.style.display).toBe("block");
    });

    it("usa imagem genérica quando a foto apresenta erro", async () => {
        await window.prepararEdicao({
            ...produtoBase,
            foto: "maca.png"
        });

        const manipuladorErro = preview.onerror;
        manipuladorErro();

        expect(preview.src).toBe(
            "http://localhost:5000/static/uploads/produtos/foto_generica.png"
        );
        expect(preview.onerror).toBeNull();
    });

    it("não executa edição quando não existe ID", async () => {
        await window.executarEdicao(new FormData());

        expect(API.atualizarProduto).not.toHaveBeenCalled();
    });

    it("não executa edição quando FormData é null", async () => {
        document.getElementById("editandoNomeOriginal").value = "12";

        await window.executarEdicao(null);

        expect(API.atualizarProduto).not.toHaveBeenCalled();
    });

    it("executa edição com sucesso", async () => {
        document.getElementById("editandoNomeOriginal").value = "12";
        const formData = new FormData();

        API.atualizarProduto.mockResolvedValue({
            mensagem: "Atualizado"
        });

        await window.executarEdicao(formData);

        expect(API.atualizarProduto).toHaveBeenCalledWith("12", formData);
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "edicao",
            "Alterações salvas com sucesso!"
        );
        expect(fecharModal).toHaveBeenCalled();
        expect(renderProdutos).toHaveBeenCalled();
    });

    it("exibe erro retornado pela API", async () => {
        document.getElementById("editandoNomeOriginal").value = "12";
        API.atualizarProduto.mockResolvedValue({
            erro: "Produto não encontrado"
        });

        await window.executarEdicao(new FormData());

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Produto não encontrado"
        );
        expect(fecharModal).not.toHaveBeenCalled();
    });

    it("exibe mensagem padrão quando a API retorna null", async () => {
        document.getElementById("editandoNomeOriginal").value = "12";
        API.atualizarProduto.mockResolvedValue(null);

        await window.executarEdicao(new FormData());

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Erro ao atualizar!"
        );
    });

    it("trata exceção durante a edição", async () => {
        document.getElementById("editandoNomeOriginal").value = "12";
        const erro = new Error("Falha de conexão");
        API.atualizarProduto.mockRejectedValue(erro);
        vi.spyOn(console, "error").mockImplementation(() => {});

        await window.executarEdicao(new FormData());

        expect(console.error).toHaveBeenCalledWith("Erro na edição:", erro);
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Erro de conexão com o servidor!"
        );
    });
});
