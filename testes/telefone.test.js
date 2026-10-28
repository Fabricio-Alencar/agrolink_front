
import { beforeEach, describe, expect, it, vi } from "vitest";

let DOM;
let telefone;
let obterDigitosTelefone;
let formatarTelefone;
let telefoneValido;
let configurarCampoTelefone;

beforeEach(async () => {
    // Cria os campos antes de carregar os módulos
    document.body.innerHTML = `
        <input class="form-control" id="campo1">
        <input class="form-control" id="campo2">
        <input class="form-control" id="telefone">
    `;

    // Recarrega os módulos para que DOM.inputs capture os campos atuais
    vi.resetModules();

    const moduloDOM = await import("../static/js/perfil/dom.js");
    const moduloTelefone = await import("../static/js/perfil/telefone.js");

    DOM = moduloDOM.DOM;

    ({
        obterDigitosTelefone,
        formatarTelefone,
        telefoneValido,
        configurarCampoTelefone
    } = moduloTelefone);

    telefone = DOM.inputs[2];
});

describe("Telefone", () => {
    it("deve extrair somente os números", () => {
        expect(obterDigitosTelefone("(11) 99999-9999"))
            .toBe("11999999999");
    });

    it("deve remover o código do Brasil", () => {
        expect(obterDigitosTelefone("+55 11 99999-9999"))
            .toBe("11999999999");
    });

    it("deve formatar um telefone com 11 dígitos", () => {
        expect(formatarTelefone("11999999999"))
            .toBe("(11) 99999-9999");
    });

    it("deve formatar um telefone com 10 dígitos", () => {
        expect(formatarTelefone("1133334444"))
            .toBe("(11) 3333-4444");
    });

    it("deve retornar uma string vazia quando não houver números", () => {
        expect(formatarTelefone("abc")).toBe("");
    });

    it("deve aceitar telefone vazio", () => {
        expect(telefoneValido("")).toBe(true);
    });

    it("deve aceitar telefone com 10 dígitos", () => {
        expect(telefoneValido("1133334444")).toBe(true);
    });

    it("deve aceitar telefone com 11 dígitos", () => {
        expect(telefoneValido("11999999999")).toBe(true);
    });

    it("deve rejeitar telefone incompleto", () => {
        expect(telefoneValido("119999")).toBe(false);
    });

    it("deve configurar os atributos do campo", () => {
        configurarCampoTelefone();

        expect(telefone.getAttribute("inputmode")).toBe("numeric");
        expect(telefone.getAttribute("autocomplete")).toBe("tel");
        expect(telefone.getAttribute("maxlength")).toBe("15");
    });

    it("deve aplicar a máscara ao digitar", () => {
        configurarCampoTelefone();

        telefone.value = "11999999999";
        telefone.dispatchEvent(new Event("input"));

        expect(telefone.value).toBe("(11) 99999-9999");
    });
});
