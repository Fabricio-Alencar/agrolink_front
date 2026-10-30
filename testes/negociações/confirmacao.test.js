
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const {
    deletarNegociacaoMock,
    atualizarStatusMock
} = vi.hoisted(() => ({
    deletarNegociacaoMock: vi.fn(),
    atualizarStatusMock: vi.fn()
}));

vi.mock("../../static/js/negociacoes/api.js", () => ({
    API: {
        deletarNegociacao: deletarNegociacaoMock,
        atualizarStatus: atualizarStatusMock
    }
}));

let confirmacao;
let agendarNotificacaoMock;
let exibirNotificacaoMock;
let reloadMock;
let consoleErrorMock;

function criarHTML() {
    document.body.innerHTML = `
        <div id="modalExcluir">
            <h2 id="tituloModalConfirmacao"></h2>
            <div id="mensagemExcluir"></div>
            <button id="btnConfirmarExclusao" type="button">
                Confirmar
            </button>
        </div>
    `;
}

function criarPedido() {
    return {
        id: 42,
        produto_nome: "Tomate",
        quantidade: 10,
        produto_unidade: "kg",
        data_entrega: "2026-11-10",
        status: "Pendente"
    };
}

describe("Confirmação de negociações", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        criarHTML();

        deletarNegociacaoMock.mockResolvedValue({});
        atualizarStatusMock.mockResolvedValue({});

        agendarNotificacaoMock = vi.fn();
        exibirNotificacaoMock = vi.fn();
        reloadMock = vi.fn();

        vi.stubGlobal(
            "agendarNotificacao",
            agendarNotificacaoMock
        );

        vi.stubGlobal(
            "exibirNotificacao",
            exibirNotificacaoMock
        );

        vi.stubGlobal("location", {
            reload: reloadMock
        });

        consoleErrorMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        confirmacao = await import(
            "../../static/js/negociacoes/confirmacao.js"
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.body.innerHTML = "";
    });

    // =====================================================
    // PREPARAR CONFIRMAÇÃO
    // =====================================================

    describe("prepararConfirmacaoNegociacao", () => {
        it("deve preparar a confirmação para aceitar um pedido", () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "aceitar",
                criarPedido(),
                "Aceito"
            );

            expect(
                document.getElementById(
                    "tituloModalConfirmacao"
                ).textContent
            ).toBe("Aceitar Pedido");

            expect(
                document.getElementById(
                    "mensagemExcluir"
                ).textContent
            ).toContain("Tomate");

            expect(
                document.getElementById(
                    "mensagemExcluir"
                ).textContent
            ).toContain("10 kg");

            expect(
                document.getElementById(
                    "mensagemExcluir"
                ).textContent
            ).toContain("2026-11-10");

            expect(
                document.getElementById(
                    "btnConfirmarExclusao"
                ).textContent
            ).toBe("Aceitar");

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(true);

            expect(
                document.getElementById(
                    "btnConfirmarExclusao"
                ).classList.contains("confirmar-positivo")
            ).toBe(true);
        });

        it("deve preparar a confirmação para recusar um pedido", () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "recusar",
                criarPedido(),
                "Recusado"
            );

            expect(
                document.getElementById(
                    "tituloModalConfirmacao"
                ).textContent
            ).toBe("Recusar Pedido");

            expect(
                document.getElementById(
                    "mensagemExcluir"
                ).textContent
            ).toContain("Tomate");

            expect(
                document.getElementById(
                    "btnConfirmarExclusao"
                ).textContent
            ).toBe("Recusar");

            expect(
                document.getElementById(
                    "btnConfirmarExclusao"
                ).classList.contains("confirmar-positivo")
            ).toBe(false);
        });

        it("deve preparar a confirmação para cancelar um pedido", () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "cancelar",
                criarPedido(),
                "Cancelado"
            );

            expect(
                document.getElementById(
                    "tituloModalConfirmacao"
                ).textContent
            ).toBe("Cancelar Pedido");

            expect(
                document.getElementById(
                    "mensagemExcluir"
                ).textContent
            ).toContain("Tomate");

            expect(
                document.getElementById(
                    "btnConfirmarExclusao"
                ).textContent
            ).toBe("Cancelar");
        });

        it("deve preparar a confirmação para excluir um pedido", () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "excluir",
                criarPedido()
            );

            expect(
                document.getElementById(
                    "tituloModalConfirmacao"
                ).textContent
            ).toBe("Remover Pedido");

            expect(
                document.getElementById(
                    "mensagemExcluir"
                ).textContent
            ).toContain("Tomate");

            expect(
                document.getElementById(
                    "btnConfirmarExclusao"
                ).textContent
            ).toBe("Remover");
        });

        it("deve usar a mensagem padrão para uma ação desconhecida", () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "outra-acao",
                criarPedido()
            );

            expect(
                document.getElementById(
                    "tituloModalConfirmacao"
                ).textContent
            ).toBe("Confirmar Ação");

            expect(
                document.getElementById(
                    "mensagemExcluir"
                ).textContent
            ).toBe("Deseja realmente realizar esta ação?");

            expect(
                document.getElementById(
                    "btnConfirmarExclusao"
                ).textContent
            ).toBe("Confirmar");
        });

        it("deve usar valores padrão quando os dados do pedido estão ausentes", () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "aceitar",
                {}
            );

            const mensagem = document.getElementById(
                "mensagemExcluir"
            ).textContent;

            expect(mensagem).toContain("produto");
            expect(mensagem).toContain("data a combinar");
        });

        it("deve abrir o modal adicionando a classe active", () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "excluir",
                criarPedido()
            );

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(true);
        });

        it("deve informar erro quando o modal não existe", () => {
            document.getElementById("modalExcluir").remove();

            confirmacao.prepararConfirmacaoNegociacao(
                "excluir",
                criarPedido()
            );

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Modal de confirmação não encontrado."
            );
        });

        it("deve informar erro quando a mensagem não existe", () => {
            document.getElementById("mensagemExcluir").remove();

            confirmacao.prepararConfirmacaoNegociacao(
                "excluir",
                criarPedido()
            );

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Modal de confirmação não encontrado."
            );
        });

        it("deve funcionar sem título ou botão de confirmação", () => {
            document.getElementById(
                "tituloModalConfirmacao"
            ).remove();

            document.getElementById(
                "btnConfirmarExclusao"
            ).remove();

            expect(() => {
                confirmacao.prepararConfirmacaoNegociacao(
                    "excluir",
                    criarPedido()
                );
            }).not.toThrow();

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(true);
        });
    });

    // =====================================================
    // FECHAR MODAL
    // =====================================================

    describe("fecharModalConfirmacao", () => {
        it("deve fechar o modal removendo a classe active", () => {
            document.getElementById("modalExcluir")
                .classList.add("active");

            confirmacao.fecharModalConfirmacao();

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("deve funcionar quando o modal não existe", () => {
            document.getElementById("modalExcluir").remove();

            expect(() => {
                confirmacao.fecharModalConfirmacao();
            }).not.toThrow();
        });

        it("deve disponibilizar a função de fechar no window", () => {
            expect(window.fecharModalConfirmacao).toBe(
                confirmacao.fecharModalConfirmacao
            );
        });
    });

    // =====================================================
    // BOTÃO CONFIRMAR
    // =====================================================

    describe("botão confirmar", () => {
        it("não deve chamar a API quando não existe ação preparada", async () => {
            const preventDefault = vi.fn();

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault });

            expect(preventDefault).toHaveBeenCalled();

            expect(
                deletarNegociacaoMock
            ).not.toHaveBeenCalled();

            expect(
                atualizarStatusMock
            ).not.toHaveBeenCalled();

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("deve excluir o pedido e notificar o sucesso", async () => {
            const pedido = criarPedido();

            confirmacao.prepararConfirmacaoNegociacao(
                "excluir",
                pedido
            );

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault: vi.fn() });

            expect(deletarNegociacaoMock).toHaveBeenCalledWith(42);

            expect(atualizarStatusMock).not.toHaveBeenCalled();

            expect(agendarNotificacaoMock).toHaveBeenCalledWith(
                "exclusao",
                "Pedido removido com sucesso!"
            );

            expect(reloadMock).toHaveBeenCalled();

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("deve aceitar o pedido, atualizar o status e notificar", async () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "aceitar",
                criarPedido(),
                "Aceito"
            );

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault: vi.fn() });

            expect(atualizarStatusMock).toHaveBeenCalledWith(
                42,
                "Aceito"
            );

            expect(agendarNotificacaoMock).toHaveBeenCalledWith(
                "cadastro",
                "Pedido aceito!"
            );

            expect(reloadMock).toHaveBeenCalled();

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("deve recusar o pedido e notificar o resultado", async () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "recusar",
                criarPedido(),
                "Recusado"
            );

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault: vi.fn() });

            expect(atualizarStatusMock).toHaveBeenCalledWith(
                42,
                "Recusado"
            );

            expect(agendarNotificacaoMock).toHaveBeenCalledWith(
                "exclusao",
                "Pedido recusado."
            );

            expect(reloadMock).toHaveBeenCalled();
        });

        it("deve cancelar o pedido e notificar o resultado", async () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "cancelar",
                criarPedido(),
                "Cancelado"
            );

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault: vi.fn() });

            expect(atualizarStatusMock).toHaveBeenCalledWith(
                42,
                "Cancelado"
            );

            expect(agendarNotificacaoMock).toHaveBeenCalledWith(
                "exclusao",
                "Pedido cancelado."
            );

            expect(reloadMock).toHaveBeenCalled();
        });

        it("deve atualizar o pedido para outra ação", async () => {
            confirmacao.prepararConfirmacaoNegociacao(
                "outra-acao",
                criarPedido(),
                "Em andamento"
            );

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault: vi.fn() });

            expect(atualizarStatusMock).toHaveBeenCalledWith(
                42,
                "Em andamento"
            );

            expect(agendarNotificacaoMock).toHaveBeenCalledWith(
                "exclusao",
                "Pedido atualizado."
            );

            expect(reloadMock).toHaveBeenCalled();
        });

        it("deve tratar erro ao excluir um pedido", async () => {
            const erro = new Error("Falha ao excluir");

            deletarNegociacaoMock.mockRejectedValueOnce(erro);

            confirmacao.prepararConfirmacaoNegociacao(
                "excluir",
                criarPedido()
            );

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault: vi.fn() });

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Erro ao atualizar pedido:",
                erro
            );

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Erro ao tentar atualizar o pedido."
            );

            expect(reloadMock).not.toHaveBeenCalled();

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(false);
        });

        it("deve tratar erro ao atualizar o status", async () => {
            const erro = new Error("Falha ao atualizar");

            atualizarStatusMock.mockRejectedValueOnce(erro);

            confirmacao.prepararConfirmacaoNegociacao(
                "recusar",
                criarPedido(),
                "Recusado"
            );

            await document.getElementById(
                "btnConfirmarExclusao"
            ).onclick({ preventDefault: vi.fn() });

            expect(atualizarStatusMock).toHaveBeenCalledWith(
                42,
                "Recusado"
            );

            expect(consoleErrorMock).toHaveBeenCalledWith(
                "❌ Erro ao atualizar pedido:",
                erro
            );

            expect(exibirNotificacaoMock).toHaveBeenCalledWith(
                "erro",
                "Erro ao tentar atualizar o pedido."
            );

            expect(reloadMock).not.toHaveBeenCalled();

            expect(
                document.getElementById("modalExcluir")
                    .classList.contains("active")
            ).toBe(false);
        });
    });
});
