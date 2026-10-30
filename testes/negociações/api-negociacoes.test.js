
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

let API;

const API_URL = "http://localhost:5000";

function criarResposta({
    ok = true,
    status = 200,
    data = {},
    contentType = "application/json"
} = {}) {
    return {
        ok,
        status,
        headers: {
            get: vi.fn(() => contentType)
        },
        json: vi.fn().mockResolvedValue(data)
    };
}

describe("API - negociações", () => {
    let fetchMock;
    let consoleError;
    let consoleWarn;

    beforeEach(async () => {
        vi.resetModules();

        vi.stubGlobal("CONFIG", {
            API_URL
        });

        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});

        const modulo = await import(
            "../../static/js/negociacoes/api.js"
        );

        API = modulo.API;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    // =====================================================
    // LISTAR NEGOCIAÇÕES
    // =====================================================

    describe("listarNegociacoes", () => {
        it("deve listar negociações com sucesso", async () => {
            const negociacoes = [
                { id: 1, status: "pendente" },
                { id: 2, status: "finalizado" }
            ];

            fetchMock.mockResolvedValue(
                criarResposta({ data: negociacoes })
            );

            const resultado = await API.listarNegociacoes(
                "produtor"
            );

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociacoes/produtor`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            expect(resultado).toEqual(negociacoes);
        });

        it("deve retornar array vazio quando a resposta não é JSON", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    contentType: "text/html"
                })
            );

            const resultado = await API.listarNegociacoes(
                "estabelecimento"
            );

            expect(resultado).toEqual([]);
            expect(consoleError).toHaveBeenCalled();
        });

        it("deve retornar array vazio quando não existe content-type", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    contentType: null
                })
            );

            const resultado = await API.listarNegociacoes(
                "produtor"
            );

            expect(resultado).toEqual([]);
            expect(consoleError).toHaveBeenCalled();
        });

        it("deve retornar array vazio quando o servidor responde com erro HTTP", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    ok: false,
                    status: 500,
                    data: {
                        erro: "Erro interno"
                    }
                })
            );

            const resultado = await API.listarNegociacoes(
                "produtor"
            );

            expect(resultado).toEqual([]);
            expect(consoleWarn).toHaveBeenCalledWith(
                "Aviso (500):",
                "Erro interno"
            );
        });

        it("deve retornar array vazio quando ocorre erro de conexão", async () => {
            fetchMock.mockRejectedValue(
                new Error("Falha de conexão")
            );

            const resultado = await API.listarNegociacoes(
                "produtor"
            );

            expect(resultado).toEqual([]);
            expect(consoleError).toHaveBeenCalledWith(
                "Erro de conexão com a API:",
                "Falha de conexão"
            );
        });

        it("deve retornar array vazio quando o JSON é inválido", async () => {
            const resposta = criarResposta();
            resposta.json.mockRejectedValue(
                new Error("JSON inválido")
            );

            fetchMock.mockResolvedValue(resposta);

            const resultado = await API.listarNegociacoes(
                "produtor"
            );

            expect(resultado).toEqual([]);
            expect(consoleError).toHaveBeenCalled();
        });
    });

    // =====================================================
    // ATUALIZAR STATUS
    // =====================================================

    describe("atualizarStatus", () => {
        it("deve atualizar o status com sucesso", async () => {
            const respostaServidor = {
                mensagem: "Status atualizado",
                status: "entregue"
            };

            fetchMock.mockResolvedValue(
                criarResposta({
                    data: respostaServidor
                })
            );

            const resultado = await API.atualizarStatus(
                10,
                "entregue"
            );

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociacoes/10/status`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "entregue"
                    })
                }
            );

            expect(resultado).toEqual(respostaServidor);
        });

        it("deve lançar erro quando a resposta HTTP não é bem-sucedida", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    ok: false,
                    status: 500
                })
            );

            await expect(
                API.atualizarStatus(10, "entregue")
            ).rejects.toThrow(
                "Erro ao atualizar status"
            );

            expect(consoleError).toHaveBeenCalledWith(
                "Erro de conexão com a API:",
                "Erro ao atualizar status"
            );
        });

        it("deve lançar erro quando ocorre falha de conexão", async () => {
            fetchMock.mockRejectedValue(
                new Error("Rede indisponível")
            );

            await expect(
                API.atualizarStatus(10, "entregue")
            ).rejects.toThrow("Rede indisponível");

            expect(consoleError).toHaveBeenCalledWith(
                "Erro de conexão com a API:",
                "Rede indisponível"
            );
        });

        it("deve propagar erro quando o JSON da resposta falha", async () => {
            const resposta = criarResposta();
            resposta.json.mockRejectedValue(
                new Error("JSON inválido")
            );

            fetchMock.mockResolvedValue(resposta);

            await expect(
                API.atualizarStatus(10, "entregue")
            ).rejects.toThrow("JSON inválido");
        });
    });

    // =====================================================
    // REGISTRAR CONFIRMAÇÃO
    // =====================================================

    describe("registrarConfirmacao", () => {
        it("deve registrar a confirmação de entrega", async () => {
            const respostaServidor = {
                status: "em_transito"
            };

            fetchMock.mockResolvedValue(
                criarResposta({
                    data: respostaServidor
                })
            );

            const resultado = await API.registrarConfirmacao(
                20,
                "confirmar_entrega"
            );

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociacoes/20/confirmar`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        acao: "confirmar_entrega"
                    })
                }
            );

            expect(resultado).toEqual(respostaServidor);
        });

        it("deve registrar a confirmação de recebimento", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    data: {
                        status: "finalizado"
                    }
                })
            );

            const resultado = await API.registrarConfirmacao(
                25,
                "confirmar_recebimento"
            );

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociacoes/25/confirmar`,
                expect.objectContaining({
                    method: "PUT",
                    body: JSON.stringify({
                        acao: "confirmar_recebimento"
                    })
                })
            );

            expect(resultado).toEqual({
                status: "finalizado"
            });
        });

        it("deve lançar erro quando a confirmação falha", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    ok: false,
                    status: 400
                })
            );

            await expect(
                API.registrarConfirmacao(
                    20,
                    "confirmar_entrega"
                )
            ).rejects.toThrow(
                "Erro ao registrar confirmação"
            );

            expect(consoleError).toHaveBeenCalled();
        });

        it("deve lançar erro quando ocorre falha de conexão", async () => {
            fetchMock.mockRejectedValue(
                new Error("Servidor indisponível")
            );

            await expect(
                API.registrarConfirmacao(
                    20,
                    "confirmar_entrega"
                )
            ).rejects.toThrow("Servidor indisponível");
        });
    });

    // =====================================================
    // DELETAR NEGOCIAÇÃO
    // =====================================================

    describe("deletarNegociacao", () => {
        it("deve deletar uma negociação com sucesso", async () => {
            const respostaServidor = {
                mensagem: "Negociação excluída"
            };

            fetchMock.mockResolvedValue(
                criarResposta({
                    data: respostaServidor
                })
            );

            const resultado = await API.deletarNegociacao(30);

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociacoes/30`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            expect(resultado).toEqual(respostaServidor);
        });

        it("deve lançar erro quando a exclusão falha", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    ok: false,
                    status: 403
                })
            );

            await expect(
                API.deletarNegociacao(30)
            ).rejects.toThrow(
                "Erro ao deletar negociação"
            );

            expect(consoleError).toHaveBeenCalledWith(
                "Erro de conexão com a API:",
                "Erro ao deletar negociação"
            );
        });

        it("deve lançar erro quando ocorre falha de conexão", async () => {
            fetchMock.mockRejectedValue(
                new Error("Conexão perdida")
            );

            await expect(
                API.deletarNegociacao(30)
            ).rejects.toThrow("Conexão perdida");
        });

        it("deve propagar erro quando o JSON da resposta falha", async () => {
            const resposta = criarResposta();
            resposta.json.mockRejectedValue(
                new Error("JSON inválido")
            );

            fetchMock.mockResolvedValue(resposta);

            await expect(
                API.deletarNegociacao(30)
            ).rejects.toThrow("JSON inválido");
        });
    });

    // =====================================================
    // AVALIAR PRODUTOR
    // =====================================================

    describe("avaliarProdutor", () => {
        it("deve enviar avaliação com sucesso", async () => {
            const respostaServidor = {
                mensagem: "Avaliação registrada"
            };

            fetchMock.mockResolvedValue(
                criarResposta({
                    data: respostaServidor
                })
            );

            const resultado = await API.avaliarProdutor(
                40,
                4.5,
                "Ótimo produtor"
            );

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociacoes/40/avaliar`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nota: 4.5,
                        comentario: "Ótimo produtor"
                    })
                }
            );

            expect(resultado).toEqual(respostaServidor);
        });

        it("deve enviar avaliação sem comentário", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    data: {
                        mensagem: "Avaliação registrada"
                    }
                })
            );

            await API.avaliarProdutor(40, 5, "");

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociacoes/40/avaliar`,
                expect.objectContaining({
                    body: JSON.stringify({
                        nota: 5,
                        comentario: ""
                    })
                })
            );
        });

        it("deve lançar erro com a mensagem retornada pelo servidor", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    ok: false,
                    status: 400,
                    data: {
                        detail: {
                            erro: "Nota inválida"
                        }
                    }
                })
            );

            await expect(
                API.avaliarProdutor(40, 10, "Comentário")
            ).rejects.toThrow("Nota inválida");
        });

        it("deve usar mensagem padrão quando o servidor não fornece erro", async () => {
            fetchMock.mockResolvedValue(
                criarResposta({
                    ok: false,
                    status: 500,
                    data: {}
                })
            );

            await expect(
                API.avaliarProdutor(40, 5, "")
            ).rejects.toThrow(
                "Não foi possível enviar a avaliação."
            );
        });

        it("deve usar mensagem padrão quando o JSON de erro falha", async () => {
            const resposta = criarResposta({
                ok: false,
                status: 500
            });

            resposta.json.mockRejectedValue(
                new Error("Resposta inválida")
            );

            fetchMock.mockResolvedValue(resposta);

            await expect(
                API.avaliarProdutor(40, 5, "")
            ).rejects.toThrow(
                "Não foi possível enviar a avaliação."
            );
        });

        it("deve propagar erro de conexão", async () => {
            fetchMock.mockRejectedValue(
                new Error("Falha de rede")
            );

            await expect(
                API.avaliarProdutor(40, 5, "")
            ).rejects.toThrow("Falha de rede");
        });
    });
});
