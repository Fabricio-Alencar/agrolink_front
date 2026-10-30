
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const {
    listarProdutosMock,
    renderizarProdutosMock
} = vi.hoisted(() => ({
    listarProdutosMock: vi.fn(),
    renderizarProdutosMock: vi.fn()
}));

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/api.js",
    () => ({
        API: {
            listarProdutos: listarProdutosMock
        }
    })
);

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/renderizacao.js",
    () => ({
        renderizarProdutos: renderizarProdutosMock
    })
);

const produtos = [
    {
        id: 1,
        nome: "Milho",
        produtor_nome: "João",
        categoria: "Grãos",
        produtor_estado: "SP",
        produtor_cidade: "Campinas"
    },
    {
        id: 2,
        nome: "Soja",
        produtor_nome: "Maria",
        categoria: "Grãos",
        produtor_estado: "PR",
        produtor_cidade: "Londrina"
    },
    {
        id: 3,
        nome: "Café",
        produtor_nome: "José",
        categoria: "Bebidas",
        produtor_estado: "MG",
        produtor_cidade: "São Paulo"
    }
];

describe("Filtros do Marketplace", () => {
    let aplicarFiltros;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        document.body.innerHTML = `
            <input id="searchInput" value="">

            <select id="filterCategory">
                <option value="Todos">Todos</option>
                <option value="Grãos">Grãos</option>
                <option value="Bebidas">Bebidas</option>
            </select>

            <select id="filterEstado">
                <option value="">Todos</option>
                <option value="SP">SP</option>
                <option value="PR">PR</option>
                <option value="MG">MG</option>
            </select>

            <select id="filterCidade">
                <option value="">Todas</option>
                <option value="Campinas">Campinas</option>
                <option value="Londrina">Londrina</option>
                <option value="São Paulo">São Paulo</option>
            </select>

            <button id="btnLimparFiltros"></button>

            <div id="productsGrid"></div>
            <span id="resultsCount"></span>
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

        listarProdutosMock.mockResolvedValue(produtos);

        renderizarProdutosMock.mockResolvedValue(undefined);

        const modulo = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/filtros.js"
        );

        aplicarFiltros = modulo.aplicarFiltros;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("deve buscar os produtos na API na primeira aplicação", async () => {
        await aplicarFiltros();

        expect(listarProdutosMock).toHaveBeenCalledTimes(1);
    });

    it("deve renderizar todos os produtos sem filtros", async () => {
        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenCalledWith(produtos);
    });

    it("deve filtrar produtos pelo nome", async () => {
        document.getElementById("searchInput").value = "milho";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[0]
        ]);
    });

    it("deve filtrar produtos pelo nome do produtor", async () => {
        document.getElementById("searchInput").value = "Maria";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[1]
        ]);
    });

    it("deve ignorar diferenças entre maiúsculas e minúsculas", async () => {
        document.getElementById("searchInput").value = "MILHO";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[0]
        ]);
    });

    it("deve ignorar acentos na pesquisa", async () => {
        document.getElementById("searchInput").value = "cafe";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[2]
        ]);
    });

    it("deve filtrar pela categoria", async () => {
        document.getElementById("filterCategory").value = "Grãos";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[0],
            produtos[1]
        ]);
    });

    it("deve filtrar pelo estado", async () => {
        document.getElementById("filterEstado").value = "PR";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[1]
        ]);
    });

    it("deve filtrar pela cidade", async () => {
        document.getElementById("filterCidade").value = "Campinas";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[0]
        ]);
    });

    it("deve combinar pesquisa, categoria e localização", async () => {
        document.getElementById("searchInput").value = "milho";
        document.getElementById("filterCategory").value = "Grãos";
        document.getElementById("filterEstado").value = "SP";
        document.getElementById("filterCidade").value = "Campinas";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([
            produtos[0]
        ]);
    });

    it("deve retornar lista vazia quando nenhum produto corresponde aos filtros", async () => {
        document.getElementById("searchInput").value = "Arroz";

        await aplicarFiltros();

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith([]);
    });

    it("deve utilizar o cache nas aplicações seguintes", async () => {
        await aplicarFiltros();
        await aplicarFiltros();
        await aplicarFiltros();

        expect(listarProdutosMock).toHaveBeenCalledTimes(1);
        expect(renderizarProdutosMock).toHaveBeenCalledTimes(3);
    });

    it("deve limpar todos os filtros ao clicar no botão", async () => {
        await aplicarFiltros();

        const pesquisa = document.getElementById("searchInput");
        const categoria = document.getElementById("filterCategory");
        const estado = document.getElementById("filterEstado");
        const cidade = document.getElementById("filterCidade");

        pesquisa.value = "Milho";
        categoria.value = "Grãos";
        estado.value = "SP";
        cidade.value = "Campinas";

        document.getElementById("btnLimparFiltros").click();

        await vi.waitFor(() => {
            expect(pesquisa.value).toBe("");
            expect(categoria.value).toBe("Todos");
            expect(estado.value).toBe("");
            expect(cidade.value).toBe("");
        });

        expect(listarProdutosMock).toHaveBeenCalledTimes(1);

        expect(renderizarProdutosMock).toHaveBeenLastCalledWith(produtos);
    });

    it("deve limpar a cidade ao alterar o estado", async () => {
        await aplicarFiltros();

        const cidade = document.getElementById("filterCidade");
        const estado = document.getElementById("filterEstado");

        cidade.value = "Campinas";
        estado.value = "PR";

        estado.dispatchEvent(new Event("change"));

        expect(cidade.value).toBe("");
    });

    it("deve tratar erros durante a aplicação dos filtros", async () => {
        const erro = new Error("Falha ao renderizar");

        renderizarProdutosMock.mockRejectedValueOnce(erro);

        const consoleErrorMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await aplicarFiltros();

        expect(consoleErrorMock).toHaveBeenCalledWith(
            "Erro filtro:",
            erro
        );
    });
});
