
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const API_URL = "http://localhost:8000";

let API;
let fetchMock;
let consoleErrorMock;
let consoleWarnMock;

describe("API do Marketplace", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        vi.stubGlobal("CONFIG", {
            API_URL
        });

        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        consoleErrorMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        consoleWarnMock = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});

        const modulo = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/api.js"
        );

        API = modulo.API;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("listarProdutos", () => {
        it("deve buscar os produtos da API", async () => {
            const produtos = [
                { id: 1, nome: "Milho" },
                { id: 2, nome: "Soja" }
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn().mockReturnValue("application/json")
                },
                json: vi.fn().mockResolvedValue(produtos)
            });

            const resultado = await API.listarProdutos();

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/produtos`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            expect(resultado).toEqual(produtos);
        });

        it("deve retornar um array vazio quando a API retorna erro HTTP", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                headers: {
                    get: vi.fn().mockReturnValue("application/json")
                },
                json: vi.fn().mockResolvedValue({
                    erro: "Erro interno"
                })
            });

            const resultado = await API.listarProdutos();

            expect(resultado).toEqual([]);

            expect(consoleWarnMock).toHaveBeenCalledWith(
                "Aviso (500):",
                "Erro interno"
            );
        });

        it("deve retornar array vazio quando a resposta não é JSON", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn().mockReturnValue("text/html")
                }
            });

            const resultado = await API.listarProdutos();

            expect(resultado).toEqual([]);

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "Erro de conexão com a API:",
                "Resposta do servidor não é JSON"
            );
        });

        it("deve retornar array vazio quando não existe content-type", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn().mockReturnValue(null)
                }
            });

            const resultado = await API.listarProdutos();

            expect(resultado).toEqual([]);
        });

        it("deve retornar array vazio quando ocorre falha de conexão", async () => {
            fetchMock.mockRejectedValue(
                new Error("Falha de conexão")
            );

            const resultado = await API.listarProdutos();

            expect(resultado).toEqual([]);

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "Erro de conexão com a API:",
                "Falha de conexão"
            );
        });

        it("deve retornar array vazio quando o JSON não pode ser processado", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                headers: {
                    get: vi.fn().mockReturnValue("application/json")
                },
                json: vi.fn().mockRejectedValue(
                    new Error("JSON inválido")
                )
            });

            const resultado = await API.listarProdutos();

            expect(resultado).toEqual([]);
        });
    });

    describe("enviarNegociacao", () => {
        it("deve enviar uma negociação corretamente", async () => {
            const pedido = {
                produto_id: 1,
                quantidade: 100,
                data_entrega: "2026-11-10",
                descricao: "Pedido de milho"
            };

            const resposta = {
                mensagem: "Negociação enviada",
                id: 10
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(resposta)
            });

            const resultado = await API.enviarNegociacao(pedido);

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/negociar`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(pedido)
                }
            );

            expect(resultado).toEqual(resposta);
        });

        it("deve lançar erro quando a API rejeita a negociação", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue({
                    erro: "Produto indisponível"
                })
            });

            await expect(
                API.enviarNegociacao({
                    produto_id: 1
                })
            ).rejects.toThrow("Produto indisponível");

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "Erro na API de negociação:",
                "Produto indisponível"
            );
        });

        it("deve lançar erro genérico quando a API não informa o motivo", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue({})
            });

            await expect(
                API.enviarNegociacao({})
            ).rejects.toThrow("Erro ao processar negociação");
        });

        it("deve propagar erro quando ocorre falha de conexão", async () => {
            fetchMock.mockRejectedValue(
                new Error("Servidor indisponível")
            );

            await expect(
                API.enviarNegociacao({})
            ).rejects.toThrow("Servidor indisponível");

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "Erro na API de negociação:",
                "Servidor indisponível"
            );
        });
    });
});
