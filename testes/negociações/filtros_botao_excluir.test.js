
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const {
    getCacheMock,
    renderOrdersMock,
    prepararConfirmacaoMock
} = vi.hoisted(() => ({
    getCacheMock: vi.fn(),
    renderOrdersMock: vi.fn(),
    prepararConfirmacaoMock: vi.fn()
}));

vi.mock("../../static/js/negociacoes/renderizacao.js", () => ({
    renderOrders: renderOrdersMock,
    getCacheNegociacoes: getCacheMock
}));

vi.mock("../../static/js/negociacoes/confirmacao.js", () => ({
    prepararConfirmacaoNegociacao: prepararConfirmacaoMock
}));

let filtros;
let exibirNotificacaoMock;
let consoleErrorMock;

function criarHTML() {
    document.body.innerHTML = `
        <input id="searchInput" type="text" value="">
        <select id="statusFilter">
            <option value="Todos">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Finalizado">Finalizado</option>
            <option value="ParaAvaliar">Para avaliar</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Recusado">Recusado</option>
        </select>
    `;
}

function criarPedidos() {
    return [
        {
            id: 1,
            produto_nome: "Tomate",
            negociante_nome: "João",
            status: "Pendente"
        },
        {
            id: 2,
            produto_nome: "Batata",
            negociante_nome: "Maria",
            status: "Finalizado",
            avaliacao: null
        },
        {
            id: 3,
            produto_nome: "Cenoura",
            negociante_nome: "Pedro",
            status: "Cancelado"
        },
        {
            id: 4,
            produto_nome: "Milho",
            negociante_nome: "Ana",
            status: "Recusado"
        },
        {
            id: 5,
            produto_nome: "Alface",
            negociante_nome: "João",
            status: "Finalizado",
            avaliacao: 5
        }
    ];
}

