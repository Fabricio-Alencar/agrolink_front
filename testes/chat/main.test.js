import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    carregarConversas: vi.fn(),
    abrirConversa: vi.fn(),
    mostrarEstadoSemSelecao: vi.fn(),
    iniciarConversa: vi.fn(),
    conectarWebSocketGeral: vi.fn(),
    atualizarConversaRecebida: vi.fn(),
    zerarContadorConversa: vi.fn(),
    atualizarMensagensLidas: vi.fn()
}));

vi.mock("../../static/js/chat/conversas.js", () => ({
    carregarConversas: mocks.carregarConversas,
    abrirConversa: mocks.abrirConversa,
    mostrarEstadoSemSelecao: mocks.mostrarEstadoSemSelecao
}));

vi.mock("../../static/js/chat/api.js", () => ({
    API: {
        iniciarConversa: mocks.iniciarConversa
    }
}));

vi.mock("../../static/js/chat/websocket.js", () => ({
    conectarWebSocketGeral: mocks.conectarWebSocketGeral
}));

vi.mock("../../static/js/chat/lista-conversas.js", () => ({
    atualizarConversaRecebida: mocks.atualizarConversaRecebida,
    zerarContadorConversa: mocks.zerarContadorConversa
}));

vi.mock("../../static/js/chat/mensagens.js", () => ({
    atualizarMensagensLidas: mocks.atualizarMensagensLidas
}));

