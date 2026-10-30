
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const {
    renderizarProdutosMock,
    destacarProdutoPorIdMock,
    fecharModalMock,
    emitirPedidoMock,
    abrirModalMock
} = vi.hoisted(() => ({
    renderizarProdutosMock: vi.fn(),
    destacarProdutoPorIdMock: vi.fn(),
    fecharModalMock: vi.fn(),
    emitirPedidoMock: vi.fn(),
    abrirModalMock: vi.fn()
}));

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/renderizacao.js",
    () => ({
        renderizarProdutos: renderizarProdutosMock,
        destacarProdutoPorId: destacarProdutoPorIdMock
    })
);

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/modal.js",
    () => ({
        fecharModal: fecharModalMock,
        emitirPedido: emitirPedidoMock,
        abrirModal: abrirModalMock
    })
);

// Simula os módulos carregados apenas por seus efeitos colaterais.
vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/filtros.js",
    () => ({})
);

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/localizacao.js",
    () => ({})
);

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/drawer_eventos.js",
    () => ({})
);

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/filtro_persiana.js",
    () => ({})
);

vi.mock("../../static/js/paginacao.js", () => ({}));

describe("Main do Marketplace", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        renderizarProdutosMock.mockResolvedValue(undefined);
        destacarProdutoPorIdMock.mockResolvedValue(undefined);

        // Garante que não exista parâmetro de produto inicialmente.
        window.history.replaceState({}, "", "/marketplace");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("deve renderizar os produtos ao iniciar", async () => {
        await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/main.js"
        );

        expect(renderizarProdutosMock).toHaveBeenCalledTimes(1);
        expect(renderizarProdutosMock).toHaveBeenCalledWith();
    });

    it("deve disponibilizar fecharModal no escopo global", async () => {
        await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/main.js"
        );

        expect(window.fecharModal).toBe(fecharModalMock);
    });

    it("deve disponibilizar emitirPedido no escopo global", async () => {
        await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/main.js"
        );

        expect(window.emitirPedido).toBe(emitirPedidoMock);
    });

    it("deve disponibilizar abrirModal no escopo global", async () => {
        await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/main.js"
        );

        expect(window.abrirModal).toBe(abrirModalMock);
    });

    it("deve destacar o produto quando existe parâmetro na URL", async () => {
        window.history.replaceState(
            {},
            "",
            "/marketplace?produto=15"
        );

        await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/main.js"
        );

        expect(renderizarProdutosMock).toHaveBeenCalledTimes(1);

        expect(destacarProdutoPorIdMock).toHaveBeenCalledWith("15");
    });

    it("não deve destacar produto quando não existe parâmetro na URL", async () => {
        window.history.replaceState(
            {},
            "",
            "/marketplace"
        );

        await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/main.js"
        );

        expect(destacarProdutoPorIdMock).not.toHaveBeenCalled();
    });
});
