
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const { getCacheMock, showDetailsMock } = vi.hoisted(() => ({
    getCacheMock: vi.fn(),
    showDetailsMock: vi.fn()
}));

vi.mock("../../static/js/negociacoes/renderizacao.js", () => ({
    getCacheNegociacoes: getCacheMock
}));

vi.mock("../../static/js/negociacoes/navegacao.js", () => ({
    showDetails: showDetailsMock
}));

let calendario;

function criarHTML() {
    document.body.innerHTML = `
        <section id="view-lista"></section>
        <section id="view-calendario"></section>
        <section id="view-detalhes"></section>

        <button id="btnLista" type="button"></button>
        <button id="btnCalendario" type="button"></button>

        <button id="btnListaCalendario" type="button"></button>
        <button id="btnCalendarioLista" type="button"></button>

        <h2 id="calendarTitle"></h2>
        <div id="calendarGrid"></div>

        <button id="btnMesAnterior" type="button"></button>
        <button id="btnProximoMes" type="button"></button>
        <button id="btnHoje" type="button"></button>
    `;
}

describe("Calendário de negociações", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 15, 12, 0, 0));

        criarHTML();

        getCacheMock.mockReturnValue([]);

        showDetailsMock.mockReset();

        window.veioDoCalendario = false;

        window.lucide = {
            createIcons: vi.fn()
        };

        calendario = await import(
            "../../static/js/negociacoes/calendario.js"
        );
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();

        delete window.lucide;
        delete window.veioDoCalendario;
        delete window.renderizarCalendario;

        document.body.innerHTML = "";
    });

    // =====================================================
    // RENDERIZAÇÃO
    // =====================================================

    describe("renderizarCalendario", () => {
        it("deve exibir o mês e o ano atuais", () => {
            calendario.renderizarCalendario();

            expect(
                document.getElementById("calendarTitle").textContent
            ).toBe("Outubro 2026");
        });

        it("deve renderizar os dias do mês corretamente", () => {
            calendario.renderizarCalendario();

            const dias = document.querySelectorAll(
                "#calendarGrid .calendar-day:not(.empty)"
            );

            expect(dias).toHaveLength(31);
        });

        it("deve preencher os espaços antes do primeiro dia do mês", () => {
            calendario.renderizarCalendario();

            const primeiroDia = new Date(2026, 9, 1).getDay();

            const vazios = document.querySelectorAll(
                "#calendarGrid .calendar-day.empty"
            );

            expect(vazios).toHaveLength(primeiroDia);
        });

        it("deve marcar o dia atual com a classe today", () => {
            calendario.renderizarCalendario();

            const diasHoje = document.querySelectorAll(
                "#calendarGrid .calendar-day.today"
            );

            expect(diasHoje).toHaveLength(1);
            expect(diasHoje[0].querySelector(".day-number").textContent)
                .toBe("15");
        });

        it("deve limpar o conteúdo anterior antes de renderizar", () => {
            const grid = document.getElementById("calendarGrid");

            grid.innerHTML = "<p>Conteúdo antigo</p>";

            calendario.renderizarCalendario();

            expect(grid.querySelector("p")).toBeNull();
            expect(
                grid.querySelectorAll(".calendar-day")
            ).not.toHaveLength(0);
        });

        it("deve chamar createIcons quando Lucide está disponível", () => {
            calendario.renderizarCalendario();

            expect(window.lucide.createIcons).toHaveBeenCalled();
        });

        it("deve funcionar quando Lucide não está disponível", () => {
            delete window.lucide;

            expect(() => {
                calendario.renderizarCalendario();
            }).not.toThrow();
        });
    });

    // =====================================================
    // PEDIDOS NO CALENDÁRIO
    // =====================================================

    describe("pedidos do calendário", () => {
        it("deve exibir um pedido na data de entrega correspondente", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    data_entrega: "2026-10-15",
                    produto_nome: "Tomate",
                    negociante_nome: "João",
                    status: "Pendente"
                }
            ]);

            calendario.renderizarCalendario();

            const evento = document.querySelector(
                ".calendar-order"
            );

            expect(evento).not.toBeNull();

            expect(
                evento.querySelector(".calendar-order-product").textContent
            ).toBe("Tomate");

            expect(
                evento.querySelector(".calendar-order-person").textContent
            ).toBe("João");

            expect(
                evento.querySelector(".calendar-order-status").textContent
            ).toBe("Pendente");
        });

        it("deve exibir vários pedidos no mesmo dia", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    data_entrega: "2026-10-15",
                    produto_nome: "Tomate",
                    status: "Pendente"
                },
                {
                    id: 2,
                    data_entrega: "2026-10-15",
                    produto_nome: "Batata",
                    status: "Entregue"
                }
            ]);

            calendario.renderizarCalendario();

            expect(
                document.querySelectorAll(".calendar-order")
            ).toHaveLength(2);
        });

        
            it("não deve exibir pedidos de outros dias", () => {
    getCacheMock.mockReturnValue([
        {
            id: 1,
            data_entrega: "2026-10-14",
            produto_nome: "Tomate"
        },
        {
            id: 2,
            data_entrega: "2026-10-16",
            produto_nome: "Batata"
        }
    ]);

    calendario.renderizarCalendario();

    const dias = [
        ...document.querySelectorAll(
            "#calendarGrid .calendar-day:not(.empty)"
        )
    ];

    const dia14 = dias.find(
        dia => dia.querySelector(".day-number")?.textContent === "14"
    );

    const dia15 = dias.find(
        dia => dia.querySelector(".day-number")?.textContent === "15"
    );

    const dia16 = dias.find(
        dia => dia.querySelector(".day-number")?.textContent === "16"
    );

    expect(dia14.querySelectorAll(".calendar-order")).toHaveLength(1);
    expect(dia15.querySelectorAll(".calendar-order")).toHaveLength(0);
    expect(dia16.querySelectorAll(".calendar-order")).toHaveLength(1);
});
        it("deve ignorar pedidos sem data de entrega", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    produto_nome: "Tomate"
                },
                {
                    id: 2,
                    data_entrega: null,
                    produto_nome: "Batata"
                }
            ]);

            calendario.renderizarCalendario();

            expect(
                document.querySelectorAll(".calendar-order")
            ).toHaveLength(0);
        });

        it("deve ignorar pedidos com data inválida", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    data_entrega: "data-invalida",
                    produto_nome: "Tomate"
                }
            ]);

            calendario.renderizarCalendario();

            expect(
                document.querySelectorAll(".calendar-order")
            ).toHaveLength(0);
        });

        it("deve aceitar datas de entrega no formato ISO com horário", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    data_entrega: "2026-10-15T18:30:00",
                    produto_nome: "Cenoura",
                    status: "Pendente"
                }
            ]);

            calendario.renderizarCalendario();

            expect(
                document.querySelectorAll(".calendar-order")
            ).toHaveLength(1);
        });

        it("deve usar os valores padrão quando faltam nomes e status", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    data_entrega: "2026-10-15"
                }
            ]);

            calendario.renderizarCalendario();

            const evento = document.querySelector(".calendar-order");

            expect(
                evento.querySelector(".calendar-order-product").textContent
            ).toBe("Produto");

            expect(
                evento.querySelector(".calendar-order-person").textContent
            ).toBe("Negociante");

            expect(
                evento.querySelector(".calendar-order-status").textContent
            ).toBe("Pendente");
        });

        it("deve normalizar o status na classe CSS", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    data_entrega: "2026-10-15",
                    status: "  Finalizado  "
                }
            ]);

            calendario.renderizarCalendario();

            const evento = document.querySelector(".calendar-order");

            expect(evento.classList.contains("status-finalizado"))
                .toBe(true);
        });

        it("deve remover acentos ao normalizar o status", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 1,
                    data_entrega: "2026-10-15",
                    status: "Concluído"
                }
            ]);

            calendario.renderizarCalendario();

            const evento = document.querySelector(".calendar-order");

            expect(evento.classList.contains("status-concluido"))
                .toBe(true);
        });

        it("deve funcionar quando o cache de negociações é nulo", () => {
            getCacheMock.mockReturnValue(null);

            expect(() => {
                calendario.renderizarCalendario();
            }).not.toThrow();

            expect(
                document.querySelectorAll(".calendar-order")
            ).toHaveLength(0);
        });
    });

    // =====================================================
    // ABRIR DETALHES DO PEDIDO
    // =====================================================

    describe("clique em um pedido", () => {
        it("deve abrir os detalhes do pedido pelo calendário", () => {
            getCacheMock.mockReturnValue([
                {
                    id: 42,
                    data_entrega: "2026-10-15",
                    produto_nome: "Milho",
                    status: "Pendente"
                }
            ]);

            calendario.renderizarCalendario();

            const evento = document.querySelector(".calendar-order");

            evento.click();

            expect(showDetailsMock).toHaveBeenCalledWith(
                42,
                "produtor"
            );

            expect(window.veioDoCalendario).toBe(true);
        });

        it("não deve abrir detalhes quando o pedido não possui ID", () => {
            const consoleError = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            getCacheMock.mockReturnValue([
                {
                    data_entrega: "2026-10-15",
                    produto_nome: "Milho"
                }
            ]);

            calendario.renderizarCalendario();

            document.querySelector(".calendar-order").click();

            expect(showDetailsMock).not.toHaveBeenCalled();
            expect(consoleError).toHaveBeenCalledWith(
                "❌ Pedido não possui ID:",
                expect.objectContaining({
                    produto_nome: "Milho"
                })
            );
        });
    });

    // =====================================================
    // NAVEGAÇÃO ENTRE MESES
    // =====================================================

    describe("navegação entre meses", () => {
        it("deve navegar para o mês anterior", () => {
            calendario.renderizarCalendario();

            document.getElementById("btnMesAnterior").click();

            expect(
                document.getElementById("calendarTitle").textContent
            ).toBe("Setembro 2026");
        });

        it("deve navegar para o próximo mês", () => {
            calendario.renderizarCalendario();

            document.getElementById("btnProximoMes").click();

            expect(
                document.getElementById("calendarTitle").textContent
            ).toBe("Novembro 2026");
        });

        it("deve atualizar os dias ao mudar de mês", () => {
            calendario.renderizarCalendario();

            document.getElementById("btnProximoMes").click();

            const dias = document.querySelectorAll(
                "#calendarGrid .calendar-day:not(.empty)"
            );

            expect(dias).toHaveLength(30);
        });

        it("deve voltar para o mês atual ao clicar em Hoje", () => {
            calendario.renderizarCalendario();

            document.getElementById("btnProximoMes").click();

            expect(
                document.getElementById("calendarTitle").textContent
            ).toBe("Novembro 2026");

            document.getElementById("btnHoje").click();

            expect(
                document.getElementById("calendarTitle").textContent
            ).toBe("Outubro 2026");
        });
    });

    // =====================================================
    // ALTERNÂNCIA ENTRE LISTA E CALENDÁRIO
    // =====================================================

    describe("alternância de visualização", () => {
        it("deve mostrar a lista e ocultar calendário e detalhes", () => {
            document.getElementById("view-lista").style.display = "none";
            document.getElementById("view-calendario").style.display = "block";
            document.getElementById("view-detalhes").style.display = "block";

            document.getElementById("btnLista").click();

            expect(
                document.getElementById("view-lista").style.display
            ).toBe("block");

            expect(
                document.getElementById("view-calendario").style.display
            ).toBe("none");

            expect(
                document.getElementById("view-detalhes").style.display
            ).toBe("none");

            expect(
                document.getElementById("btnLista").classList.contains("active")
            ).toBe(true);

            expect(
                document.getElementById("btnCalendario").classList.contains("active")
            ).toBe(false);

            expect(window.veioDoCalendario).toBe(false);
        });

        it("deve mostrar o calendário e ocultar lista e detalhes", () => {
            document.getElementById("view-lista").style.display = "block";
            document.getElementById("view-calendario").style.display = "none";
            document.getElementById("view-detalhes").style.display = "block";

            document.getElementById("btnCalendario").click();

            expect(
                document.getElementById("view-lista").style.display
            ).toBe("none");

            expect(
                document.getElementById("view-calendario").style.display
            ).toBe("block");

            expect(
                document.getElementById("view-detalhes").style.display
            ).toBe("none");

            expect(
                document.getElementById("btnCalendario").classList.contains("active")
            ).toBe(true);

            expect(
                document.getElementById("btnLista").classList.contains("active")
            ).toBe(false);

            expect(
                document.querySelectorAll("#calendarGrid .calendar-day:not(.empty)")
            ).toHaveLength(31);
        });

        it("deve permitir voltar para a lista pelo botão alternativo", () => {
            document.getElementById("btnListaCalendario").click();

            expect(
                document.getElementById("view-lista").style.display
            ).toBe("block");

            expect(
                document.getElementById("btnListaCalendario").classList.contains("active")
            ).toBe(true);

            expect(
                document.getElementById("btnCalendarioLista").classList.contains("active")
            ).toBe(false);
        });

        it("deve permitir abrir o calendário pelo botão alternativo", () => {
            document.getElementById("btnCalendarioLista").click();

            expect(
                document.getElementById("view-calendario").style.display
            ).toBe("block");

            expect(
                document.getElementById("btnCalendarioLista").classList.contains("active")
            ).toBe(true);

            expect(
                document.getElementById("btnListaCalendario").classList.contains("active")
            ).toBe(false);
        });
    });

    // =====================================================
    // DISPONIBILIZAÇÃO GLOBAL
    // =====================================================

    it("deve disponibilizar renderizarCalendario no objeto window", () => {
        expect(window.renderizarCalendario).toBe(
            calendario.renderizarCalendario
        );
    });
});
