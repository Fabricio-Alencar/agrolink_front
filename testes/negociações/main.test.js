
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const {
    authGetMock,
    authGetTypeMock,
    importarProdutorMock,
    importarEstabelecimentoMock
} = vi.hoisted(() => ({
    authGetMock: vi.fn(),
    authGetTypeMock: vi.fn(),
    importarProdutorMock: vi.fn(),
    importarEstabelecimentoMock: vi.fn()
}));

const CAMINHO_MAIN =
    "../../static/js/negociacoes/main.js";

const CAMINHO_PRODUTOR =
    "../../static/js/negociacoes/main_produtor.js";

const CAMINHO_ESTABELECIMENTO =
    "../../static/js/negociacoes/main_estabelecimento.js";

let consoleErrorMock;

async function importarMain() {
    await import(CAMINHO_MAIN);
}

describe("Main das negociações", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        // Simula a autenticação
        vi.stubGlobal("Auth", {
            get: authGetMock,
            getType: authGetTypeMock
        });

        // Simula o redirecionamento sem navegação real do jsdom
        vi.stubGlobal("window", {
            location: {
                href: "/"
            }
        });

        // Simula o módulo do produtor
        vi.doMock(CAMINHO_PRODUTOR, () => {
            importarProdutorMock();
            return {};
        });

        // Simula o módulo do estabelecimento
        vi.doMock(CAMINHO_ESTABELECIMENTO, () => {
            importarEstabelecimentoMock();
            return {};
        });

        // Captura os erros do console
        consoleErrorMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        authGetMock.mockReturnValue({ id: 1 });
        authGetTypeMock.mockReturnValue("produtor");
    });

    afterEach(() => {
        vi.doUnmock(CAMINHO_PRODUTOR);
        vi.doUnmock(CAMINHO_ESTABELECIMENTO);

        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("autenticação", () => {
        it("deve redirecionar para login quando não existe usuário", async () => {
            authGetMock.mockReturnValue(null);

            await importarMain();

            expect(authGetMock).toHaveBeenCalledTimes(1);
            expect(authGetTypeMock).not.toHaveBeenCalled();
            expect(window.location.href).toBe("/login");

            expect(importarProdutorMock).not.toHaveBeenCalled();
            expect(importarEstabelecimentoMock).not.toHaveBeenCalled();
        });

        it("deve consultar o tipo quando o usuário está autenticado", async () => {
            authGetMock.mockReturnValue({ id: 1 });
            authGetTypeMock.mockReturnValue("produtor");

            await importarMain();

            expect(authGetMock).toHaveBeenCalledTimes(1);
            expect(authGetTypeMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("carregamento por tipo de usuário", () => {
        it("deve carregar o módulo do produtor", async () => {
            authGetTypeMock.mockReturnValue("produtor");

            await importarMain();

            expect(importarProdutorMock).toHaveBeenCalledTimes(1);
            expect(importarEstabelecimentoMock).not.toHaveBeenCalled();
        });

        it("deve carregar o módulo do estabelecimento", async () => {
            authGetTypeMock.mockReturnValue("estabelecimento");

            await importarMain();

            expect(importarEstabelecimentoMock).toHaveBeenCalledTimes(1);
            expect(importarProdutorMock).not.toHaveBeenCalled();
        });

        it("deve redirecionar para login quando o tipo é inválido", async () => {
            authGetTypeMock.mockReturnValue("administrador");

            await importarMain();

            expect(window.location.href).toBe("/login");
            expect(importarProdutorMock).not.toHaveBeenCalled();
            expect(importarEstabelecimentoMock).not.toHaveBeenCalled();
        });

        it("deve redirecionar para login quando o tipo é nulo", async () => {
            authGetTypeMock.mockReturnValue(null);

            await importarMain();

            expect(window.location.href).toBe("/login");
            expect(importarProdutorMock).not.toHaveBeenCalled();
            expect(importarEstabelecimentoMock).not.toHaveBeenCalled();
        });
    });


describe("tratamento de erros", () => {
    it("deve registrar erro quando o módulo do produtor falha", async () => {
        vi.doMock(CAMINHO_PRODUTOR, () => {
            throw new Error("Falha ao carregar pedidos");
        });

        authGetTypeMock.mockReturnValue("produtor");

        vi.resetModules();

        await importarMain();

        expect(consoleErrorMock).toHaveBeenCalledTimes(1);

        const [mensagem, erro] = consoleErrorMock.mock.calls[0];

        expect(mensagem).toBe("Erro ao carregar pedidos:");
        expect(erro).toBeInstanceOf(Error);
        expect(erro.cause).toBeInstanceOf(Error);
        expect(erro.cause.message).toBe("Falha ao carregar pedidos");
    });

    it("deve registrar erro quando o módulo do estabelecimento falha", async () => {
        vi.doMock(CAMINHO_ESTABELECIMENTO, () => {
            throw new Error("Falha ao carregar estabelecimento");
        });

        authGetTypeMock.mockReturnValue("estabelecimento");

        vi.resetModules();

        await importarMain();

        expect(consoleErrorMock).toHaveBeenCalledTimes(1);

        const [mensagem, erro] = consoleErrorMock.mock.calls[0];

        expect(mensagem).toBe("Erro ao carregar pedidos:");
        expect(erro).toBeInstanceOf(Error);
        expect(erro.cause).toBeInstanceOf(Error);
        expect(erro.cause.message).toBe(
            "Falha ao carregar estabelecimento"
        );
    });
});

});