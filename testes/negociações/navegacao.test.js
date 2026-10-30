
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const {
    getCacheNegociacoesMock,
    prepararConfirmacaoMock,
    linhaDoTempoHTMLMock,
    avaliacaoHTMLMock,
    abrirAvaliacaoMock,
    nomeNegocianteHTMLMock,
    executarConfirmacaoMock,
    exibirNotificacaoMock,
    resumoAvaliacaoMock
} = vi.hoisted(() => ({
    getCacheNegociacoesMock: vi.fn(),
    prepararConfirmacaoMock: vi.fn(),
    linhaDoTempoHTMLMock: vi.fn(),
    avaliacaoHTMLMock: vi.fn(),
    abrirAvaliacaoMock: vi.fn(),
    nomeNegocianteHTMLMock: vi.fn(),
    executarConfirmacaoMock: vi.fn(),
    exibirNotificacaoMock: vi.fn(),
    resumoAvaliacaoMock: vi.fn()
}));

vi.mock("../../static/js/negociacoes/renderizacao.js", () => ({
    getCacheNegociacoes: getCacheNegociacoesMock
}));

vi.mock("../../static/js/negociacoes/confirmacao.js", () => ({
    prepararConfirmacaoNegociacao: prepararConfirmacaoMock
}));

vi.mock("../../static/js/negociacoes/acompanhamento.js", () => ({
    linhaDoTempoHTML: linhaDoTempoHTMLMock,
    avaliacaoHTML: avaliacaoHTMLMock,
    abrirAvaliacao: abrirAvaliacaoMock,
    nomeNegocianteHTML: nomeNegocianteHTMLMock,
    executarConfirmacao: executarConfirmacaoMock
}));

const CAMINHO =
    "../../static/js/negociacoes/navegacao.js";

let navegacao;
let consoleErrorMock;
let consoleLogMock;
let fetchMock;
let scrollToMock;

function criarPedido(dados = {}) {
    return {
        id: 1,
        status: "Pendente",
        produto_nome: "Milho",
        produto_foto: "",
        quantidade: 100,
        produto_preco: 5.5,
        data_entrega: "2026-11-10",
        descricao: "Pedido de milho",
        negociante_nome: "João da Silva",
        negociante_telefone: "11987654321",
        negociante_email: "joao@example.com",
        negociante_cidade: "Campinas",
        negociante_estado: "SP",
        ...dados
    };
}

function prepararHTML() {
    document.body.innerHTML = `
        <div id="view-lista" style="display: block"></div>

        <div id="view-calendario" style="display: none"></div>

        <div id="view-detalhes" style="display: none">
            <div id="details-content"></div>
        </div>
    `;
}

async function clicar(id) {
    const botao = document.getElementById(id);

    expect(botao).not.toBeNull();

    botao.click();

    // Permite que os handlers assíncronos avancem.
    await new Promise(resolve => setTimeout(resolve, 0));

    return botao;
}