describe("Filtros e botão de excluir negociações", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        criarHTML();

        getCacheMock.mockReturnValue(criarPedidos());

        exibirNotificacaoMock = vi.fn();

        vi.stubGlobal(
            "exibirNotificacao",
            exibirNotificacaoMock
        );

        consoleErrorMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        filtros = await import(
            "../../static/js/negociacoes/filtros_botao_excluir.js"
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.body.innerHTML = "";
    });

    // =====================================================
    // EXCLUIR NEGOCIAÇÃO
    // =====================================================

    describe("deleteOrder", () => {
        it("deve preparar a confirmação para excluir o pedido encontrado", () => {
            filtros.deleteOrder(1);

            expect(getCacheMock).toHaveBeenCalled();

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "excluir",
                expect.objectContaining({
                    id: 1,
                    produto_nome: "Tomate"
                })
            );
        });

        it("deve encontrar o pedido mesmo quando o ID é uma string", () => {
            filtros.deleteOrder("2");

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "excluir",
                expect.objectContaining({
                    id: 2,
                    produto_nome: "Batata"
                })
            );
        });

        it("deve informar erro quando o pedido não existe", () => {
            filtros.deleteOrder(999);

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Negociação não encontrada:",
                999
            );

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Não foi possível encontrar o pedido."
            );

            expect(prepararConfirmacaoMock).not.toHaveBeenCalled();
        });

        it("deve funcionar quando o cache é nulo", () => {
            getCacheMock.mockReturnValue(null);

            filtros.deleteOrder(1);

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Negociação não encontrada:",
                1
            );

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Não foi possível encontrar o pedido."
            );

            expect(prepararConfirmacaoMock).not.toHaveBeenCalled();
        });

        it("deve funcionar quando o cache está vazio", () => {
            getCacheMock.mockReturnValue([]);

            filtros.deleteOrder(1);

            expect(prepararConfirmacaoMock).not.toHaveBeenCalled();

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Não foi possível encontrar o pedido."
            );
        });
    });

    // =====================================================
    // BUSCA POR TEXTO
    // =====================================================

    describe("applyFilters - busca", () => {
        it("deve exibir todos os pedidos quando a busca está vazia", () => {
            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith(
                criarPedidos()
            );
        });

        it("deve filtrar pelo nome do produto", () => {
            document.getElementById("searchInput").value = "tomate";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 1,
                    produto_nome: "Tomate"
                })
            ]);
        });

        it("deve filtrar pelo nome do negociante", () => {
            document.getElementById("searchInput").value = "maria";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 2,
                    negociante_nome: "Maria"
                })
            ]);
        });

        it("deve ignorar diferenças entre maiúsculas e minúsculas", () => {
            document.getElementById("searchInput").value = "TOMATE";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 1,
                    produto_nome: "Tomate"
                })
            ]);
        });

        it("deve retornar uma lista vazia quando não há correspondências", () => {
            document.getElementById("searchInput").value =
                "produto inexistente";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([]);
        });

        it("deve lidar com nomes de produto ou negociante ausentes", () => {
            getCacheMock.mockReturnValue([
                { id: 10, status: "Pendente" },
                {
                    id: 11,
                    produto_nome: "Tomate",
                    status: "Pendente"
                }
            ]);

            document.getElementById("searchInput").value = "tomate";

            expect(() => filtros.applyFilters()).not.toThrow();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 11 })
            ]);
        });
    });

    // =====================================================
    // FILTRO DE STATUS
    // =====================================================

    describe("applyFilters - status", () => {
        it("deve exibir todos os pedidos quando o status é Todos", () => {
            document.getElementById("statusFilter").value = "Todos";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith(
                criarPedidos()
            );
        });

        it("deve filtrar pedidos pendentes", () => {
            document.getElementById("statusFilter").value = "Pendente";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 1 })
            ]);
        });

        it("deve filtrar pedidos finalizados", () => {
            document.getElementById("statusFilter").value = "Finalizado";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 2 }),
                expect.objectContaining({ id: 5 })
            ]);
        });

        it("deve filtrar pedidos finalizados que ainda não foram avaliados", () => {
            document.getElementById("statusFilter").value =
                "ParaAvaliar";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 2 })
            ]);
        });

        it("deve considerar pedidos sem avaliação como pendentes de avaliação", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 10,
                    produto_nome: "Abóbora",
                    status: "Finalizado"
                }
            ]);

            document.getElementById("statusFilter").value =
                "ParaAvaliar";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 10 })
            ]);
        });

        it("deve incluir pedidos cancelados e recusados no filtro Cancelado", () => {
            document.getElementById("statusFilter").value = "Cancelado";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 3 }),
                expect.objectContaining({ id: 4 })
            ]);
        });

        it("deve filtrar pedidos recusados quando o status é Recusado", () => {
            document.getElementById("statusFilter").value = "Recusado";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 4 })
            ]);
        });

        it("deve combinar busca por texto e status", () => {
            document.getElementById("searchInput").value = "batata";
            document.getElementById("statusFilter").value = "Finalizado";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 2,
                    produto_nome: "Batata",
                    status: "Finalizado"
                })
            ]);
        });

        it("deve retornar lista vazia quando busca e status não correspondem", () => {
            document.getElementById("searchInput").value = "tomate";
            document.getElementById("statusFilter").value = "Finalizado";

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([]);
        });

        it("deve lidar com status ausente", () => {
            getCacheMock.mockReturnValue([
                { id: 10, produto_nome: "Tomate" }
            ]);

            document.getElementById("statusFilter").value = "Todos";

            expect(() => filtros.applyFilters()).not.toThrow();

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 10 })
            ]);
        });

        it("deve funcionar quando o cache é nulo", () => {
            getCacheMock.mockReturnValue(null);

            filtros.applyFilters();

            expect(renderOrdersMock).toHaveBeenCalledWith([]);
        });
    });

    // =====================================================
    // INICIALIZAÇÃO DOS FILTROS
    // =====================================================

    describe("initFilters", () => {
        it("deve aplicar os filtros ao digitar na busca", () => {
            filtros.initFilters();

            const searchInput = document.getElementById("searchInput");

            searchInput.value = "tomate";
            searchInput.dispatchEvent(
                new Event("input", { bubbles: true })
            );

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 1 })
            ]);
        });

        it("deve aplicar os filtros ao alterar o status", () => {
            filtros.initFilters();

            const statusFilter = document.getElementById("statusFilter");

            statusFilter.value = "Pendente";
            statusFilter.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(renderOrdersMock).toHaveBeenCalledWith([
                expect.objectContaining({ id: 1 })
            ]);
        });

        it("deve permitir inicialização sem os elementos do filtro", () => {
            document.getElementById("searchInput").remove();
            document.getElementById("statusFilter").remove();

            expect(() => filtros.initFilters()).not.toThrow();
        });

        it("não deve registrar os eventos duas vezes por uma única chamada", () => {
            const searchInput = document.getElementById("searchInput");
            const statusFilter = document.getElementById("statusFilter");

            const addSearchSpy = vi.spyOn(searchInput, "addEventListener");
            const addStatusSpy = vi.spyOn(statusFilter, "addEventListener");

            filtros.initFilters();

            expect(addSearchSpy).toHaveBeenCalledTimes(1);
            expect(addSearchSpy).toHaveBeenCalledWith(
                "input",
                filtros.applyFilters
            );

            expect(addStatusSpy).toHaveBeenCalledTimes(1);
            expect(addStatusSpy).toHaveBeenCalledWith(
                "change",
                filtros.applyFilters
            );
        });
    });
});
