
import { describe, it, expect } from "vitest";

import {
    renderizarEstrelas,
    formatarPreco
} from "../../static/js/estabelecimentos/market_place_estabelecimentos/estrelas_formatacao_preco.js";

describe("Formatação de estrelas e preços", () => {

    // =========================================================
    // TESTES DE RENDERIZAR ESTRELAS
    // =========================================================

    describe("renderizarEstrelas()", () => {

        it("deve retornar cinco estrelas", () => {
            const resultado = renderizarEstrelas(5);

            expect(resultado.match(/<svg/g)).toHaveLength(5);
        });

        it("deve renderizar estrelas preenchidas para nota 5", () => {
            const resultado = renderizarEstrelas(5);

            expect(resultado.match(/fill="#ffd700"/g)).toHaveLength(5);
        });

        it("deve renderizar estrelas vazias para nota 0", () => {
            const resultado = renderizarEstrelas(0);

            expect(resultado.match(/fill="#e0e0e0"/g)).toHaveLength(5);
        });

        it("deve renderizar estrelas parcialmente preenchidas para nota 3.5", () => {
            const resultado = renderizarEstrelas(3.5);

            expect(resultado).toContain("halfGrad4");
            expect(resultado).toContain("#ffd700");
            expect(resultado).toContain("#e0e0e0");
        });

        it("deve retornar uma string HTML", () => {
            const resultado = renderizarEstrelas(4);

            expect(typeof resultado).toBe("string");
        });

    });

    // =========================================================
    // TESTES DE FORMATAR PREÇO
    // =========================================================

    describe("formatarPreco()", () => {

        it("deve formatar um preço com duas casas decimais", () => {
            expect(formatarPreco(10)).toBe("10,00");
        });

        it("deve substituir o ponto por vírgula", () => {
            expect(formatarPreco(25.50)).toBe("25,50");
        });

        it("deve formatar valores com centavos", () => {
            expect(formatarPreco(99.99)).toBe("99,99");
        });

        it("deve formatar valores inteiros", () => {
            expect(formatarPreco(100)).toBe("100,00");
        });

        it("deve formatar zero", () => {
            expect(formatarPreco(0)).toBe("0,00");
        });

    });

});
