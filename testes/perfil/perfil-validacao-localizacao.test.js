
import {
    describe, it, expect, beforeAll, beforeEach, vi
} from "vitest";

let localizacaoValida;
let avisarLocalizacaoInvalida;

describe("Validação da localização", () => {
    beforeAll(async () => {
        document.body.innerHTML = `
            <select id="profile-state">
                <option value="">Selecione o estado</option>
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
            </select>

            <select id="profile-city">
                <option value="">Selecione a cidade</option>
                <option value="Campinas">Campinas</option>
                <option value="Santos">Santos</option>
            </select>
        `;

        ({ localizacaoValida, avisarLocalizacaoInvalida } =
            await import("../../static/js/perfil/validacao-localizacao.js"));
    });

    beforeEach(() => {
        vi.stubGlobal("exibirNotificacao", vi.fn());

        document.getElementById("profile-state").value = "SP";
        document.getElementById("profile-city").value = "Campinas";
    });

    it("retorna true quando estado e cidade são válidos", () => {
        expect(localizacaoValida()).toBe(true);
    });

    it("retorna false quando o estado está vazio", () => {
        document.getElementById("profile-state").value = "";

        expect(localizacaoValida()).toBe(false);
    });

    it("retorna false quando a cidade está vazia", () => {
        document.getElementById("profile-city").value = "";

        expect(localizacaoValida()).toBe(false);
    });

    it("rejeita uma opção com texto de seleção inválido", () => {
        const estado = document.getElementById("profile-state");
        estado.add(new Option("Escolha um estado", "SP"));
        estado.selectedIndex = estado.options.length - 1;

        expect(localizacaoValida()).toBe(false);
    });

    it("avisa e foca o estado quando ele não foi selecionado", () => {
        const estado = document.getElementById("profile-state");
        estado.value = "";

        const foco = vi.spyOn(estado, "focus");

        avisarLocalizacaoInvalida();

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Selecione um estado e uma cidade antes de salvar."
        );
        expect(foco).toHaveBeenCalled();
    });

    it("foca a cidade quando o estado está preenchido", () => {
        const cidade = document.getElementById("profile-city");
        const foco = vi.spyOn(cidade, "focus");

        avisarLocalizacaoInvalida();

        expect(foco).toHaveBeenCalled();
    });

    it("funciona sem a função global de notificação", () => {
        delete globalThis.exibirNotificacao;

        expect(() => avisarLocalizacaoInvalida()).not.toThrow();
    });
});
