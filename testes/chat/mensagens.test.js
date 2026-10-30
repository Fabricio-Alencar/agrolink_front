
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const mocks = vi.hoisted(() => ({
    getNegociacaoAtual: vi.fn(),
    getSocket: vi.fn(),
    atualizarConversaEnviada: vi.fn()
}));

vi.mock("../../static/js/chat/estado.js", () => ({
    getNegociacaoAtual: mocks.getNegociacaoAtual,
    getSocket: mocks.getSocket
}));

vi.mock("../../static/js/chat/lista-conversas.js", () => ({
    atualizarConversaEnviada: mocks.atualizarConversaEnviada
}));

describe("Mensagens do Chat", () => {
    let mensagens;
    let formulario;
    let input;
    let chat;

    beforeEach(async () => {
        vi.resetModules();

        document.body.innerHTML = `
            <div id="mensagens"></div>

            <form id="chatForm">
                <input id="mensagemInput" type="text">
                <button type="submit">Enviar</button>
            </form>
        `;

        mensagens = document.getElementById("mensagens");
        formulario = document.getElementById("chatForm");
        input = document.getElementById("mensagemInput");

        globalThis.Auth = {
            getId: vi.fn(() => 10)
        };

        globalThis.WebSocket = class WebSocketMock {
            static OPEN = 1;
            static CONNECTING = 0;
            static CLOSING = 2;
            static CLOSED = 3;
        };

        globalThis.lucide = {
            createIcons: vi.fn()
        };

        window.lucide = globalThis.lucide;

        mocks.getNegociacaoAtual.mockReturnValue(123);
        mocks.getSocket.mockReturnValue(null);
        mocks.atualizarConversaEnviada.mockClear();

        chat = await import("../../static/js/chat/mensagens.js");
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();

        delete globalThis.Auth;
        delete globalThis.WebSocket;
        delete globalThis.lucide;
        delete window.lucide;
    });

    // =====================================================
    // adicionarMensagemNaTela
    // =====================================================

    describe("adicionarMensagemNaTela", () => {

        it("adiciona uma mensagem enviada", () => {
            chat.adicionarMensagemNaTela("Olá", true);

            const mensagem = mensagens.querySelector(".mensagem");

            expect(mensagem).not.toBeNull();
            expect(mensagem.classList.contains("mensagem-enviada")).toBe(true);
            expect(mensagem.querySelector("p").textContent).toBe("Olá");
        });

        it("adiciona uma mensagem recebida", () => {
            chat.adicionarMensagemNaTela("Olá", false);

            const mensagem = mensagens.querySelector(".mensagem");

            expect(mensagem.classList.contains("mensagem-recebida")).toBe(true);
            expect(mensagem.classList.contains("mensagem-enviada")).toBe(false);
        });

        it("remove o aviso de chat vazio ao adicionar mensagem", () => {
            mensagens.innerHTML = '<div class="chat-vazio">Sem mensagens</div>';

            chat.adicionarMensagemNaTela("Nova mensagem");

            expect(mensagens.querySelector(".chat-vazio")).toBeNull();
            expect(mensagens.querySelector(".mensagem")).not.toBeNull();
        });

        it("adiciona o identificador da mensagem", () => {
            chat.adicionarMensagemNaTela({
                id: 50,
                texto: "Teste"
            });

            expect(
                mensagens.querySelector(".mensagem").dataset.mensagemId
            ).toBe("50");
        });

        it("adiciona a data da mensagem ao elemento", () => {
            chat.adicionarMensagemNaTela({
                id: 1,
                texto: "Teste",
                data_envio: "2026-10-30T12:00:00Z"
            });

            expect(
                mensagens.querySelector(".mensagem").dataset.dataMensagem
            ).toBe("2026-10-30");
        });

        it("cria divisória quando a mensagem possui data", () => {
            chat.adicionarMensagemNaTela({
                texto: "Mensagem",
                data_envio: "2026-10-30T12:00:00Z"
            });

            expect(
                mensagens.querySelector(".mensagem-divisoria-data")
            ).not.toBeNull();
        });

        it("não cria divisória quando a data é inválida", () => {
            chat.adicionarMensagemNaTela({
                texto: "Mensagem",
                data_envio: "data inválida"
            });

            expect(
                mensagens.querySelector(".mensagem-divisoria-data")
            ).toBeNull();
        });

        it("cria status de envio para mensagens enviadas", () => {
            chat.adicionarMensagemNaTela("Mensagem", true);

            expect(
                mensagens.querySelector(".mensagem-status")
            ).not.toBeNull();
        });

        it("não cria status de envio para mensagens recebidas", () => {
            chat.adicionarMensagemNaTela("Mensagem", false);

            expect(
                mensagens.querySelector(".mensagem-status")
            ).toBeNull();
        });

        it("cria status visualizado quando a mensagem já foi lida", () => {
            chat.adicionarMensagemNaTela({
                texto: "Mensagem",
                lida: true
            });

            expect(
                mensagens.querySelector(".mensagem-status")
                    .classList.contains("visualizado")
            ).toBe(true);
        });
    });

    // =====================================================
    // renderizarMensagens
    // =====================================================

    describe("renderizarMensagens", () => {

        it("limpa o conteúdo anterior", () => {
            mensagens.innerHTML = "<p>Conteúdo antigo</p>";

            chat.renderizarMensagens([]);

            expect(mensagens.querySelector("p")).not.toBeNull();
            expect(mensagens.querySelector("p").textContent).toBe(
                "Envie uma mensagem para iniciar esta conversa."
            );
        });

        it("mostra aviso quando a lista está vazia", () => {
            chat.renderizarMensagens([]);

            expect(
                mensagens.querySelector(".chat-vazio")
            ).not.toBeNull();

            expect(mensagens.textContent).toContain(
                "Nenhuma mensagem ainda"
            );
        });

        it("mostra aviso quando recebe null", () => {
            chat.renderizarMensagens(null);

            expect(
                mensagens.querySelector(".chat-vazio")
            ).not.toBeNull();
        });

        it("renderiza mensagens enviadas pelo usuário logado", () => {
            chat.renderizarMensagens([
                {
                    id: 1,
                    remetente_id: 10,
                    texto: "Minha mensagem"
                }
            ]);

            expect(
                mensagens.querySelector(".mensagem-enviada")
            ).not.toBeNull();
        });

        it("renderiza mensagens recebidas de outro usuário", () => {
            chat.renderizarMensagens([
                {
                    id: 2,
                    remetente_id: 20,
                    texto: "Mensagem recebida"
                }
            ]);

            expect(
                mensagens.querySelector(".mensagem-recebida")
            ).not.toBeNull();
        });

        it("renderiza várias mensagens", () => {
            chat.renderizarMensagens([
                { id: 1, remetente_id: 10, texto: "Primeira" },
                { id: 2, remetente_id: 20, texto: "Segunda" },
                { id: 3, remetente_id: 10, texto: "Terceira" }
            ]);

            expect(mensagens.querySelectorAll(".mensagem")).toHaveLength(3);
        });

        it("cria apenas uma divisória para mensagens do mesmo dia", () => {
            chat.renderizarMensagens([
                {
                    id: 1,
                    remetente_id: 10,
                    texto: "Primeira",
                    data_envio: "2026-10-30T10:00:00Z"
                },
                {
                    id: 2,
                    remetente_id: 20,
                    texto: "Segunda",
                    data_envio: "2026-10-30T11:00:00Z"
                }
            ]);

            expect(
                mensagens.querySelectorAll(".mensagem-divisoria-data")
            ).toHaveLength(1);
        });

        it("cria divisórias diferentes para dias diferentes", () => {
            chat.renderizarMensagens([
                {
                    id: 1,
                    remetente_id: 10,
                    texto: "Primeira",
                    data_envio: "2026-10-29T10:00:00Z"
                },
                {
                    id: 2,
                    remetente_id: 20,
                    texto: "Segunda",
                    data_envio: "2026-10-30T10:00:00Z"
                }
            ]);

            expect(
                mensagens.querySelectorAll(".mensagem-divisoria-data")
            ).toHaveLength(2);
        });

        it("não interpreta o texto da mensagem como HTML", () => {
            chat.renderizarMensagens([
                {
                    id: 1,
                    remetente_id: 10,
                    texto: "<img src=x onerror=alert(1)>"
                }
            ]);

            expect(mensagens.querySelector("img")).toBeNull();
            expect(mensagens.textContent).toContain("<img");
        });
    });

    // =====================================================
    // confirmarMensagemEnviada
    // =====================================================

    describe("confirmarMensagemEnviada", () => {

        it("ignora confirmação quando não existe mensagem", () => {
            expect(() => {
                chat.confirmarMensagemEnviada(null);
            }).not.toThrow();
        });

        it("ignora confirmação sem mensagem provisória correspondente", () => {
            chat.adicionarMensagemNaTela("Outra mensagem");

            chat.confirmarMensagemEnviada({
                id: 50,
                texto: "Mensagem inexistente"
            });

            expect(
                mensagens.querySelector(".mensagem").dataset.mensagemId
            ).toBeUndefined();
        });

        it("adiciona o ID à mensagem provisória correspondente", () => {
            chat.adicionarMensagemNaTela("Olá");

            chat.confirmarMensagemEnviada({
                id: 50,
                texto: "Olá"
            });

            expect(
                mensagens.querySelector(".mensagem").dataset.mensagemId
            ).toBe("50");
        });

        it("atualiza a data da mensagem confirmada", () => {
            chat.adicionarMensagemNaTela("Olá");

            chat.confirmarMensagemEnviada({
                id: 50,
                texto: "Olá",
                data_envio: "2026-10-30T12:00:00Z"
            });

            expect(
                mensagens.querySelector(".mensagem").dataset.dataMensagem
            ).toBe("2026-10-30");
        });

        it("atualiza o status da mensagem confirmada", () => {
            chat.adicionarMensagemNaTela("Olá");

            chat.confirmarMensagemEnviada({
                id: 50,
                texto: "Olá",
                lida: true
            });

            expect(
                mensagens.querySelector(".mensagem-status")
                    .classList.contains("visualizado")
            ).toBe(true);
        });
    });

    // =====================================================
    // atualizarMensagensLidas
    // =====================================================

    describe("atualizarMensagensLidas", () => {

        beforeEach(() => {
            chat.renderizarMensagens([
                {
                    id: 10,
                    remetente_id: 10,
                    texto: "Mensagem enviada",
                    lida: false
                },
                {
                    id: 20,
                    remetente_id: 20,
                    texto: "Mensagem recebida"
                }
            ]);
        });

        it("atualiza o status de mensagem enviada quando a negociação corresponde", () => {
            mocks.getNegociacaoAtual.mockReturnValue(123);

            chat.atualizarMensagensLidas({
                negociacao_id: 123,
                mensagem_ids: [10]
            });

            expect(
                mensagens.querySelector('[data-mensagem-id="10"] .mensagem-status')
                    .classList.contains("visualizado")
            ).toBe(true);
        });

        it("não atualiza mensagens de outra negociação", () => {
            mocks.getNegociacaoAtual.mockReturnValue(123);

            chat.atualizarMensagensLidas({
                negociacao_id: 999,
                mensagem_ids: [10]
            });

            expect(
                mensagens.querySelector('[data-mensagem-id="10"] .mensagem-status')
                    .classList.contains("enviada")
            ).toBe(true);
        });

        it("não altera mensagens recebidas", () => {
            mocks.getNegociacaoAtual.mockReturnValue(123);

            chat.atualizarMensagensLidas({
                negociacao_id: 123,
                mensagem_ids: [20]
            });

            expect(
                mensagens.querySelector('[data-mensagem-id="20"] .mensagem-status')
            ).toBeNull();
        });

        it("ignora IDs que não existem", () => {
            mocks.getNegociacaoAtual.mockReturnValue(123);

            expect(() => {
                chat.atualizarMensagensLidas({
                    negociacao_id: 123,
                    mensagem_ids: [999]
                });
            }).not.toThrow();
        });
    });

    // =====================================================
    // Envio pelo formulário
    // =====================================================

    describe("envio de mensagens pelo formulário", () => {

        function enviarFormulario() {
            formulario.dispatchEvent(
                new Event("submit", {
                    bubbles: true,
                    cancelable: true
                })
            );
        }

        it("impede o comportamento padrão do formulário", () => {
            const evento = new Event("submit", {
                bubbles: true,
                cancelable: true
            });

            formulario.dispatchEvent(evento);

            expect(evento.defaultPrevented).toBe(true);
        });

        it("não envia mensagem vazia", () => {
            input.value = "   ";

            const socket = {
                readyState: WebSocket.OPEN,
                send: vi.fn()
            };

            mocks.getSocket.mockReturnValue(socket);

            enviarFormulario();

            expect(socket.send).not.toHaveBeenCalled();
        });

        it("não envia quando não existe negociação atual", () => {
            input.value = "Olá";
            mocks.getNegociacaoAtual.mockReturnValue(null);

            const socket = {
                readyState: WebSocket.OPEN,
                send: vi.fn()
            };

            mocks.getSocket.mockReturnValue(socket);

            enviarFormulario();

            expect(socket.send).not.toHaveBeenCalled();
        });

        it("não envia quando não existe socket", () => {
            input.value = "Olá";
            mocks.getNegociacaoAtual.mockReturnValue(123);
            mocks.getSocket.mockReturnValue(null);

            enviarFormulario();

            expect(mensagens.querySelector(".mensagem")).toBeNull();
        });

        it("não envia quando o socket não está aberto", () => {
            input.value = "Olá";

            const socket = {
                readyState: WebSocket.CONNECTING,
                send: vi.fn()
            };

            mocks.getSocket.mockReturnValue(socket);

            enviarFormulario();

            expect(socket.send).not.toHaveBeenCalled();
        });

        it("envia a mensagem pelo socket", () => {
            input.value = "Olá";

            const socket = {
                readyState: WebSocket.OPEN,
                send: vi.fn()
            };

            mocks.getSocket.mockReturnValue(socket);

            enviarFormulario();

            expect(socket.send).toHaveBeenCalledWith("Olá");
        });

        it("adiciona a mensagem provisória na tela", () => {
            input.value = "Olá";

            mocks.getSocket.mockReturnValue({
                readyState: WebSocket.OPEN,
                send: vi.fn()
            });

            enviarFormulario();

            expect(mensagens.textContent).toContain("Olá");
        });

        it("atualiza a prévia da conversa", () => {
            input.value = "Olá";

            mocks.getSocket.mockReturnValue({
                readyState: WebSocket.OPEN,
                send: vi.fn()
            });

            enviarFormulario();

            expect(mocks.atualizarConversaEnviada).toHaveBeenCalledWith({
                negociacao_id: 123,
                texto: "Olá"
            });
        });

        it("limpa o campo após o envio", () => {
            input.value = "Olá";

            mocks.getSocket.mockReturnValue({
                readyState: WebSocket.OPEN,
                send: vi.fn()
            });

            enviarFormulario();

            expect(input.value).toBe("");
        });
    });
});
