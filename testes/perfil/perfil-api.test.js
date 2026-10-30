
import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    afterEach,
    vi
} from "vitest";

let API;

describe("API do perfil", () => {
    beforeAll(async () => {
        globalThis.CONFIG = {
            API_URL: "http://localhost:5000"
        };

        window.CONFIG = globalThis.CONFIG;

        ({ API } = await import("../../static/js/perfil/api.js"));
    });

    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("deve consultar o perfil com GET", async () => {
        const perfil = {
            nome: "Maria",
            email: "maria@email.com"
        };

        fetch.mockResolvedValue({
            ok: true,
            json: async () => perfil
        });

        const resultado = await API.obterPerfil();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/perfil",
            {
                method: "GET",
                credentials: "include"
            }
        );

        expect(resultado).toEqual(perfil);
    });

    it("deve lançar erro quando a consulta do perfil falhar", async () => {
        fetch.mockResolvedValue({
            ok: false
        });

        await expect(API.obterPerfil()).rejects.toThrow(
            "Erro ao carregar os dados do perfil."
        );

        expect(console.error).toHaveBeenCalled();
    });

    it("deve tratar falhas de comunicação ao consultar o perfil", async () => {
        fetch.mockRejectedValue(new Error("Falha de conexão"));

        await expect(API.obterPerfil()).rejects.toThrow(
            "Falha de conexão"
        );

        expect(console.error).toHaveBeenCalled();
    });

    it("deve atualizar o perfil com POST", async () => {
        const formData = new FormData();
        formData.append("nome", "Maria Silva");

        const resposta = {
            mensagem: "Perfil atualizado"
        };

        fetch.mockResolvedValue({
            ok: true,
            json: async () => resposta
        });

        const resultado = await API.atualizarPerfil(formData);

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/perfil",
            {
                method: "POST",
                credentials: "include",
                body: formData
            }
        );

        expect(resultado).toEqual(resposta);
    });

    it("deve usar a mensagem de erro retornada pela API ao atualizar", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({
                erro: "Email já cadastrado"
            })
        });

        await expect(
            API.atualizarPerfil(new FormData())
        ).rejects.toThrow("Email já cadastrado");

        expect(console.error).toHaveBeenCalled();
    });

    it("deve usar a mensagem padrão se a API não informar o erro ao atualizar", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({})
        });

        await expect(
            API.atualizarPerfil(new FormData())
        ).rejects.toThrow("Erro ao salvar os dados.");
    });

    it("deve tratar falhas de comunicação ao atualizar o perfil", async () => {
        fetch.mockRejectedValue(new Error("Servidor indisponível"));

        await expect(
            API.atualizarPerfil(new FormData())
        ).rejects.toThrow("Servidor indisponível");
    });

    it("deve excluir a conta com DELETE", async () => {
        const resposta = {
            mensagem: "Conta excluída"
        };

        fetch.mockResolvedValue({
            ok: true,
            json: async () => resposta
        });

        const resultado = await API.excluirConta();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/perfil",
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        expect(resultado).toEqual(resposta);
    });

    it("deve lançar erro quando a exclusão da conta falhar", async () => {
        fetch.mockResolvedValue({
            ok: false
        });

        await expect(API.excluirConta()).rejects.toThrow(
            "Erro ao excluir a conta."
        );

        expect(console.error).toHaveBeenCalled();
    });

    it("deve tratar falhas de comunicação ao excluir a conta", async () => {
        fetch.mockRejectedValue(new Error("Falha de conexão"));

        await expect(API.excluirConta()).rejects.toThrow(
            "Falha de conexão"
        );
    });
});
