import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Informações da negociação", () => {
    let modulo;

    beforeEach(async () => {
        vi.resetModules();

        document.body.innerHTML = `
            <button id="btnInfoChat">Informações</button>

            <div id="modalInfoNegociacao" style="display: none;" aria-hidden="true">
                <button id="btnFecharInfo">Fechar</button>

                <span id="infoDataRecebido"></span>

                <div>
                    <img id="infoProdutoFoto">
                    <span class="info-produto-fallback"></span>
                </div>

                <span id="infoProduto"></span>
                <span id="infoQuantidade"></span>
                <span id="infoPreco"></span>
                <span id="infoUnidade"></span>
                <span id="infoTotal"></span>
                <span id="infoDataEntrega"></span>
                <span id="infoStatus"></span>
                <span id="infoTelefone"></span>
                <span id="infoEmail"></span>
                <span id="infoDescricao"></span>
                <div id="infoDescricaoContainer"></div>
                <span id="infoNegociante"></span>
            </div>
        `;

        modulo = await import("../../static/js/chat/info-negociacao.js");
    });

    it("não deve abrir o modal sem informações da negociação", () => {
        modulo.abrirModalInfo();

        expect(document.getElementById("modalInfoNegociacao").style.display).toBe("none");
    });

    it("deve armazenar os detalhes da negociação", () => {
        const dados = { id: 10, produto_nome: "Milho" };

        modulo.atualizarInfoNegociacao(dados);
        modulo.abrirModalInfo();

        expect(document.getElementById("infoProduto").textContent).toBe("Milho");
    });

    it("deve abrir o modal e atualizar aria-hidden", () => {
        modulo.atualizarInfoNegociacao({ id: 10 });
        modulo.abrirModalInfo();

        const modal = document.getElementById("modalInfoNegociacao");

        expect(modal.style.display).toBe("flex");
        expect(modal.getAttribute("aria-hidden")).toBe("false");
    });

    it("deve direcionar o foco para o botão de fechar", () => {
        modulo.atualizarInfoNegociacao({ id: 10 });
        modulo.abrirModalInfo();

        expect(document.activeElement).toBe(document.getElementById("btnFecharInfo"));
    });

    it("deve fechar o modal", () => {
        modulo.atualizarInfoNegociacao({ id: 10 });
        modulo.abrirModalInfo();
        modulo.fecharModalInfo();

        const modal = document.getElementById("modalInfoNegociacao");

        expect(modal.style.display).toBe("none");
        expect(modal.getAttribute("aria-hidden")).toBe("true");
    });

    it("deve preencher o nome do produto", () => {
        modulo.atualizarInfoNegociacao({ produto_nome: "Soja" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoProduto").textContent).toBe("Soja");
    });

    it("deve preencher o nome do negociante", () => {
        modulo.atualizarInfoNegociacao({ negociante_nome: "Carlos" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoNegociante").textContent).toBe("Carlos");
    });

    it("deve formatar a quantidade", () => {
        modulo.atualizarInfoNegociacao({ quantidade: 1500 });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoQuantidade").textContent).toBe("1.500");
    });

    it("deve exibir traço para quantidade inválida", () => {
        modulo.atualizarInfoNegociacao({ quantidade: "" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoQuantidade").textContent).toBe("-");
    });

    it("deve formatar o preço em reais", () => {
        modulo.atualizarInfoNegociacao({ produto_preco: 12.5 });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoPreco").textContent).toContain("12,50");
    });

    it("deve calcular o valor total", () => {
        modulo.atualizarInfoNegociacao({
            quantidade: 10,
            produto_preco: 5
        });

        modulo.abrirModalInfo();

        expect(document.getElementById("infoTotal").textContent).toContain("50,00");
    });

    it("deve exibir a unidade do produto", () => {
        modulo.atualizarInfoNegociacao({ produto_unidade: "kg" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoUnidade").textContent).toBe(" / kg");
    });

    it("deve formatar telefone celular", () => {
        modulo.atualizarInfoNegociacao({ negociante_telefone: "11987654321" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoTelefone").textContent).toBe("(11) 98765-4321");
    });

    it("deve formatar telefone fixo", () => {
        modulo.atualizarInfoNegociacao({ negociante_telefone: "1133334444" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoTelefone").textContent).toBe("(11) 3333-4444");
    });

    it("deve preservar telefone fora dos formatos brasileiros", () => {
        modulo.atualizarInfoNegociacao({ negociante_telefone: "12345" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoTelefone").textContent).toBe("12345");
    });

    it("deve preencher o e-mail", () => {
        modulo.atualizarInfoNegociacao({ negociante_email: "teste@email.com" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoEmail").textContent).toBe("teste@email.com");
    });

    it("deve formatar o status pendente", () => {
        modulo.atualizarInfoNegociacao({ status: "pendente" });
        modulo.abrirModalInfo();

        const status = document.getElementById("infoStatus");

        expect(status.textContent).toBe("Pendente");
        expect(status.classList.contains("status-pendente")).toBe(true);
    });

    it("deve formatar o status em entrega", () => {
        modulo.atualizarInfoNegociacao({ status: "em_entrega" });
        modulo.abrirModalInfo();

        const status = document.getElementById("infoStatus");

        expect(status.textContent).toBe("Em entrega");
        expect(status.classList.contains("status-entrega")).toBe(true);
    });

    it("deve exibir a descrição quando preenchida", () => {
        modulo.atualizarInfoNegociacao({ descricao: "Produto de boa qualidade" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoDescricao").textContent).toBe("Produto de boa qualidade");
        expect(document.getElementById("infoDescricaoContainer").hidden).toBe(false);
    });

    it("deve ocultar a descrição quando estiver vazia", () => {
        modulo.atualizarInfoNegociacao({ descricao: "" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoDescricaoContainer").hidden).toBe(true);
    });

    it("deve fechar ao clicar no botão fechar", () => {
        modulo.atualizarInfoNegociacao({ id: 1 });
        modulo.abrirModalInfo();

        document.getElementById("btnFecharInfo").click();

        expect(document.getElementById("modalInfoNegociacao").style.display).toBe("none");
    });

    it("deve fechar ao pressionar Escape", () => {
        modulo.atualizarInfoNegociacao({ id: 1 });
        modulo.abrirModalInfo();

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

        expect(document.getElementById("modalInfoNegociacao").style.display).toBe("none");
    });

    it("deve fechar ao clicar fora do conteúdo do modal", () => {
        modulo.atualizarInfoNegociacao({ id: 1 });
        modulo.abrirModalInfo();

        const modal = document.getElementById("modalInfoNegociacao");
        modal.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(modal.style.display).toBe("none");
    });

    it("não deve fechar ao clicar dentro do conteúdo do modal", () => {
        modulo.atualizarInfoNegociacao({ id: 1 });
        modulo.abrirModalInfo();

        const modal = document.getElementById("modalInfoNegociacao");
        document.getElementById("infoProduto").dispatchEvent(
            new MouseEvent("click", { bubbles: true })
        );

        expect(modal.style.display).toBe("flex");
    });

    it("deve exibir fallback quando não houver imagem", () => {
        modulo.atualizarInfoNegociacao({ produto_foto: "" });
        modulo.abrirModalInfo();

        expect(document.getElementById("infoProdutoFoto").hidden).toBe(true);
        expect(document.querySelector(".info-produto-fallback").hidden).toBe(false);
    });
});