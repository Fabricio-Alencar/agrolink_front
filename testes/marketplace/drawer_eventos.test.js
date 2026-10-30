
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

const { aplicarFiltrosMock } = vi.hoisted(() => ({
    aplicarFiltrosMock: vi.fn()
}));

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/filtros.js",
    () => ({
        aplicarFiltros: aplicarFiltrosMock
    })
);

describe("Eventos do Marketplace", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        document.body.innerHTML = `
            <input id="searchInput">

            <select id="filterCategory"></select>
            <select id="filterEstado"></select>
            <select id="filterCidade"></select>

            <input id="filterDistance">

            <button class="menu-icon"></button>
            <div id="drawerOverlay"></div>
            <div id="sideDrawer"></div>
        `;

        await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/drawer_eventos.js"
        );
    });

    it("deve aplicar filtros ao digitar na pesquisa", () => {
        document
            .getElementById("searchInput")
            .dispatchEvent(new Event("input"));

        expect(aplicarFiltrosMock).toHaveBeenCalledTimes(1);
    });

    it("deve aplicar filtros ao alterar a categoria", () => {
        document
            .getElementById("filterCategory")
            .dispatchEvent(new Event("change"));

        expect(aplicarFiltrosMock).toHaveBeenCalledTimes(1);
    });

    it("deve aplicar filtros ao alterar o estado", () => {
        document
            .getElementById("filterEstado")
            .dispatchEvent(new Event("change"));

        expect(aplicarFiltrosMock).toHaveBeenCalledTimes(1);
    });

    it("deve aplicar filtros ao alterar a cidade", () => {
        document
            .getElementById("filterCidade")
            .dispatchEvent(new Event("change"));

        expect(aplicarFiltrosMock).toHaveBeenCalledTimes(1);
    });

    it("não deve aplicar filtros ao alterar a distância", () => {
        document
            .getElementById("filterDistance")
            .dispatchEvent(new Event("input"));

        expect(aplicarFiltrosMock).not.toHaveBeenCalled();
    });
});
