import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Estado do chat", () => {
    let estado;

    beforeEach(async () => {
        vi.resetModules();
        estado = await import("../../static/js/chat/estado.js");
    });

    it("deve iniciar com negociação atual nula", () => {
        expect(estado.getNegociacaoAtual()).toBeNull();
    });

    it("deve armazenar a negociação atual", () => {
        estado.setNegociacaoAtual(10);

        expect(estado.getNegociacaoAtual()).toBe(10);
    });

    it("deve permitir limpar a negociação atual", () => {
        estado.setNegociacaoAtual(10);
        estado.setNegociacaoAtual(null);

        expect(estado.getNegociacaoAtual()).toBeNull();
    });

    it("deve iniciar com informações da negociação nulas", () => {
        expect(estado.getNegociacaoInfo()).toBeNull();
    });

    it("deve armazenar as informações da negociação", () => {
        const dados = { id: 10, produto: "Milho" };

        estado.setNegociacaoInfo(dados);

        expect(estado.getNegociacaoInfo()).toEqual(dados);
    });

    it("deve permitir limpar as informações da negociação", () => {
        estado.setNegociacaoInfo({ id: 10 });
        estado.setNegociacaoInfo(null);

        expect(estado.getNegociacaoInfo()).toBeNull();
    });

    it("deve iniciar com socket nulo", () => {
        expect(estado.getSocket()).toBeNull();
    });

    it("deve armazenar um socket", () => {
        const socket = { readyState: 1 };

        estado.setSocket(socket);

        expect(estado.getSocket()).toBe(socket);
    });

    it("deve permitir limpar o socket", () => {
        estado.setSocket({ readyState: 1 });
        estado.setSocket(null);

        expect(estado.getSocket()).toBeNull();
    });
});