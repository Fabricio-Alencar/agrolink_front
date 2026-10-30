import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Lista de conversas", () => {
    let modulo;
    let lista;
    let abrirConversa;
    let atualizarContadorArquivadas;

    beforeEach(async () => {
        vi.resetModules();

        document.body.innerHTML = `
            <div id="listaConversas"></div>
        `;

        lista = document.getElementById("listaConversas");
        abrirConversa = vi.fn();
        atualizarContadorArquivadas = vi.fn();

        modulo = await import("../../static/js/chat/lista-conversas.js");

        modulo.inicializarListaConversas({
            elementoLista: lista,
            abrirConversa,
            atualizarContadorArquivadas
        });
    });

    it("deve inicializar a lista e os callbacks", () => {
        const item = modulo.criarItemConversa({ negociacao_id: 1 });

        item.querySelector(".conversa-item");
        expect(item).toBeInstanceOf(HTMLButtonElement);
    });

    it("deve criar um item com as informações da conversa", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 10,
            negociador_nome: "João",
            nome: "João",
            produto_nome: "Milho",
            ultima_mensagem: "Olá"
        });

        expect(item.className).toBe("conversa-item");
        expect(item.dataset.negociacaoId).toBe("10");
        expect(item.querySelector(".conversa-nome").textContent).toBe("João");
        expect(item.querySelector(".conversa-produto").textContent).toBe("Milho");
        expect(item.querySelector(".conversa-preview").textContent).toBe("Olá");
    });

    it("deve usar valores padrão quando os dados estiverem ausentes", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 1
        });

        expect(item.querySelector(".conversa-nome").textContent).toBe("Usuário");
        expect(item.querySelector(".conversa-produto").textContent).toBe("Pedido");
        expect(item.querySelector(".conversa-preview").textContent).toBe("Conversa iniciada");
    });

    it("deve criar o contador de mensagens não lidas", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 1,
            mensagens_nao_lidas: 3
        });

        const contador = item.querySelector(".conversa-nao-lidas");

        expect(contador.textContent).toBe("3");
        expect(contador.getAttribute("aria-label")).toBe("3 mensagens não lidas");
    });

    it("deve marcar a conversa como arquivada", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 1,
            arquivada: "true"
        });

        expect(item.dataset.arquivada).toBe("true");
    });

    it("deve localizar uma conversa pelo identificador", () => {
        const item = modulo.criarItemConversa({ negociacao_id: 10 });
        lista.appendChild(item);

        expect(modulo.localizarItemConversa(10)).toBe(item);
        expect(modulo.localizarItemConversa("10")).toBe(item);
    });

    it("deve retornar null para identificador inválido", () => {
        expect(modulo.localizarItemConversa(0)).toBeNull();
        expect(modulo.localizarItemConversa(-1)).toBeNull();
        expect(modulo.localizarItemConversa("abc")).toBeNull();
    });

    it("deve retornar null quando a conversa não existir", () => {
        expect(modulo.localizarItemConversa(99)).toBeNull();
    });

    it("deve atualizar o contador de mensagens não lidas", () => {
        const item = modulo.criarItemConversa({ negociacao_id: 1 });

        modulo.atualizarContadorItem(item, 5);

        expect(item.dataset.naoLidas).toBe("5");
        expect(item.querySelector(".conversa-nao-lidas").textContent).toBe("5");
        expect(atualizarContadorArquivadas).toHaveBeenCalled();
    });

    it("deve remover o contador quando a quantidade for zero", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 1,
            mensagens_nao_lidas: 3
        });

        modulo.atualizarContadorItem(item, 0);

        expect(item.dataset.naoLidas).toBe("0");
        expect(item.querySelector(".conversa-nao-lidas")).toBeNull();
    });

    it("deve limitar valores negativos a zero", () => {
        const item = modulo.criarItemConversa({ negociacao_id: 1 });

        modulo.atualizarContadorItem(item, -5);

        expect(item.dataset.naoLidas).toBe("0");
    });

    it("não deve fazer nada quando o item for nulo", () => {
        expect(() => modulo.atualizarContadorItem(null, 5)).not.toThrow();
    });

    it("deve zerar o contador de uma conversa", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 10,
            mensagens_nao_lidas: 4
        });

        lista.appendChild(item);

        modulo.zerarContadorConversa(10);

        expect(item.dataset.naoLidas).toBe("0");
        expect(item.querySelector(".conversa-nao-lidas")).toBeNull();
    });

    it("deve atualizar a prévia ao receber uma mensagem", () => {
        const item = modulo.criarItemConversa({ negociacao_id: 10 });
        lista.appendChild(item);

        modulo.atualizarConversaRecebida({
            negociacao_id: 10,
            texto: "Nova mensagem"
        });

        expect(item.querySelector(".conversa-preview").textContent).toBe("Nova mensagem");
        expect(item.dataset.naoLidas).toBe("1");
    });

    it("deve incrementar mensagens não lidas ao receber mensagem em conversa inativa", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 10,
            mensagens_nao_lidas: 2
        });

        lista.appendChild(item);

        modulo.atualizarConversaRecebida({
            negociacao_id: 10,
            texto: "Olá"
        });

        expect(item.dataset.naoLidas).toBe("3");
    });

    it("não deve incrementar mensagens não lidas quando a conversa estiver ativa", () => {
        const item = modulo.criarItemConversa({
            negociacao_id: 10,
            mensagens_nao_lidas: 2
        });

        item.classList.add("ativa");
        lista.appendChild(item);

        modulo.atualizarConversaRecebida({
            negociacao_id: 10,
            texto: "Olá"
        });

        expect(item.dataset.naoLidas).toBe("2");
    });

    it("deve atualizar a prévia ao enviar uma mensagem", () => {
        const item = modulo.criarItemConversa({ negociacao_id: 10 });
        lista.appendChild(item);

        modulo.atualizarConversaEnviada({
            negociacao_id: 10,
            texto: "Mensagem enviada"
        });

        expect(item.querySelector(".conversa-preview").textContent).toBe("Mensagem enviada");
        expect(item.dataset.naoLidas).toBe("0");
    });

    it("deve mover a conversa atualizada para o início da lista", () => {
        const primeiro = modulo.criarItemConversa({ negociacao_id: 1 });
        const segundo = modulo.criarItemConversa({ negociacao_id: 2 });

        lista.append(primeiro, segundo);

        modulo.atualizarConversaRecebida({
            negociacao_id: 2,
            texto: "Nova mensagem"
        });

        expect(lista.firstElementChild).toBe(segundo);
    });

    it("deve chamar o callback ao clicar em uma conversa", async () => {
        const item = modulo.criarItemConversa({ negociacao_id: 10 });

        item.click();

        await Promise.resolve();

        expect(abrirConversa).toHaveBeenCalledWith(10);
    });

    it("deve exibir alerta quando ocorrer erro ao abrir uma conversa", async () => {
        abrirConversa.mockRejectedValue(new Error("Falha ao abrir"));

        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const erro = vi.spyOn(console, "error").mockImplementation(() => {});

        const item = modulo.criarItemConversa({ negociacao_id: 10 });

        item.click();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(alerta).toHaveBeenCalledWith("Falha ao abrir");
        expect(erro).toHaveBeenCalled();
    });
});