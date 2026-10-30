
import {
    describe,
    it,
    expect,
    vi,
    afterEach
} from "vitest";

import {
    obterDataValida,
    obterDataUltimaMensagem,
    conversaEstaArquivada,
    formatarHora,
    formatarHorarioMensagem,
    obterHoraAtual
} from "../../static/js/chat/utils.js";

describe("Utils do Chat", () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =====================================================
    // obterDataValida
    // =====================================================

    describe("obterDataValida", () => {

        it("retorna null quando a data não é informada", () => {
            expect(obterDataValida(null)).toBeNull();
            expect(obterDataValida(undefined)).toBeNull();
            expect(obterDataValida("")).toBeNull();
        });

        it("retorna o próprio Date quando ele é válido", () => {
            const data = new Date("2026-10-30T12:00:00Z");

            expect(obterDataValida(data)).toBe(data);
        });

        it("retorna null para um objeto Date inválido", () => {
            expect(obterDataValida(new Date("data inválida"))).toBeNull();
        });

        it("converte uma string ISO válida", () => {
            const resultado = obterDataValida("2026-10-30T12:00:00Z");

            expect(resultado).toBeInstanceOf(Date);
            expect(resultado.toISOString()).toBe("2026-10-30T12:00:00.000Z");
        });

        it("considera UTC quando a data não possui fuso horário", () => {
            const resultado = obterDataValida("2026-10-30 12:00:00");

            expect(resultado.toISOString()).toBe("2026-10-30T12:00:00.000Z");
        });

        it("aceita data com fuso horário positivo", () => {
            const resultado = obterDataValida("2026-10-30T12:00:00+03:00");

            expect(resultado.toISOString()).toBe("2026-10-30T09:00:00.000Z");
        });

        it("aceita data com fuso horário negativo", () => {
            const resultado = obterDataValida("2026-10-30T12:00:00-03:00");

            expect(resultado.toISOString()).toBe("2026-10-30T15:00:00.000Z");
        });

        it("retorna null para uma string inválida", () => {
            const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});

            expect(obterDataValida("data inválida")).toBeNull();
            expect(aviso).toHaveBeenCalled();

        });

        it("remove precisão excedente dos milissegundos", () => {
            const resultado = obterDataValida("2026-10-30T12:00:00.123456Z");

            expect(resultado).toBeInstanceOf(Date);
            expect(resultado.toISOString()).toBe("2026-10-30T12:00:00.123Z");
        });
    });

    // =====================================================
    // obterDataUltimaMensagem
    // =====================================================

    describe("obterDataUltimaMensagem", () => {

        it("prioriza data_envio", () => {
            const conversa = {
                data_envio: "2026-10-30",
                data_ultima_mensagem: "2026-10-29"
            };

            expect(obterDataUltimaMensagem(conversa)).toBe("2026-10-30");
        });

        it("utiliza data_ultima_mensagem quando data_envio não existe", () => {
            const conversa = {
                data_ultima_mensagem: "2026-10-29"
            };

            expect(obterDataUltimaMensagem(conversa)).toBe("2026-10-29");
        });

        it("obtém a data do objeto ultima_mensagem", () => {
            const conversa = {
                ultima_mensagem: {
                    data_envio: "2026-10-28"
                }
            };

            expect(obterDataUltimaMensagem(conversa)).toBe("2026-10-28");
        });

        it("retorna null quando não existe data", () => {
            expect(obterDataUltimaMensagem({})).toBeNull();
        });

        it("retorna null quando a última mensagem não possui data", () => {
            expect(obterDataUltimaMensagem({
                ultima_mensagem: {}
            })).toBeNull();
        });

        it("aceita conversa nula", () => {
            expect(obterDataUltimaMensagem(null)).toBeNull();
        });
    });

    // =====================================================
    // conversaEstaArquivada
    // =====================================================

    describe("conversaEstaArquivada", () => {

        it("retorna true para boolean true", () => {
            expect(conversaEstaArquivada({ arquivada: true })).toBe(true);
        });

        it("retorna true para string true", () => {
            expect(conversaEstaArquivada({ arquivada: "true" })).toBe(true);
        });

        it("ignora espaços e diferença entre maiúsculas e minúsculas", () => {
            expect(conversaEstaArquivada({ arquivada: " TRUE " })).toBe(true);
        });

        it("retorna false para boolean false", () => {
            expect(conversaEstaArquivada({ arquivada: false })).toBe(false);
        });

        it("retorna false para string false", () => {
            expect(conversaEstaArquivada({ arquivada: "false" })).toBe(false);
        });

        it("retorna false quando a propriedade não existe", () => {
            expect(conversaEstaArquivada({})).toBe(false);
        });

        it("aceita conversa nula", () => {
            expect(conversaEstaArquivada(null)).toBe(false);
        });
    });

    // =====================================================
    // formatarHora
    // =====================================================

    describe("formatarHora", () => {

        it("formata uma data válida em horas e minutos", () => {
            const resultado = formatarHora("2026-10-30T14:35:00Z");

            expect(resultado).toMatch(/^\d{2}:\d{2}$/);
        });

        it("retorna string vazia para data inválida", () => {
            const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});

            expect(formatarHora("data inválida")).toBe("");
            expect(aviso).toHaveBeenCalled();
        });

        it("retorna string vazia quando a data não é informada", () => {
            expect(formatarHora(null)).toBe("");
        });
    });

    // =====================================================
    // formatarHorarioMensagem
    // =====================================================

    describe("formatarHorarioMensagem", () => {

        it("retorna string vazia para data inválida", () => {
            const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});

            expect(formatarHorarioMensagem("inválida")).toBe("");
            expect(aviso).toHaveBeenCalled();
        });

        it("retorna um horário para uma mensagem de hoje", () => {
            const agora = new Date();

            const data = new Date(
                Date.UTC(
                    agora.getFullYear(),
                    agora.getMonth(),
                    agora.getDate(),
                    12,
                    30
                )
            );

            expect(formatarHorarioMensagem(data)).toMatch(/^\d{2}:\d{2}$/);
        });

        it("retorna Ontem para uma mensagem do dia anterior", () => {
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1);

            const data = new Date(Date.UTC(
                ontem.getFullYear(),
                ontem.getMonth(),
                ontem.getDate(),
                12,
                0
            ));

            expect(formatarHorarioMensagem(data)).toBe("Ontem");
        });

        it("retorna a data formatada para mensagens antigas", () => {
            const data = new Date("2020-01-15T12:00:00Z");

            expect(formatarHorarioMensagem(data)).toBe(
                data.toLocaleDateString("pt-BR")
            );
        });
    });

    // =====================================================
    // obterHoraAtual
    // =====================================================

    describe("obterHoraAtual", () => {

        it("retorna o horário atual no formato HH:MM", () => {
            expect(obterHoraAtual()).toMatch(/^\d{2}:\d{2}$/);
        });
    });
});
