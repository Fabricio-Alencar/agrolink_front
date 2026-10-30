
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const mocks = vi.hoisted(() => ({
    getSocket: vi.fn(),
    setSocket: vi.fn(),
    adicionarMensagemNaTela: vi.fn()
}));

vi.mock("../../static/js/chat/estado.js", () => ({
    getSocket: mocks.getSocket,
    setSocket: mocks.setSocket
}));

vi.mock("../../static/js/chat/mensagens.js", () => ({
    adicionarMensagemNaTela: mocks.adicionarMensagemNaTela
}));

describe("WebSocket do Chat", () => {
    let chat;
    let sockets;
    let WebSocketMock;
    let socketEstado;

    beforeEach(async () => {
        vi.resetModules();
        vi.useFakeTimers();

        sockets = [];

        WebSocketMock = class {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;

            constructor(url) {
                this.url = url;
                this.readyState = WebSocketMock.CONNECTING;
                this.close = vi.fn((code, reason) => {
                    this.readyState = WebSocketMock.CLOSED;
                    this.closeCode = code;
                    this.closeReason = reason;

                    this.onclose?.({});
                });

                this.send = vi.fn();

                sockets.push(this);
            }

            abrir() {
                this.readyState = WebSocketMock.OPEN;
                this.onopen?.({});
            }

            receber(dados) {
                this.onmessage?.({
                    data: typeof dados === "string"
                        ? dados
                        : JSON.stringify(dados)
                });
            }

            encerrar() {
                this.readyState = WebSocketMock.CLOSED;
                this.onclose?.({});
            }
        };

        globalThis.WebSocket = WebSocketMock;
        globalThis.CONFIG = {
            API_URL: "http://localhost:5000/"
        };

        localStorage.clear();
        document.cookie = "access_token=; Max-Age=0; path=/";

        socketEstado = null;

        mocks.getSocket.mockImplementation(() => socketEstado);

        mocks.setSocket.mockImplementation((socket) => {
            socketEstado = socket;
        });
        mocks.adicionarMensagemNaTela.mockClear();

        chat = await import("../../static/js/chat/websocket.js");
    });

    afterEach(() => {
        chat?.desconectarWebSockets();

        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();

        localStorage.clear();

        delete globalThis.CONFIG;
        delete globalThis.WebSocket;
        delete window.desconectarWebSockets;
    });

    // =====================================================
    // Autenticação e URL
    // =====================================================

    describe("Autenticação e conexão geral", () => {

        it("conecta ao endereço correto do WebSocket geral", () => {
            chat.conectarWebSocketGeral();

            expect(sockets).toHaveLength(1);
            expect(sockets[0].url).toBe(
                "ws://localhost:5000/chat/ws?token="
            );
        });

        it("utiliza token armazenado no localStorage", () => {
            localStorage.setItem("access_token", "meu-token");

            chat.conectarWebSocketGeral();

            expect(sockets[0].url).toContain("token=meu-token");
        });

        it("codifica o token na URL", () => {
            localStorage.setItem("access_token", "token com espaço");

            chat.conectarWebSocketGeral();

            expect(sockets[0].url).toContain(
                "token=token%20com%20espa%C3%A7o"
            );
        });

        it("não cria outra conexão geral se já estiver conectando", () => {
            chat.conectarWebSocketGeral();
            chat.conectarWebSocketGeral();

            expect(sockets).toHaveLength(1);
        });

        it("não cria outra conexão geral se já estiver aberta", () => {
            chat.conectarWebSocketGeral();
            sockets[0].abrir();

            chat.conectarWebSocketGeral();

            expect(sockets).toHaveLength(1);
        });

        it("cria nova conexão quando a anterior está fechada", () => {
            chat.conectarWebSocketGeral();

            sockets[0].readyState = WebSocketMock.CLOSED;

            chat.conectarWebSocketGeral();

            expect(sockets).toHaveLength(2);
        });

        it("utiliza o token do cookie quando não existe no localStorage", () => {
            document.cookie = "access_token=token-cookie; path=/";

            chat.conectarWebSocketGeral();

            expect(sockets[0].url).toContain("token=token-cookie");
        });
    });

    // =====================================================
    // Mensagens recebidas no WebSocket geral
    // =====================================================

    describe("Mensagens do WebSocket geral", () => {

        it("executa callback de nova mensagem", () => {
            const callback = vi.fn();

            chat.conectarWebSocketGeral({
                onNovaMensagem: callback
            });

            const notificacao = {
                tipo: "nova_mensagem",
                texto: "Olá"
            };

            sockets[0].receber(notificacao);

            expect(callback).toHaveBeenCalledWith(notificacao);
        });

        it("executa callback de mensagens lidas", () => {
            const callback = vi.fn();

            chat.conectarWebSocketGeral({
                onMensagensLidas: callback
            });

            const notificacao = {
                tipo: "mensagens_lidas",
                mensagem_ids: [1, 2]
            };

            sockets[0].receber(notificacao);

            expect(callback).toHaveBeenCalledWith(notificacao);
        });

        it("ignora tipos de notificação desconhecidos", () => {
            const callback = vi.fn();

            chat.conectarWebSocketGeral({
                onNovaMensagem: callback,
                onMensagensLidas: callback
            });

            sockets[0].receber({
                tipo: "desconhecido"
            });

            expect(callback).not.toHaveBeenCalled();
        });

        it("ignora mensagens JSON inválidas", () => {
            const callback = vi.fn();

            chat.conectarWebSocketGeral({
                onNovaMensagem: callback
            });

            sockets[0].receber("{json inválido");

            expect(callback).not.toHaveBeenCalled();
        });

        it("não processa mensagens de um socket antigo", () => {
            const callback = vi.fn();

            chat.conectarWebSocketGeral({
                onNovaMensagem: callback
            });

            const socketAntigo = sockets[0];

            socketAntigo.readyState = WebSocketMock.CLOSED;

            chat.conectarWebSocketGeral({
                onNovaMensagem: callback
            });

            socketAntigo.receber({
                tipo: "nova_mensagem"
            });

            expect(callback).not.toHaveBeenCalled();
        });
    });

    // =====================================================
    // Conexão por negociação
    // =====================================================

    describe("conectarWebSocket", () => {

        it("não conecta quando o identificador é null", () => {
            chat.conectarWebSocket(null);

            expect(sockets).toHaveLength(0);
        });

        it("não conecta quando o identificador é undefined", () => {
            chat.conectarWebSocket(undefined);

            expect(sockets).toHaveLength(0);
        });

        it("não conecta quando o identificador é vazio", () => {
            chat.conectarWebSocket("   ");

            expect(sockets).toHaveLength(0);
        });

        it("conecta ao endereço da negociação", () => {
            chat.conectarWebSocket(123);

            expect(sockets).toHaveLength(1);
            expect(sockets[0].url).toBe(
                "ws://localhost:5000/chat/ws/123?token="
            );
        });

        it("codifica o identificador da negociação", () => {
            chat.conectarWebSocket("id teste");

            expect(sockets[0].url).toContain(
                "/chat/ws/id%20teste?"
            );
        });

        it("não cria outra conexão para a mesma negociação quando está conectando", () => {
            chat.conectarWebSocket(123);
            chat.conectarWebSocket(123);

            expect(sockets).toHaveLength(1);
        });

        it("não cria outra conexão para a mesma negociação quando está aberta", () => {
            chat.conectarWebSocket(123);
            sockets[0].abrir();

            chat.conectarWebSocket(123);

            expect(sockets).toHaveLength(1);
        });

        it("fecha o socket anterior ao trocar de negociação", () => {
            chat.conectarWebSocket(123);

            const socketAnterior = sockets[0];

            chat.conectarWebSocket(456);

            expect(socketAnterior.close).toHaveBeenCalled();
            expect(sockets).toHaveLength(2);
        });

        it("armazena o novo socket no estado", () => {
            chat.conectarWebSocket(123);

            expect(mocks.setSocket).toHaveBeenCalledWith(sockets[0]);
        });

        it("fecha o socket quando ele não pertence mais à negociação ativa", () => {
    chat.conectarWebSocket(123);

    const socketAntigo = sockets[0];

    const socketAtual = {
        readyState: WebSocketMock.OPEN,
        close: vi.fn()
    };

    mocks.getSocket.mockReturnValue(socketAtual);

    socketAntigo.abrir();

    expect(socketAntigo.close).toHaveBeenCalled();
});
    });

    // =====================================================
    // Mensagens recebidas no chat ativo
    // =====================================================

    describe("Mensagens do chat ativo", () => {

        it("executa callback de confirmação de mensagem", () => {
            const callback = vi.fn();

            chat.conectarWebSocket(123, {
                onMensagemConfirmada: callback
            });

            const socket = sockets[0];
            mocks.getSocket.mockReturnValue(socket);

            const mensagem = {
                tipo: "confirmacao_mensagem",
                id: 10,
                texto: "Olá"
            };

            socket.receber(mensagem);

            expect(callback).toHaveBeenCalledWith(mensagem);
            expect(mocks.adicionarMensagemNaTela).not.toHaveBeenCalled();
        });

        it("adiciona mensagem recebida à tela", () => {
            chat.conectarWebSocket(123);

            const socket = sockets[0];
            mocks.getSocket.mockReturnValue(socket);

            const mensagem = {
                tipo: "nova_mensagem",
                texto: "Mensagem recebida"
            };

            socket.receber(mensagem);

            expect(mocks.adicionarMensagemNaTela).toHaveBeenCalledWith(
                mensagem,
                false
            );
        });

        it("ignora mensagem JSON inválida", () => {
            chat.conectarWebSocket(123);

            const socket = sockets[0];
            mocks.getSocket.mockReturnValue(socket);

            socket.receber("{json inválido");

            expect(mocks.adicionarMensagemNaTela).not.toHaveBeenCalled();
        });

        it("não processa mensagem de socket que não é mais o atual", () => {
    chat.conectarWebSocket(123);

    const socketAntigo = sockets[0];

    const socketAtual = {
        readyState: WebSocketMock.OPEN,
        close: vi.fn()
    };

    mocks.getSocket.mockReturnValue(socketAtual);

    socketAntigo.receber({
        texto: "Mensagem antiga"
    });

    expect(mocks.adicionarMensagemNaTela).not.toHaveBeenCalled();
});
    });

    // =====================================================
    // Reconexão
    // =====================================================

    describe("Reconexão do WebSocket geral", () => {

        it("agenda reconexão quando o socket geral fecha", () => {
            chat.conectarWebSocketGeral();

            sockets[0].encerrar();

            expect(vi.getTimerCount()).toBe(1);
        });

        it("tenta reconectar após dois segundos", () => {
            chat.conectarWebSocketGeral();

            sockets[0].encerrar();

            vi.advanceTimersByTime(1999);

            expect(sockets).toHaveLength(1);

            vi.advanceTimersByTime(1);

            expect(sockets).toHaveLength(2);
        });

        it("não agenda vários timers de reconexão geral", () => {
            chat.conectarWebSocketGeral();

            sockets[0].encerrar();

            expect(vi.getTimerCount()).toBe(1);
        });
    });

    describe("Reconexão do chat ativo", () => {

        it("agenda reconexão quando o socket do chat fecha", () => {
            chat.conectarWebSocket(123);

            const socket = sockets[0];
            mocks.getSocket.mockReturnValue(socket);

            socket.encerrar();

            expect(vi.getTimerCount()).toBe(1);
        });

        it("tenta reconectar após dois segundos", () => {
            chat.conectarWebSocket(123);

            const socket = sockets[0];
            mocks.getSocket.mockReturnValue(socket);

            socket.encerrar();

            vi.advanceTimersByTime(2000);

            expect(sockets).toHaveLength(2);
        });

        it("não agenda reconexão para negociação que deixou de ser ativa", () => {
            chat.conectarWebSocket(123);

            const socket = sockets[0];
            mocks.getSocket.mockReturnValue(socket);

            chat.conectarWebSocket(456);

            vi.clearAllTimers();

            socket.encerrar();

            expect(vi.getTimerCount()).toBe(0);
        });
    });

    // =====================================================
    // Desconexão
    // =====================================================

    describe("desconectarWebSockets", () => {

        it("disponibiliza a função global de desconexão", () => {
            expect(window.desconectarWebSockets).toBe(
                chat.desconectarWebSockets
            );
        });

        it("fecha o WebSocket geral", () => {
            chat.conectarWebSocketGeral();

            const socket = sockets[0];

            chat.desconectarWebSockets();

            expect(socket.close).toHaveBeenCalledWith(1000, "Logout");
        });

        it("fecha o WebSocket do chat", () => {
            chat.conectarWebSocket(123);

            const socket = sockets[0];
            mocks.getSocket.mockReturnValue(socket);

            chat.desconectarWebSockets();

            expect(socket.close).toHaveBeenCalledWith(1000, "Logout");
        });

        it("limpa a referência do socket do chat", () => {
            chat.conectarWebSocket(123);

            mocks.getSocket.mockReturnValue(sockets[0]);

            chat.desconectarWebSockets();

            expect(mocks.setSocket).toHaveBeenCalledWith(null);
        });

        it("cancela timers de reconexão", () => {
            chat.conectarWebSocketGeral();

            sockets[0].encerrar();

            expect(vi.getTimerCount()).toBe(1);

            chat.desconectarWebSockets();

            expect(vi.getTimerCount()).toBe(0);
        });

        it("não fecha novamente um socket já fechado", () => {
            chat.conectarWebSocketGeral();

            const socket = sockets[0];

            socket.readyState = WebSocketMock.CLOSED;

            chat.desconectarWebSockets();

            expect(socket.close).not.toHaveBeenCalled();
        });
    });
});
