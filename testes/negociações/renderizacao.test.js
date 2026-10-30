
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const {
    showDetailsMock,
    deleteOrderMock,
    listarNegociacoesMock,
    criarPaginacaoMock,
    atualizarPaginacaoMock,
    prepararConfirmacaoMock,
    proximaAcaoHTMLMock,
    acaoPrincipalMock,
    executarConfirmacaoMock,
    dataDoPedidoMock,
    nomeNegocianteHTMLMock,
    abrirAvaliacaoMock,
    estadoPaginacao,
    createIconsMock
} = vi.hoisted(() => ({
    showDetailsMock: vi.fn(),
    deleteOrderMock: vi.fn(),
    listarNegociacoesMock: vi.fn(),
    criarPaginacaoMock: vi.fn(),
    atualizarPaginacaoMock: vi.fn(),
    prepararConfirmacaoMock: vi.fn(),
    proximaAcaoHTMLMock: vi.fn(),
    acaoPrincipalMock: vi.fn(),
    executarConfirmacaoMock: vi.fn(),
    dataDoPedidoMock: vi.fn(),
    nomeNegocianteHTMLMock: vi.fn(),
    abrirAvaliacaoMock: vi.fn(),
    estadoPaginacao: {
        configuracao: null
    },
    createIconsMock: vi.fn()
}));

vi.mock("../../static/js/negociacoes/navegacao.js", () => ({
    showDetails: showDetailsMock
}));

vi.mock("../../static/js/negociacoes/filtros_botao_excluir.js", () => ({
    deleteOrder: deleteOrderMock
}));

vi.mock("../../static/js/negociacoes/api.js", () => ({
    API: {
        listarNegociacoes: listarNegociacoesMock
    }
}));

vi.mock("../../static/js/paginacao.js", () => ({
    criarPaginacao: criarPaginacaoMock
}));

vi.mock("../../static/js/negociacoes/confirmacao.js", () => ({
    prepararConfirmacaoNegociacao: prepararConfirmacaoMock
}));

vi.mock("../../static/js/negociacoes/acompanhamento.js", () => ({
    proximaAcaoHTML: proximaAcaoHTMLMock,
    acaoPrincipal: acaoPrincipalMock,
    executarConfirmacao: executarConfirmacaoMock,
    dataDoPedido: dataDoPedidoMock,
    nomeNegocianteHTML: nomeNegocianteHTMLMock,
    abrirAvaliacao: abrirAvaliacaoMock
}));

const CAMINHO_RENDERIZACAO =
    "../../static/js/negociacoes/renderizacao.js";

let renderizacao;
let consoleErrorMock;

function criarPedido(dados = {}) {
    return {
        id: 1,
        status: "Pendente",
        produto_nome: "Milho",
        produto_unidade: "kg",
        produto_preco: 5.5,
        quantidade: 100,
        descricao: "Milho de boa qualidade",
        data_entrega: "2026-11-10",
        negociante_cidade: "Campinas",
        negociante_estado: "SP",
        data_criacao: "2026-10-20",
        data_atualizacao: "2026-10-21",
        ...dados
    };
}

function criarGrid() {
    document.body.innerHTML = `
        <div id="orders-grid"></div>
    `;

    return document.getElementById("orders-grid");
}

