
import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    vi
} from "vitest";

describe("API dos produtos", () => {
    let API;

    beforeAll(async () => {
        vi.stubGlobal("CONFIG", {
            API_URL: "http://localhost:5000"
        });

        const modulo = await import(
            "../../static/js/produtores/api.js"
        );

        API = modulo.API;
    });

    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());

        vi.spyOn(console, "error")
            .mockImplementation(() => {});
    });

    it("busca os produtos do usuário logado", async () => {
        const produtos = [{ id: 1, nome: "Maçã" }];

        fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(produtos)
        });

        const resultado = await API.meusProdutos();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/meus-produtos",
            {
                method: "GET",
                credentials: "include"
            }
        );

        expect(resultado).toEqual(produtos);
    });

    it("retorna lista vazia quando a busca retorna HTTP inválido", async () => {
        const erro = { erro: "Não autorizado" };

        fetch.mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue(erro)
        });

        expect(await API.meusProdutos()).toEqual([]);

        expect(console.error).toHaveBeenCalledWith(
            "Erro ao buscar produtos:",
            erro
        );
    });

    it("retorna lista vazia quando ocorre erro de rede na busca", async () => {
        const erro = new Error("Falha de conexão");

        fetch.mockRejectedValue(erro);

        expect(await API.meusProdutos()).toEqual([]);

        expect(console.error).toHaveBeenCalledWith(
            "Erro de rede ao buscar produtos:",
            erro
        );
    });

    it("cria um produto enviando FormData por POST", async () => {
        const formData = new FormData();
        formData.append("nome", "Maçã");

        const resposta = { mensagem: "Criado" };

        fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(resposta)
        });

        const resultado = await API.criarProduto(formData);

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/produtos",
            {
                method: "POST",
                body: formData,
                credentials: "include"
            }
        );

        expect(resultado).toEqual(resposta);
    });

    it("retorna os dados da API mesmo quando a criação retorna HTTP inválido", async () => {
        const resposta = { erro: "Dados inválidos" };

        fetch.mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue(resposta)
        });

        expect(
            await API.criarProduto(new FormData())
        ).toEqual(resposta);

        expect(console.error).toHaveBeenCalledWith(
            "Erro ao criar produto:",
            resposta
        );
    });

    it("retorna null quando ocorre erro de rede na criação", async () => {
        const erro = new Error("Sem conexão");

        fetch.mockRejectedValue(erro);

        expect(
            await API.criarProduto(new FormData())
        ).toBeNull();

        expect(console.error).toHaveBeenCalledWith(
            "Erro de rede ao criar produto:",
            erro
        );
    });

    it("exclui um produto usando o ID informado", async () => {
        const resposta = { mensagem: "Excluído" };

        fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(resposta)
        });

        const resultado = await API.excluirProduto(15);

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/produtos/15",
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        expect(resultado).toEqual(resposta);
    });

    it("retorna null quando a exclusão retorna HTTP inválido", async () => {
        const resposta = { erro: "Produto não encontrado" };

        fetch.mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue(resposta)
        });

        expect(await API.excluirProduto(99)).toBeNull();

        expect(console.error).toHaveBeenCalledWith(
            "Erro ao excluir produto:",
            resposta
        );
    });

    it("retorna null quando ocorre erro de rede na exclusão", async () => {
        const erro = new Error("Falha de conexão");

        fetch.mockRejectedValue(erro);

        expect(await API.excluirProduto(10)).toBeNull();

        expect(console.error).toHaveBeenCalledWith(
            "Erro de rede ao excluir produto:",
            erro
        );
    });

    it("atualiza um produto usando POST e o ID informado", async () => {
        const formData = new FormData();
        formData.append("nome", "Maçã atualizada");

        const resposta = { mensagem: "Atualizado" };

        fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(resposta)
        });

        const resultado = await API.atualizarProduto(7, formData);

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/produtos/7",
            {
                method: "POST",
                body: formData,
                credentials: "include"
            }
        );

        expect(resultado).toEqual(resposta);
    });

    it("retorna os dados da API quando a atualização retorna HTTP inválido", async () => {
        const resposta = { erro: "Atualização não permitida" };

        fetch.mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue(resposta)
        });

        expect(
            await API.atualizarProduto(7, new FormData())
        ).toEqual(resposta);

        expect(console.error).toHaveBeenCalledWith(
            "Erro ao atualizar produto:",
            resposta
        );
    });

    it("retorna objeto de erro quando ocorre falha de rede na atualização", async () => {
        const erro = new Error("Servidor indisponível");

        fetch.mockRejectedValue(erro);

        expect(
            await API.atualizarProduto(7, new FormData())
        ).toEqual({
            erro: "Falha na conexão com o servidor."
        });

        expect(console.error).toHaveBeenCalledWith(
            "Erro de rede ao atualizar produto:",
            erro
        );
    });
});
