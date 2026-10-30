
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

describe("DOM - Acesso aos elementos", () => {
    let DOM;
    let setProdutoSelecionado;
    let getProdutoSelecionado;

    beforeEach(async () => {
        vi.resetModules();

        // Simula os elementos utilizados pelo Marketplace.
        document.body.innerHTML = `
            <div id="productsGrid"></div>
            <span id="resultsCount"></span>

            <input id="searchInput">

            <select id="filterCategory"></select>
            <select id="filterEstado"></select>
            <select id="filterCidade"></select>

            <input id="filterDistance">
            <span id="distLabel"></span>

            <div id="orderModal"></div>

            <input id="inputQtd">
            <input id="inputData">
            <textarea id="inputDesc"></textarea>

            <button class="menu-icon"></button>
            <div id="drawerOverlay"></div>
            <div id="sideDrawer"></div>
            <button id="closeDrawerBtn"></button>
        `;

        // Importa depois de criar o HTML,
        // pois os elementos são capturados na importação.
        const modulo = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/acesso_a_elementos_DOM.js"
        );

        DOM = modulo.DOM;
        setProdutoSelecionado = modulo.setProdutoSelecionado;
        getProdutoSelecionado = modulo.getProdutoSelecionado;
    });

    it("deve acessar todos os elementos do Marketplace", () => {
        expect(DOM.grid).not.toBeNull();
        expect(DOM.resultsCount).not.toBeNull();
        expect(DOM.searchInput).not.toBeNull();

        expect(DOM.filterCat).not.toBeNull();
        expect(DOM.filterEstado).not.toBeNull();
        expect(DOM.filterCidade).not.toBeNull();
        expect(DOM.filterDist).not.toBeNull();

        expect(DOM.distLabel).not.toBeNull();
        expect(DOM.modal).not.toBeNull();

        expect(DOM.inputQtd).not.toBeNull();
        expect(DOM.inputData).not.toBeNull();
        expect(DOM.inputDesc).not.toBeNull();

        expect(DOM.menuBtn).not.toBeNull();
        expect(DOM.drawerOverlay).not.toBeNull();
        expect(DOM.sideDrawer).not.toBeNull();
        expect(DOM.closeDrawerBtn).not.toBeNull();
    });

    it("deve armazenar um produto selecionado", () => {
        const produto = {
            id: 1,
            nome: "Milho"
        };

        setProdutoSelecionado(produto);

        expect(getProdutoSelecionado()).toEqual(produto);
    });

    it("deve substituir o produto anteriormente selecionado", () => {
        const primeiro = { id: 1, nome: "Milho" };
        const segundo = { id: 2, nome: "Soja" };

        setProdutoSelecionado(primeiro);
        setProdutoSelecionado(segundo);

        expect(getProdutoSelecionado()).toEqual(segundo);
    });

    it("deve permitir selecionar null", () => {
        setProdutoSelecionado(null);

        expect(getProdutoSelecionado()).toBeNull();
    });
});
