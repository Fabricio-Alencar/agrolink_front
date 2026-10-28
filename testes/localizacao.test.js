
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

describe("Localização do cadastro", () => {
    let estadoSelect;
    let cidadeSelect;

    beforeEach(async () => {
        document.body.innerHTML = `
            <select id="estado"></select>
            <select id="cidade"></select>
        `;

        estadoSelect = document.getElementById("estado");
        cidadeSelect = document.getElementById("cidade");

        vi.resetModules();

        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation(async (url) => {
                if (url.includes("/municipios")) {
                    return {
                        json: async () => [
                            { nome: "Campinas" },
                            { nome: "Santos" }
                        ]
                    };
                }

                return {
                    json: async () => [
                        { sigla: "SP", nome: "São Paulo" },
                        { sigla: "RJ", nome: "Rio de Janeiro" }
                    ]
                };
            })
        );

        await import("../static/js/cadastro/localizacao.js");

        await vi.waitFor(() => {
            expect(estadoSelect.options.length).toBe(3);
        });
    });

    it("deve carregar os estados", () => {
        expect(estadoSelect.options[1].value).toBe("SP");
        expect(estadoSelect.options[1].textContent).toBe("São Paulo");

        expect(estadoSelect.options[2].value).toBe("RJ");
        expect(estadoSelect.options[2].textContent)
            .toBe("Rio de Janeiro");
    });

    it("deve buscar cidades ao selecionar um estado", async () => {
        estadoSelect.value = "SP";
        estadoSelect.dispatchEvent(new Event("change"));

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/estados/SP/municipios")
            );
        });
    });

    it("deve exibir as cidades recebidas", async () => {
        estadoSelect.value = "SP";
        estadoSelect.dispatchEvent(new Event("change"));

        await vi.waitFor(() => {
            expect(
                [...cidadeSelect.options].some(
                    option => option.value === "Campinas"
                )
            ).toBe(true);
        });

        expect(
            [...cidadeSelect.options].some(
                option => option.value === "Santos"
            )
        ).toBe(true);
    });

    it("não deve buscar cidades quando o estado estiver vazio", async () => {
        const chamadasAntes = fetch.mock.calls.length;

        estadoSelect.value = "";
        estadoSelect.dispatchEvent(new Event("change"));

        await Promise.resolve();

        expect(fetch).toHaveBeenCalledTimes(chamadasAntes);
    });
});