describe("Navegação das negociações", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        prepararHTML();

        vi.stubGlobal("CONFIG", {
            API_URL: "http://localhost:8000"
        });

        vi.stubGlobal("window", {
            location: {
                href: "/negociacoes"
            },
            scrollTo: vi.fn(),
            lucide: {
                createIcons: vi.fn()
            },
            veioDoCalendario: false,
            Avaliacoes: {
                resumo: resumoAvaliacaoMock
            }
        });

        scrollToMock = window.scrollTo;

        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        vi.stubGlobal(
            "exibirNotificacao",
            exibirNotificacaoMock
        );

        getCacheNegociacoesMock.mockReturnValue([
            criarPedido()
        ]);

        linhaDoTempoHTMLMock.mockReturnValue(
            '<div class="linha-tempo">Linha do tempo</div>'
        );

        avaliacaoHTMLMock.mockReturnValue(
            '<button id="btnAbrirAvaliacao">Avaliar</button>'
        );

        nomeNegocianteHTMLMock.mockReturnValue("João da Silva");

        resumoAvaliacaoMock.mockReturnValue(
            '<span class="resumo-avaliacao">Sem avaliações</span>'
        );

        consoleErrorMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        consoleLogMock = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});

        navegacao = await import(CAMINHO);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("showDetails", () => {
        it("deve exibir os detalhes e ocultar a lista e o calendário", () => {
            navegacao.showDetails(1, "produtor");

            expect(
                document.getElementById("view-lista").style.display
            ).toBe("none");

            expect(
                document.getElementById("view-calendario").style.display
            ).toBe("none");

            expect(
                document.getElementById("view-detalhes").style.display
            ).toBe("block");
        });

        it("deve renderizar os dados da negociação", () => {
            navegacao.showDetails(1, "produtor");

            const detalhes = document.getElementById("details-content");

            expect(detalhes.textContent).toContain("Detalhes do Pedido");
            expect(detalhes.textContent).toContain("Milho");
            expect(detalhes.textContent).toContain("100");
            expect(detalhes.textContent).toContain("João da Silva");
            expect(detalhes.textContent).toContain("Pedido de milho");
        });

        it("deve aceitar o ID numérico mesmo quando recebido como texto", () => {
            navegacao.showDetails("1", "produtor");

            expect(
                document.getElementById("view-detalhes").style.display
            ).toBe("block");
        });

        it("deve registrar erro quando a negociação não existe no cache", () => {
            getCacheNegociacoesMock.mockReturnValue([]);

            navegacao.showDetails(999, "produtor");

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Negociação não encontrada no cache.",
                999
            );

            expect(
                document.getElementById("view-detalhes").style.display
            ).toBe("none");
        });

        it("deve registrar erro quando o container de detalhes não existe", () => {
            document.getElementById("details-content").remove();

            navegacao.showDetails(1, "produtor");

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Elementos de view não encontrados."
            );
        });

        it("deve exibir os botões aceitar e recusar para produtor com pedido pendente", () => {
            navegacao.showDetails(1, "produtor");

            expect(
                document.getElementById("btnAceitar")
            ).not.toBeNull();

            expect(
                document.getElementById("btnRecusar")
            ).not.toBeNull();
        });

        it("deve exibir o botão cancelar para estabelecimento com pedido pendente", () => {
            navegacao.showDetails(1, "estabelecimento");

            expect(
                document.getElementById("btnCancelar")
            ).not.toBeNull();

            expect(
                document.getElementById("btnAceitar")
            ).toBeNull();

            expect(resumoAvaliacaoMock).toHaveBeenCalled();
        });

        it("deve preparar a confirmação ao aceitar um pedido", async () => {
            const pedido = criarPedido();

            getCacheNegociacoesMock.mockReturnValue([pedido]);

            navegacao.showDetails(1, "produtor");

            await clicar("btnAceitar");

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "aceitar",
                pedido,
                "Aceito"
            );
        });

        it("deve preparar a confirmação ao recusar um pedido", async () => {
            const pedido = criarPedido();

            getCacheNegociacoesMock.mockReturnValue([pedido]);

            navegacao.showDetails(1, "produtor");

            await clicar("btnRecusar");

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "recusar",
                pedido,
                "Recusado"
            );
        });

        it("deve preparar a confirmação ao cancelar um pedido", async () => {
            const pedido = criarPedido();

            getCacheNegociacoesMock.mockReturnValue([pedido]);

            navegacao.showDetails(1, "estabelecimento");

            await clicar("btnCancelar");

            expect(prepararConfirmacaoMock).toHaveBeenCalledWith(
                "cancelar",
                pedido,
                "Cancelado"
            );
        });

        it("deve usar a foto genérica quando não existe foto do produto", () => {
            navegacao.showDetails(1, "produtor");

            const imagem = document.querySelector(".product-img");

            expect(imagem).not.toBeNull();
            expect(imagem.getAttribute("src")).toContain(
                "produto_generico.png"
            );
        });

        it("deve chamar a criação dos ícones quando Lucide está disponível", () => {
            navegacao.showDetails(1, "produtor");

            expect(window.lucide.createIcons).toHaveBeenCalled();
        });

        it("deve voltar a rolagem para o topo", () => {
            navegacao.showDetails(1, "produtor");

            expect(scrollToMock).toHaveBeenCalledWith(0, 0);
        });

        it("deve mostrar confirmação de entrega para produtor com pedido aceito", () => {
            getCacheNegociacoesMock.mockReturnValue([
                criarPedido({ status: "Aceito" })
            ]);

            navegacao.showDetails(1, "produtor");

            const botao = document.getElementById("btnConfirmarAcao");

            expect(botao).not.toBeNull();
            expect(botao.textContent).toContain("Confirmar Entrega");
        });

        it("deve mostrar confirmação de recebimento para estabelecimento com pedido aceito", () => {
            getCacheNegociacoesMock.mockReturnValue([
                criarPedido({ status: "Aceito" })
            ]);

            navegacao.showDetails(1, "estabelecimento");

            const botao = document.getElementById("btnConfirmarAcao");

            expect(botao).not.toBeNull();
            expect(botao.textContent).toContain("Confirmar Recebimento");
            expect(resumoAvaliacaoMock).toHaveBeenCalled();
        });

        it("deve executar a confirmação ao confirmar entrega", async () => {
            const pedido = criarPedido({ status: "Aceito" });

            getCacheNegociacoesMock.mockReturnValue([pedido]);

            navegacao.showDetails(1, "produtor");

            await clicar("btnConfirmarAcao");

            expect(executarConfirmacaoMock).toHaveBeenCalledWith(
                pedido,
                "produtor"
            );
        });

        it("deve desabilitar a confirmação quando a entrega já foi confirmada", () => {
            getCacheNegociacoesMock.mockReturnValue([
                criarPedido({
                    status: "Aceito",
                    entrega_confirmada: true
                })
            ]);

            navegacao.showDetails(1, "produtor");

            const botao = document.getElementById("btnConfirmarAcao");

            expect(botao.disabled).toBe(true);
            expect(botao.textContent).toContain("Entrega Confirmada");
        });
    });

    describe("hideDetails", () => {
        it("deve voltar para a lista quando veio do modo lista", () => {
            navegacao.showDetails(1, "produtor");

            navegacao.hideDetails();

            expect(
                document.getElementById("view-detalhes").style.display
            ).toBe("none");

            expect(
                document.getElementById("view-lista").style.display
            ).toBe("block");

            expect(
                document.getElementById("view-calendario").style.display
            ).toBe("none");
        });

        it("deve voltar para o calendário quando veioDoCalendario é true", () => {
            const renderizarCalendarioMock = vi.fn();

            window.veioDoCalendario = true;
            window.renderizarCalendario = renderizarCalendarioMock;

            navegacao.showDetails(1, "produtor");

            navegacao.hideDetails();

            expect(
                document.getElementById("view-detalhes").style.display
            ).toBe("none");

            expect(
                document.getElementById("view-calendario").style.display
            ).toBe("block");

            expect(
                document.getElementById("view-lista").style.display
            ).toBe("none");

            expect(renderizarCalendarioMock).toHaveBeenCalledTimes(1);
            expect(window.veioDoCalendario).toBe(false);
        });

        it("deve voltar ao calendário sem erro quando não existe função de renderização", () => {
            window.veioDoCalendario = true;

            navegacao.hideDetails();

            expect(
                document.getElementById("view-calendario").style.display
            ).toBe("block");

            expect(window.veioDoCalendario).toBe(false);
        });

        it("deve funcionar quando algumas views não existem", () => {
            document.getElementById("view-lista").remove();
            document.getElementById("view-calendario").remove();

            expect(() => navegacao.hideDetails()).not.toThrow();
        });
    });

    describe("botão Conversar", () => {
        it("deve iniciar o chat e redirecionar após resposta bem-sucedida", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({})
            });

            navegacao.showDetails(1, "produtor");

            await clicar("btnConversar");

            await vi.waitFor(() => {
                expect(window.location.href).toBe(
                    "/chat?negociacao=1"
                );
            });

            expect(fetchMock).toHaveBeenCalledWith(
                "http://localhost:8000/chat/conversas/1/iniciar",
                {
                    method: "POST",
                    credentials: "include"
                }
            );
        });

        it("deve informar erro quando o ID da negociação é inválido", async () => {
            const pedido = criarPedido({ id: 0 });

            getCacheNegociacoesMock.mockReturnValue([pedido]);

            navegacao.showDetails(0, "produtor");

            await clicar("btnConversar");

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Não foi possível identificar a negociação."
            );

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("deve reabilitar o botão quando a API retorna erro", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue({
                    detail: "Falha ao iniciar conversa"
                })
            });

            navegacao.showDetails(1, "produtor");

            const botao = document.getElementById("btnConversar");

            await clicar("btnConversar");

            await vi.waitFor(() => {
                expect(botao.disabled).toBe(false);
                expect(botao.style.opacity).toBe("");
            });

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "Erro ao iniciar conversa:",
                expect.any(Error)
            );

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Falha ao iniciar conversa"
            );
        });

        it("deve reabilitar o botão quando fetch falha", async () => {
            fetchMock.mockRejectedValue(
                new Error("Falha de conexão")
            );

            navegacao.showDetails(1, "produtor");

            const botao = document.getElementById("btnConversar");

            await clicar("btnConversar");

            await vi.waitFor(() => {
                expect(botao.disabled).toBe(false);
                expect(botao.style.opacity).toBe("");
            });

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "Erro ao iniciar conversa:",
                expect.any(Error)
            );

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Falha de conexão"
            );
        });
    });

    it("deve disponibilizar hideDetails no escopo global", () => {
        expect(window.hideDetails).toBe(navegacao.hideDetails);
    });
});
