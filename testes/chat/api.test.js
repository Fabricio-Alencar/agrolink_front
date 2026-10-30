
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

let API;

// ============================================================
// PREPARAÇÃO
// ============================================================

describe("API do Chat - Agrolink", () => {

    beforeEach(async () => {

        // Configuração utilizada pelo api.js.
        globalThis.CONFIG = {
            API_URL: "http://localhost:5000"
        };

        // Reseta os módulos para garantir uma nova importação.
        vi.resetModules();

        // Importação dinâmica após configurar CONFIG.
        const modulo = await import(
            "../../static/js/chat/api.js"
        );

        API = modulo.API;

        // Mock global do fetch.
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();

        delete globalThis.CONFIG;
    });

    // ========================================================
    // AUXILIAR PARA SIMULAR RESPOSTAS HTTP
    // ========================================================

    function criarResposta({
        ok = true,
        dados = {},
        jsonRejeitado = false
    } = {}) {
        return {
            ok,
            json: jsonRejeitado
                ? vi.fn().mockRejectedValue(
                    new Error("Erro ao interpretar JSON")
                )
                : vi.fn().mockResolvedValue(dados)
        };
    }

    // ========================================================
    // BUSCAR CONVERSAS
    // ========================================================

    describe("buscarConversas()", () => {

        it("deve buscar as conversas com método GET", async () => {
            const conversas = [
                { negociacao_id: 1 },
                { negociacao_id: 2 }
            ];

            fetch.mockResolvedValue(
                criarResposta({ dados: conversas })
            );

            const resultado = await API.buscarConversas();

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/chat/conversas",
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            expect(resultado).toEqual(conversas);
        });

        it("deve retornar uma lista vazia quando o JSON falhar", async () => {
            fetch.mockResolvedValue(
                criarResposta({ dados: [], jsonRejeitado: true })
            );

            const resultado = await API.buscarConversas();

            expect(resultado).toEqual([]);
        });

        it("deve lançar erro quando a resposta HTTP não for válida", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {
                        detail: "Acesso negado"
                    }
                })
            );

            await expect(API.buscarConversas())
                .rejects.toThrow("Acesso negado");
        });

        it("deve utilizar a mensagem padrão quando não houver detail", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {}
                })
            );

            await expect(API.buscarConversas())
                .rejects.toThrow(
                    "Não foi possível carregar as conversas."
                );
        });

        it("deve propagar erros de conexão", async () => {
            fetch.mockRejectedValue(
                new Error("Falha de conexão")
            );

            await expect(API.buscarConversas())
                .rejects.toThrow("Falha de conexão");
        });
    });

    // ========================================================
    // INICIAR CONVERSA
    // ========================================================

    describe("iniciarConversa()", () => {

        it("deve iniciar uma conversa com método POST", async () => {
            const dados = {
                negociacao_id: 10,
                criada: true
            };

            fetch.mockResolvedValue(
                criarResposta({ dados })
            );

            const resultado = await API.iniciarConversa(10);

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/chat/conversas/10/iniciar",
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            expect(resultado).toEqual(dados);
        });

        it("deve codificar o identificador da negociação na URL", async () => {
            fetch.mockResolvedValue(
                criarResposta()
            );

            await API.iniciarConversa("pedido 10/20");

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/chat/conversas/pedido%2010%2F20/iniciar",
                expect.any(Object)
            );
        });

        it("deve retornar objeto vazio quando o JSON falhar", async () => {
            fetch.mockResolvedValue(
                criarResposta({ jsonRejeitado: true })
            );

            const resultado = await API.iniciarConversa(10);

            expect(resultado).toEqual({});
        });

        it("deve lançar erro quando não conseguir iniciar a conversa", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {
                        detail: "Negociação não encontrada"
                    }
                })
            );

            await expect(API.iniciarConversa(10))
                .rejects.toThrow("Negociação não encontrada");
        });

        it("deve utilizar a mensagem padrão quando não houver detail", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {}
                })
            );

            await expect(API.iniciarConversa(10))
                .rejects.toThrow(
                    "Não foi possível iniciar a conversa."
                );
        });

        it("deve propagar erros de conexão", async () => {
            fetch.mockRejectedValue(
                new Error("Servidor indisponível")
            );

            await expect(API.iniciarConversa(10))
                .rejects.toThrow("Servidor indisponível");
        });
    });

    // ========================================================
    // BUSCAR MENSAGENS
    // ========================================================

    describe("buscarMensagens()", () => {

        it("deve buscar mensagens com método GET", async () => {
            const mensagens = [
                { id: 1, texto: "Olá" },
                { id: 2, texto: "Tudo bem?" }
            ];

            fetch.mockResolvedValue(
                criarResposta({ dados: mensagens })
            );

            const resultado = await API.buscarMensagens(5);

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/chat/mensagens/5",
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            expect(resultado).toEqual(mensagens);
        });

        it("deve codificar o identificador da negociação na URL", async () => {
            fetch.mockResolvedValue(criarResposta());

            await API.buscarMensagens("negociação 5");

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/chat/mensagens/negocia%C3%A7%C3%A3o%205",
                expect.any(Object)
            );
        });

        it("deve retornar lista vazia quando o JSON falhar", async () => {
            fetch.mockResolvedValue(
                criarResposta({ jsonRejeitado: true })
            );

            const resultado = await API.buscarMensagens(5);

            expect(resultado).toEqual([]);
        });

        it("deve lançar erro quando não conseguir carregar mensagens", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {
                        detail: "Conversa não encontrada"
                    }
                })
            );

            await expect(API.buscarMensagens(5))
                .rejects.toThrow("Conversa não encontrada");
        });

        it("deve utilizar a mensagem padrão quando não houver detail", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {}
                })
            );

            await expect(API.buscarMensagens(5))
                .rejects.toThrow(
                    "Não foi possível carregar as mensagens."
                );
        });

        it("deve propagar erros de conexão", async () => {
            fetch.mockRejectedValue(
                new Error("Erro de rede")
            );

            await expect(API.buscarMensagens(5))
                .rejects.toThrow("Erro de rede");
        });
    });

    // ========================================================
    // VERIFICAR ACESSO À NEGOCIAÇÃO
    // ========================================================

    describe("verificarAcessoNegociacao()", () => {

        it("deve verificar o acesso com método GET", async () => {
            const dados = {
                autorizado: true
            };

            fetch.mockResolvedValue(
                criarResposta({ dados })
            );

            const resultado =
                await API.verificarAcessoNegociacao(15);

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/chat/acesso/15",
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            expect(resultado).toEqual(dados);
        });

        it("deve codificar o identificador na URL", async () => {
            fetch.mockResolvedValue(criarResposta());

            await API.verificarAcessoNegociacao("pedido 15");

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/chat/acesso/pedido%2015",
                expect.any(Object)
            );
        });

        it("deve retornar objeto vazio quando o JSON falhar", async () => {
            fetch.mockResolvedValue(
                criarResposta({ jsonRejeitado: true })
            );

            const resultado =
                await API.verificarAcessoNegociacao(15);

            expect(resultado).toEqual({});
        });

        it("deve lançar erro quando o usuário não tiver acesso", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {
                        detail: "Usuário sem permissão"
                    }
                })
            );

            await expect(
                API.verificarAcessoNegociacao(15)
            ).rejects.toThrow("Usuário sem permissão");
        });

        it("deve utilizar a mensagem padrão quando não houver detail", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {}
                })
            );

            await expect(
                API.verificarAcessoNegociacao(15)
            ).rejects.toThrow(
                "Você não tem acesso a esta conversa."
            );
        });
    });

    // ========================================================
    // BUSCAR DETALHES DA NEGOCIAÇÃO
    // ========================================================

    describe("buscarNegociacao()", () => {

        it("deve buscar os detalhes da negociação com método GET", async () => {
            const detalhes = {
                id: 20,
                produto_nome: "Tomate",
                quantidade: 50
            };

            fetch.mockResolvedValue(
                criarResposta({ dados: detalhes })
            );

            const resultado = await API.buscarNegociacao(20);

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/negociacoes/detalhes/20",
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            expect(resultado).toEqual(detalhes);
        });

        it("deve codificar o identificador da negociação na URL", async () => {
            fetch.mockResolvedValue(criarResposta());

            await API.buscarNegociacao("pedido 20");

            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/negociacoes/detalhes/pedido%2020",
                expect.any(Object)
            );
        });

        it("deve retornar objeto vazio quando o JSON falhar", async () => {
            fetch.mockResolvedValue(
                criarResposta({ jsonRejeitado: true })
            );

            const resultado = await API.buscarNegociacao(20);

            expect(resultado).toEqual({});
        });

        it("deve lançar erro quando não conseguir carregar os detalhes", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {
                        detail: "Negociação inexistente"
                    }
                })
            );

            await expect(API.buscarNegociacao(20))
                .rejects.toThrow("Negociação inexistente");
        });

        it("deve utilizar a mensagem padrão quando não houver detail", async () => {
            fetch.mockResolvedValue(
                criarResposta({
                    ok: false,
                    dados: {}
                })
            );

            await expect(API.buscarNegociacao(20))
                .rejects.toThrow(
                    "Não foi possível carregar os detalhes da negociação."
                );
        });

        it("deve propagar erros de conexão", async () => {
            fetch.mockRejectedValue(
                new Error("Falha no servidor")
            );

            await expect(API.buscarNegociacao(20))
                .rejects.toThrow("Falha no servidor");
        });
    });
});