describe("Renderização das negociações", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        document.body.innerHTML = "";

        vi.stubGlobal("window", {
            location: {
                href: "/negociacoes/produtor"
            },
            lucide: {
                createIcons: createIconsMock
            }
        });

        vi.stubGlobal("lucide", {
            createIcons: createIconsMock
        });

        estadoPaginacao.configuracao = null;

        criarPaginacaoMock.mockImplementation((configuracao) => {
            estadoPaginacao.configuracao = configuracao;

            return {
                atualizar: atualizarPaginacaoMock
            };
        });

        listarNegociacoesMock.mockResolvedValue([]);

        proximaAcaoHTMLMock.mockReturnValue("");
        acaoPrincipalMock.mockReturnValue(null);
        dataDoPedidoMock.mockReturnValue("20/10/2026");
        nomeNegocianteHTMLMock.mockReturnValue("João da Silva");

        consoleErrorMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        renderizacao = await import(CAMINHO_RENDERIZACAO);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    // ==========================================
    // CRIAÇÃO DO CARD
    // ==========================================

    describe("criarCardNegociacao", () => {
        it("deve criar um card com os dados do pedido", () => {
            const pedido = criarPedido();

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            expect(card.className).toBe("card");
            expect(card.textContent).toContain("Milho");
            expect(card.textContent).toContain("100");
            expect(card.textContent).toContain("R$ 5.5");
            expect(card.textContent).toContain("Milho de boa qualidade");
            expect(card.textContent).toContain("João da Silva");
            expect(card.textContent).toContain("Pendente");
        });

        it("deve mostrar uma descrição padrão quando não houver descrição", () => {
            const pedido = criarPedido({
                descricao: ""
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            expect(card.textContent).toContain("Sem descrição");
        });

        it("deve mostrar A combinar quando não houver data de entrega", () => {
            const pedido = criarPedido({
                data_entrega: null
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            expect(card.textContent).toContain("A combinar");
        });

        it("deve usar pendente quando o status não estiver definido", () => {
            const pedido = criarPedido({
                status: null
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            expect(card.querySelector(".badge").className)
                .toContain("pendente");
        });

        it("deve exibir o botão Recusar para produtor com pedido pendente", () => {
            const card = renderizacao.criarCardNegociacao(
                criarPedido({ status: "Pendente" }),
                "produtor"
            );

            expect(
                card.querySelector(".btn-acao-secundaria").textContent
            ).toContain("Recusar");
        });

        it("deve exibir o botão Cancelar para estabelecimento com pedido pendente", () => {
            const card = renderizacao.criarCardNegociacao(
                criarPedido({ status: "Pendente" }),
                "estabelecimento"
            );

            expect(
                card.querySelector(".btn-acao-secundaria").textContent
            ).toContain("Cancelar");
        });

        it("deve permitir cancelar um pedido aceito", () => {
            const card = renderizacao.criarCardNegociacao(
                criarPedido({ status: "Aceito" }),
                "produtor"
            );

            expect(
                card.querySelector(".btn-acao-secundaria").textContent
            ).toContain("Cancelar");
        });

        it.each([
            "Recusado",
            "Cancelado",
            "Finalizado"
        ])("deve exibir o botão de excluir para status %s", (status) => {
            const card = renderizacao.criarCardNegociacao(
                criarPedido({ status }),
                "produtor"
            );

            expect(card.querySelector(".btn-delete")).not.toBeNull();
            expect(card.querySelector(".btn-acao-secundaria")).toBeNull();
        });

        it("não deve exibir botão de ação secundária para pedido entregue", () => {
            const card = renderizacao.criarCardNegociacao(
                criarPedido({ status: "Entregue" }),
                "produtor"
            );

            expect(card.querySelector(".btn-acao-secundaria")).toBeNull();
            expect(card.querySelector(".btn-delete")).toBeNull();
        });

        it("deve chamar showDetails ao clicar em Detalhes", () => {
            const pedido = criarPedido({ id: 42 });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            card.querySelector(".btn-details").click();

            expect(showDetailsMock).toHaveBeenCalledWith(
                42,
                "produtor"
            );
        });

        it("deve preparar a recusa ao clicar em Recusar", () => {
            const pedido = criarPedido({
                status: "Pendente"
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            card.querySelector(".btn-acao-secundaria").click();

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "recusar",
                pedido,
                "Recusado"
            );
        });

        it("deve preparar o cancelamento de pedido pendente do estabelecimento", () => {
            const pedido = criarPedido({
                status: "Pendente"
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "estabelecimento"
            );

            card.querySelector(".btn-acao-secundaria").click();

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "cancelar",
                pedido,
                "Cancelado"
            );
        });

        it("deve excluir o histórico ao clicar na lixeira", () => {
            const pedido = criarPedido({
                id: 99,
                status: "Finalizado"
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            card.querySelector(".btn-delete").click();

            expect(deleteOrderMock).toHaveBeenCalledWith(99);
        });

        it("deve preparar a confirmação ao clicar na ação principal aceitar", () => {
            const pedido = criarPedido();

            acaoPrincipalMock.mockReturnValue({
                acao: "aceitar",
                texto: "Aceitar"
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            card.querySelector('[data-acao="aceitar"]').click();

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "aceitar",
                pedido,
                "Aceito"
            );
        });

        it("deve abrir a avaliação ao clicar na ação avaliar", () => {
            const pedido = criarPedido();

            acaoPrincipalMock.mockReturnValue({
                acao: "avaliar",
                texto: "Avaliar"
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            card.querySelector('[data-acao="avaliar"]').click();

            expect(abrirAvaliacaoMock).toHaveBeenCalledWith(pedido);
            expect(
                card.querySelector(".btn-avaliar-card")
            ).not.toBeNull();
        });

        it("deve desabilitar o botão antes de executar a confirmação", () => {
            const pedido = criarPedido();

            acaoPrincipalMock.mockReturnValue({
                acao: "confirmar_entrega",
                texto: "Confirmar entrega"
            });

            const card = renderizacao.criarCardNegociacao(
                pedido,
                "produtor"
            );

            const botao = card.querySelector('[data-acao]');

            botao.click();

            expect(botao.disabled).toBe(true);
            expect(executarConfirmacaoMock).toHaveBeenCalledWith(
                pedido,
                "produtor"
            );
        });
    });

    // ==========================================
    // RENDERIZAÇÃO DA LISTA
    // ==========================================

    describe("renderOrders", () => {
        it("deve encerrar sem buscar pedidos quando o grid não existe", async () => {
            await renderizacao.renderOrders();

            expect(listarNegociacoesMock).not.toHaveBeenCalled();
        });

        it("deve buscar as negociações na API quando não há cache nem lista externa", async () => {
            criarGrid();

            listarNegociacoesMock.mockResolvedValue([
                criarPedido()
            ]);

            await renderizacao.renderOrders(null, "produtor");

            expect(listarNegociacoesMock).toHaveBeenCalledWith("produtor");
        });

        it("deve exibir mensagem quando não há pedidos cadastrados", async () => {
            const grid = criarGrid();

            listarNegociacoesMock.mockResolvedValue([]);

            await renderizacao.renderOrders();

            expect(grid.textContent).toContain("Nenhum pedido cadastrado");
        });

        it("deve exibir mensagem de nenhum resultado para lista externa vazia", async () => {
            const grid = criarGrid();

            await renderizacao.renderOrders([], "produtor");

            expect(grid.textContent).toContain("Nenhum resultado encontrado");
            expect(listarNegociacoesMock).not.toHaveBeenCalled();
        });

        it("deve exibir mensagem de erro quando a API falhar", async () => {
            const grid = criarGrid();

            listarNegociacoesMock.mockRejectedValue(
                new Error("Falha na API")
            );

            await renderizacao.renderOrders(null, "produtor");

            expect(grid.textContent).toContain(
                "Não foi possível carregar os pedidos"
            );

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "Erro ao carregar negociações:",
                expect.objectContaining({
                    message: "Falha na API"
                })
            );
        });

        it("deve criar a paginação para uma lista com pedidos", async () => {
            criarGrid();

            const pedidos = [
                criarPedido({ id: 1 }),
                criarPedido({ id: 2 })
            ];

            await renderizacao.renderOrders(pedidos, "produtor");

            expect(criarPaginacaoMock).toHaveBeenCalledTimes(1);

            expect(criarPaginacaoMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    itensPorPagina: 12,
                    aoMudarPagina: expect.any(Function)
                })
            );

            expect(atualizarPaginacaoMock).toHaveBeenCalledWith(
                expect.arrayContaining(pedidos)
            );
        });

        it("deve ordenar os pedidos pela atualização mais recente", async () => {
            criarGrid();

            const pedidoAntigo = criarPedido({
                id: 1,
                data_atualizacao: "2026-10-10"
            });

            const pedidoNovo = criarPedido({
                id: 2,
                data_atualizacao: "2026-10-25"
            });

            await renderizacao.renderOrders(
                [pedidoAntigo, pedidoNovo],
                "produtor"
            );

            const listaOrdenada =
                atualizarPaginacaoMock.mock.calls[0][0];

            expect(listaOrdenada[0].id).toBe(2);
            expect(listaOrdenada[1].id).toBe(1);
        });

        it("deve usar o ID como critério de desempate na ordenação", async () => {
            criarGrid();

            const pedidoMenorId = criarPedido({
                id: 1,
                data_atualizacao: "2026-10-20"
            });

            const pedidoMaiorId = criarPedido({
                id: 5,
                data_atualizacao: "2026-10-20"
            });

            await renderizacao.renderOrders(
                [pedidoMenorId, pedidoMaiorId],
                "produtor"
            );

            const listaOrdenada =
                atualizarPaginacaoMock.mock.calls[0][0];

            expect(listaOrdenada[0].id).toBe(5);
            expect(listaOrdenada[1].id).toBe(1);
        });

        it("deve renderizar os cards ao mudar a página", async () => {
            const grid = criarGrid();

            const pedido = criarPedido({
                id: 10
            });

            await renderizacao.renderOrders(
                [pedido],
                "produtor"
            );

            expect(estadoPaginacao.configuracao).not.toBeNull();

            estadoPaginacao.configuracao.aoMudarPagina({
                itens: [pedido]
            });

            expect(grid.querySelectorAll(".card")).toHaveLength(1);
            expect(grid.textContent).toContain("Milho");
        });

        it("deve ocultar a paginação quando não há resultados", async () => {
            criarGrid();

            await renderizacao.renderOrders(
                [criarPedido()],
                "produtor"
            );

            const host = document.querySelector(
                ".area-controles-paginacao"
            );

            expect(host.hidden).toBe(false);

            await renderizacao.renderOrders([], "produtor");

            expect(host.hidden).toBe(true);
        });

        it("deve chamar a atualização dos ícones após renderizar os cards", async () => {
            criarGrid();

            const pedido = criarPedido();

            await renderizacao.renderOrders(
                [pedido],
                "produtor"
            );

            estadoPaginacao.configuracao.aoMudarPagina({
                itens: [pedido]
            });

            expect(createIconsMock).toHaveBeenCalled();
        });

        it("deve identificar o estabelecimento pela URL quando o tipo não for informado", async () => {
            criarGrid();

            window.location.href = "/negociacoes/estabelecimento";

            listarNegociacoesMock.mockResolvedValue([
                criarPedido()
            ]);

            await renderizacao.renderOrders();

            expect(listarNegociacoesMock).toHaveBeenCalledWith(
                "estabelecimento"
            );
        });
    });

    // ==========================================
    // CACHE
    // ==========================================

    describe("getCacheNegociacoes", () => {
        it("deve retornar null antes de buscar os pedidos", () => {
            expect(
                renderizacao.getCacheNegociacoes()
            ).toBeNull();
        });

        it("deve retornar os pedidos armazenados após a busca na API", async () => {
            criarGrid();

            const pedidos = [
                criarPedido({ id: 1 })
            ];

            listarNegociacoesMock.mockResolvedValue(pedidos);

            await renderizacao.renderOrders(null, "produtor");

            expect(
                renderizacao.getCacheNegociacoes()
            ).toEqual(pedidos);
        });

        it("deve reutilizar o cache em chamadas posteriores", async () => {
            criarGrid();

            const pedidos = [
                criarPedido({ id: 1 })
            ];

            listarNegociacoesMock.mockResolvedValue(pedidos);

            await renderizacao.renderOrders(null, "produtor");
            await renderizacao.renderOrders(null, "produtor");

            expect(listarNegociacoesMock).toHaveBeenCalledTimes(1);
        });
    });
});