describe("Main do chat", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        window.history.replaceState({}, "", "/chat");

        document.body.innerHTML = `
            <input id="chatSearch">
            <div id="listaConversas">
                <section class="conversas-arquivadas">
                    <button
                        class="conversas-arquivadas-toggle"
                        aria-expanded="false"
                    ></button>

                    <div class="conversas-arquivadas-conteudo" hidden>
                        <button class="conversa-item">Conversa arquivada</button>
                    </div>
                </section>

                <div class="conversas-ativas-lista">
                    <button class="conversa-item">Conversa ativa</button>
                </div>
            </div>
        `;

        mocks.carregarConversas.mockResolvedValue([
            { negociacao_id: 10 }
        ]);

        mocks.iniciarConversa.mockResolvedValue({});
        mocks.abrirConversa.mockResolvedValue({});
    });

    it("deve conectar o WebSocket geral na inicialização", async () => {
        await import("../../static/js/chat/main.js");

        expect(mocks.conectarWebSocketGeral).toHaveBeenCalled();
    });

    it("deve carregar as conversas na inicialização", async () => {
        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.carregarConversas).toHaveBeenCalled();
        });
    });

    it("deve mostrar estado sem seleção quando não houver conversas", async () => {
        mocks.carregarConversas.mockResolvedValue([]);

        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.mostrarEstadoSemSelecao).toHaveBeenCalled();
        });
    });

    it("deve abrir a negociação informada na URL", async () => {
        window.history.replaceState({}, "", "/chat?negociacao=10");

        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.iniciarConversa).toHaveBeenCalledWith(10);
            expect(mocks.abrirConversa).toHaveBeenCalledWith(10);
        });
    });

    it("deve rejeitar identificador inválido na URL", async () => {
        window.history.replaceState({}, "", "/chat?negociacao=abc");

        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const erro = vi.spyOn(console, "error").mockImplementation(() => {});

        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.mostrarEstadoSemSelecao).toHaveBeenCalled();
            expect(alerta).toHaveBeenCalledWith(
                "O identificador da negociação é inválido."
            );
        });

        erro.mockRestore();
        alerta.mockRestore();
    });

    it("deve não abrir negociação que não esteja na lista", async () => {
        window.history.replaceState({}, "", "/chat?negociacao=20");

        mocks.carregarConversas.mockResolvedValue([
            { negociacao_id: 10 }
        ]);

        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.mostrarEstadoSemSelecao).toHaveBeenCalled();
        });

        expect(mocks.abrirConversa).not.toHaveBeenCalled();
    });

    it("deve mostrar estado sem seleção quando não houver negociação na URL", async () => {
        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.mostrarEstadoSemSelecao).toHaveBeenCalled();
        });
    });

    it("deve filtrar conversas pelo campo de pesquisa", async () => {
        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.carregarConversas).toHaveBeenCalled();
        });

        const campo = document.getElementById("chatSearch");
        const ativa = document.querySelector(".conversas-ativas-lista .conversa-item");
        const arquivada = document.querySelector(".conversas-arquivadas .conversa-item");

        campo.value = "ativa";
        campo.dispatchEvent(new Event("input"));

        expect(ativa.style.display).toBe("flex");
        expect(arquivada.style.display).toBe("none");
    });

    it("deve ignorar diferenças entre maiúsculas e minúsculas na pesquisa", async () => {
        await import("../../static/js/chat/main.js");

        const campo = document.getElementById("chatSearch");
        const ativa = document.querySelector(".conversas-ativas-lista .conversa-item");

        campo.value = "CONVERSA ATIVA";
        campo.dispatchEvent(new Event("input"));

        expect(ativa.style.display).toBe("flex");
    });

    it("deve expandir a seção arquivada quando houver resultado arquivado", async () => {
        await import("../../static/js/chat/main.js");

        const campo = document.getElementById("chatSearch");
        const botao = document.querySelector(".conversas-arquivadas-toggle");
        const secao = document.querySelector(".conversas-arquivadas");
        const conteudo = document.querySelector(".conversas-arquivadas-conteudo");

        campo.value = "arquivada";
        campo.dispatchEvent(new Event("input"));

        expect(secao.hidden).toBe(false);
        expect(conteudo.hidden).toBe(false);
        expect(botao.getAttribute("aria-expanded")).toBe("true");
        expect(botao.hidden).toBe(true);
    });

    it("deve ocultar a seção arquivada quando não houver resultado", async () => {
        await import("../../static/js/chat/main.js");

        const campo = document.getElementById("chatSearch");
        const secao = document.querySelector(".conversas-arquivadas");

        campo.value = "inexistente";
        campo.dispatchEvent(new Event("input"));

        expect(secao.hidden).toBe(true);
    });

    it("deve restaurar as conversas ao limpar a pesquisa", async () => {
        await import("../../static/js/chat/main.js");

        const campo = document.getElementById("chatSearch");
        const ativa = document.querySelector(".conversas-ativas-lista .conversa-item");
        const arquivada = document.querySelector(".conversas-arquivadas .conversa-item");

        campo.value = "ativa";
        campo.dispatchEvent(new Event("input"));

        campo.value = "";
        campo.dispatchEvent(new Event("input"));

        expect(ativa.style.display).toBe("flex");
        expect(arquivada.style.display).toBe("flex");
    });

    it("deve atualizar a conversa ao receber notificação geral", async () => {
        await import("../../static/js/chat/main.js");

        const callbacks = mocks.conectarWebSocketGeral.mock.calls[0][0];

        const notificacao = {
            negociacao_id: 10,
            texto: "Nova mensagem"
        };

        callbacks.onNovaMensagem(notificacao);

        expect(mocks.atualizarConversaRecebida).toHaveBeenCalledWith(notificacao);
    });

    it("deve atualizar mensagens lidas e zerar o contador", async () => {
        await import("../../static/js/chat/main.js");

        const callbacks = mocks.conectarWebSocketGeral.mock.calls[0][0];

        const notificacao = {
            negociacao_id: 10,
            mensagem_ids: [1, 2]
        };

        callbacks.onMensagensLidas(notificacao);

        expect(mocks.atualizarMensagensLidas).toHaveBeenCalledWith(notificacao);
        expect(mocks.zerarContadorConversa).toHaveBeenCalledWith(10);
    });

    it("não deve zerar o contador quando a notificação não tiver negociação", async () => {
        await import("../../static/js/chat/main.js");

        const callbacks = mocks.conectarWebSocketGeral.mock.calls[0][0];

        callbacks.onMensagensLidas({
            mensagem_ids: [1]
        });

        expect(mocks.atualizarMensagensLidas).toHaveBeenCalled();
        expect(mocks.zerarContadorConversa).not.toHaveBeenCalled();
    });

    it("deve tratar erro durante a inicialização", async () => {
        mocks.carregarConversas.mockRejectedValue(
            new Error("Erro ao carregar conversas")
        );

        const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
        const erro = vi.spyOn(console, "error").mockImplementation(() => {});

        await import("../../static/js/chat/main.js");

        await vi.waitFor(() => {
            expect(mocks.mostrarEstadoSemSelecao).toHaveBeenCalled();
            expect(alerta).toHaveBeenCalledWith("Erro ao carregar conversas");
        });

        erro.mockRestore();
        alerta.mockRestore();
    });
});