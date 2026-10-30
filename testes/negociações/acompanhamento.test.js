import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

const { API } = vi.hoisted(() => ({
    API: {
        registrarConfirmacao: vi.fn(),
        avaliarProdutor: vi.fn()
    }
}));

vi.mock("../../static/js/negociacoes/api.js", () => ({
    API
}));

let acompanhamento;

const avaliacoesMock = {
    escaparHTML: valor => String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]),

    formatarNota: vi.fn(nota =>
        Number(nota).toFixed(1)
    ),

    formatarData: vi.fn(data =>
        data ? "29/10/2026" : ""
    ),

    estrelas: vi.fn((nota, tamanho) =>
        `<span class="estrelas">${nota}-${tamanho}</span>`
    ),

    abrirModal: vi.fn()
};

describe("Negociações - acompanhamento.js", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        // Configura as dependências antes de importar o módulo.
        window.Avaliacoes = avaliacoesMock;

        vi.stubGlobal("location", {
            reload: vi.fn()
        });

        vi.stubGlobal("exibirNotificacao", vi.fn());
        vi.stubGlobal("agendarNotificacao", vi.fn());

        document.body.innerHTML = "";

        acompanhamento = await import(
            "../../static/js/negociacoes/acompanhamento.js"
        );
    });

    // =========================================================
    // STATUS DO PEDIDO
    // =========================================================

    it("normaliza o status do pedido", () => {
        expect(
            acompanhamento.statusDe({
                status: "  ACEITO "
            })
        ).toBe("aceito");

        expect(
            acompanhamento.statusDe({
                status: "Finalizado"
            })
        ).toBe("finalizado");

        expect(
            acompanhamento.statusDe({})
        ).toBe("pendente");

        expect(
            acompanhamento.statusDe(null)
        ).toBe("pendente");
    });

    // =========================================================
    // NECESSIDADE DE AVALIAÇÃO
    // =========================================================

    it("identifica quando um estabelecimento precisa avaliar", () => {
        expect(
            acompanhamento.precisaAvaliar({
                status: "finalizado",
                avaliacao: null
            }, "estabelecimento")
        ).toBe(true);

        expect(
            acompanhamento.precisaAvaliar({
                status: "finalizado",
                avaliacao: {
                    nota: 5
                }
            }, "estabelecimento")
        ).toBe(false);

        expect(
            acompanhamento.precisaAvaliar({
                status: "entregue"
            }, "estabelecimento")
        ).toBe(false);

        expect(
            acompanhamento.precisaAvaliar({
                status: "finalizado"
            }, "produtor")
        ).toBe(false);
    });

    // =========================================================
    // DATA DO PEDIDO
    // =========================================================

    it("formata a data do pedido", () => {
        expect(
            acompanhamento.dataDoPedido({
                data_criacao: "2026-10-29"
            })
        ).toBe("Pedido em 29/10/2026");

        expect(
            acompanhamento.dataDoPedido({})
        ).toBe("");
    });

    // =========================================================
    // NOME DO NEGOCIANTE
    // =========================================================

    it("gera link para o perfil público quando o usuário é estabelecimento", () => {
        const html = acompanhamento.nomeNegocianteHTML({
            negociante_nome: "João",
            produtor_id: 42
        }, "estabelecimento");

        expect(html).toContain('href="/produtor/42"');
        expect(html).toContain("João");
    });

    it("não gera link para o produtor quando o usuário é produtor", () => {
        const html = acompanhamento.nomeNegocianteHTML({
            negociante_nome: "Mercado Central",
            produtor_id: 42
        }, "produtor");

        expect(html).toBe("Mercado Central");
        expect(html).not.toContain("<a");
    });

    it("escapa o nome do negociante", () => {
        const html = acompanhamento.nomeNegocianteHTML({
            negociante_nome: "<script>alert(1)</script>",
            produtor_id: null
        }, "estabelecimento");

        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });

    it("retorna o nome padrão quando o negociante não foi informado", () => {
        expect(
            acompanhamento.nomeNegocianteHTML({}, "produtor")
        ).toBe("Não informado");
    });

    // =========================================================
    // PRÓXIMA AÇÃO
    // =========================================================

    it("define a próxima ação de pedido pendente", () => {
        expect(
            acompanhamento.proximaAcao({
                status: "pendente"
            }, "produtor")
        ).toMatchObject({
            texto: "Responda o pedido",
            classe: "minha-vez",
            icone: "bell-ring"
        });

        expect(
            acompanhamento.proximaAcao({
                status: "pendente"
            }, "estabelecimento")
        ).toMatchObject({
            texto: "Aguardando o produtor aceitar"
        });
    });

    it("define a próxima ação após o aceite", () => {
        expect(
            acompanhamento.proximaAcao({
                status: "aceito",
                entrega_confirmada: false
            }, "produtor").texto
        ).toBe("Confirme a entrega");

        expect(
            acompanhamento.proximaAcao({
                status: "aceito",
                entrega_confirmada: true
            }, "produtor").texto
        ).toBe("Aguardando o recebimento");

        expect(
            acompanhamento.proximaAcao({
                status: "aceito"
            }, "estabelecimento").texto
        ).toBe("Confirme quando receber");
    });

    it("define a próxima ação após a entrega", () => {
        expect(
            acompanhamento.proximaAcao({
                status: "entregue"
            }, "produtor").texto
        ).toBe("Aguardando o recebimento");

        expect(
            acompanhamento.proximaAcao({
                status: "entregue"
            }, "estabelecimento").texto
        ).toBe("Confirme o recebimento");
    });

    it("define a próxima ação de avaliação", () => {
        expect(
            acompanhamento.proximaAcao({
                status: "finalizado"
            }, "estabelecimento").texto
        ).toBe("Avalie o produtor");

        expect(
            acompanhamento.proximaAcao({
                status: "finalizado"
            }, "produtor").texto
        ).toBe("Aguardando avaliação");

        expect(
            acompanhamento.proximaAcao({
                status: "finalizado",
                avaliacao: {
                    nota: 4.5
                }
            }, "produtor").texto
        ).toBe("Avaliado com 4.5 ★");
    });

    it.each(["recusado", "cancelado"])(
        "identifica pedido %s como encerrado",
        status => {
            expect(
                acompanhamento.proximaAcao({
                    status
                }, "produtor")
            ).toMatchObject({
                classe: "encerrado",
                icone: "circle-x"
            });
        }
    );

    it("retorna null para status desconhecido", () => {
        expect(
            acompanhamento.proximaAcao({
                status: "desconhecido"
            }, "produtor")
        ).toBeNull();
    });

    // =========================================================
    // HTML DA PRÓXIMA AÇÃO
    // =========================================================

    it("gera HTML do selo da próxima ação", () => {
        const html = acompanhamento.proximaAcaoHTML({
            status: "pendente"
        }, "produtor");

        expect(html).toContain("Responda o pedido");
        expect(html).toContain("minha-vez");
        expect(html).toContain("bell-ring");
    });

    it("retorna HTML vazio quando não existe próxima ação", () => {
        expect(
            acompanhamento.proximaAcaoHTML({
                status: "desconhecido"
            }, "produtor")
        ).toBe("");
    });

    // =========================================================
    // LINHA DO TEMPO
    // =========================================================

    it("gera aviso para pedidos recusados ou cancelados", () => {
        expect(
            acompanhamento.linhaDoTempoHTML({
                status: "recusado"
            })
        ).toContain("Este pedido foi recusado.");

        expect(
            acompanhamento.linhaDoTempoHTML({
                status: "cancelado"
            })
        ).toContain("Este pedido foi cancelado.");
    });

    it("gera as etapas da linha do tempo", () => {
        const html = acompanhamento.linhaDoTempoHTML({
            status: "entregue",
            data_criacao: "2026-10-29",
            avaliacao: null
        });

        expect(html).toContain("Pedido feito");
        expect(html).toContain("Aceito");
        expect(html).toContain("Entregue");
        expect(html).toContain("Recebido");
        expect(html).toContain("Avaliado");
        expect(html).toContain("29/10/2026");
        expect(html).toContain("etapa feita");
    });

    // =========================================================
    // AVALIAÇÃO HTML
    // =========================================================

    it("gera bloco de avaliação somente para pedido finalizado", () => {
        expect(
            acompanhamento.avaliacaoHTML({
                status: "entregue"
            }, "estabelecimento")
        ).toBe("");
    });

    it("mostra a avaliação existente e o comentário escapado", () => {
        const html = acompanhamento.avaliacaoHTML({
            status: "finalizado",
            avaliacao: {
                nota: 5,
                comentario: "<script>teste</script>"
            }
        }, "produtor");

        expect(html).toContain("Avaliação que você recebeu");
        expect(html).toContain("&lt;script&gt;");
        expect(html).not.toContain("<script>");
        expect(html).toContain("5.0");
    });

    it("mostra o título correto para a avaliação do estabelecimento", () => {
        const html = acompanhamento.avaliacaoHTML({
            status: "finalizado",
            avaliacao: {
                nota: 4,
                comentario: ""
            }
        }, "estabelecimento");

        expect(html).toContain("Sua avaliação do produtor");
    });

    it("permite ao estabelecimento avaliar um pedido finalizado", () => {
        const html = acompanhamento.avaliacaoHTML({
            status: "finalizado"
        }, "estabelecimento");

        expect(html).toContain("Como foi este pedido?");
        expect(html).toContain('id="btnAbrirAvaliacao"');
        expect(html).toContain("Avaliar produtor");
    });

    it("informa ao produtor que está aguardando avaliação", () => {
        const html = acompanhamento.avaliacaoHTML({
            status: "finalizado"
        }, "produtor");

        expect(html).toContain("Aguardando avaliação");
    });

    // =========================================================
    // AÇÃO PRINCIPAL
    // =========================================================

    it("define a ação principal para aceitar pedido pendente", () => {
        expect(
            acompanhamento.acaoPrincipal({
                status: "pendente"
            }, "produtor")
        ).toEqual({
            acao: "aceitar",
            texto: "Aceitar"
        });
    });

    it("define a ação principal para confirmar entrega", () => {
        expect(
            acompanhamento.acaoPrincipal({
                status: "aceito",
                entrega_confirmada: false
            }, "produtor")
        ).toEqual({
            acao: "confirmar_entrega",
            texto: "Confirmar entrega"
        });
    });

    it("define a ação principal para confirmar recebimento", () => {
        expect(
            acompanhamento.acaoPrincipal({
                status: "aceito"
            }, "estabelecimento")
        ).toEqual({
            acao: "confirmar_recebimento",
            texto: "Confirmar recebimento"
        });

        expect(
            acompanhamento.acaoPrincipal({
                status: "entregue"
            }, "estabelecimento").acao
        ).toBe("confirmar_recebimento");
    });

    it("define a ação principal para avaliar o produtor", () => {
        expect(
            acompanhamento.acaoPrincipal({
                status: "finalizado"
            }, "estabelecimento")
        ).toEqual({
            acao: "avaliar",
            texto: "★ Avaliar"
        });
    });

    it("retorna null quando não há ação principal", () => {
        expect(
            acompanhamento.acaoPrincipal({
                status: "finalizado",
                avaliacao: {
                    nota: 5
                }
            }, "estabelecimento")
        ).toBeNull();
    });

    // =========================================================
    // CONFIRMAÇÃO DE ENTREGA / RECEBIMENTO
    // =========================================================

    it("registra confirmação de entrega e agenda notificação", async () => {
        API.registrarConfirmacao.mockResolvedValue({
            status_atual: "entregue"
        });

        await acompanhamento.executarConfirmacao({
            id: 10,
            status: "aceito"
        }, "produtor");

        expect(
            API.registrarConfirmacao
        ).toHaveBeenCalledWith(
            10,
            "confirmar_entrega"
        );

        expect(
            globalThis.agendarNotificacao
        ).toHaveBeenCalledWith(
            "cadastro",
            "Confirmação registrada com sucesso!"
        );
    });

    it("abre avaliação quando o estabelecimento confirma o recebimento", async () => {
        API.registrarConfirmacao.mockResolvedValue({
            status: "finalizado",
            status_atual: "finalizado"
        });

        await acompanhamento.executarConfirmacao({
            id: 10,
            produto_nome: "Tomate",
            negociante_nome: "João"
        }, "estabelecimento");

        expect(
            API.registrarConfirmacao
        ).toHaveBeenCalledWith(
            10,
            "confirmar_recebimento"
        );

        expect(
            globalThis.exibirNotificacao
        ).toHaveBeenCalledWith(
            "cadastro",
            "Recebimento confirmado!"
        );

        expect(
            avaliacoesMock.abrirModal
        ).toHaveBeenCalled();
    });

    it("exibe notificação de erro quando a confirmação falha", async () => {
        API.registrarConfirmacao.mockRejectedValue(
            new Error("Falha na API")
        );

        const erroSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        try {
            await acompanhamento.executarConfirmacao({
                id: 10
            }, "produtor");

            expect(
                globalThis.exibirNotificacao
            ).toHaveBeenCalledWith(
                "erro",
                "Erro ao registrar confirmação."
            );

            expect(erroSpy).toHaveBeenCalled();
        } finally {
            erroSpy.mockRestore();
        }
    });

    // =========================================================
    // MODAL DE AVALIAÇÃO
    // =========================================================

    it("abre o modal com os dados do pedido", () => {
        const order = {
            id: 10,
            produto_nome: "Tomate",
            negociante_nome: "João"
        };

        const aoFechar = vi.fn();

        acompanhamento.abrirAvaliacao(order, aoFechar);

        expect(
            avaliacoesMock.abrirModal
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                subtitulo: "Tomate · João",
                onEnviar: expect.any(Function),
                onFechar: aoFechar
            })
        );
    });

    it("usa valores padrão no subtítulo do modal", () => {
        acompanhamento.abrirAvaliacao({
            id: 10
        });

        expect(
            avaliacoesMock.abrirModal
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                subtitulo: "Pedido · Produtor"
            })
        );
    });

    it("envia a avaliação pela API", async () => {
        API.avaliarProdutor.mockResolvedValue({
            sucesso: true
        });

        acompanhamento.abrirAvaliacao({
            id: 10,
            produto_nome: "Tomate",
            negociante_nome: "João"
        });

        const configuracao =
            avaliacoesMock.abrirModal.mock.calls.at(-1)[0];

        await configuracao.onEnviar(4.5, "Muito bom");

        expect(
            API.avaliarProdutor
        ).toHaveBeenCalledWith(
            10,
            4.5,
            "Muito bom"
        );

        expect(
            globalThis.agendarNotificacao
        ).toHaveBeenCalledWith(
            "cadastro",
            "Avaliação enviada. Obrigado!"
        );
    });
});
