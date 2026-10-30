import { describe, it, expect, beforeEach, vi } from "vitest";

import {
    montarSecoesConversas,
    atualizarContadorArquivadas
} from "../../static/js/chat/conversas-arquivadas.js";

describe("Conversas arquivadas", () => {
    let lista;

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="chatSearch">
            <div id="listaConversas"></div>
        `;

        lista = document.getElementById("listaConversas");

        window.lucide = {
            createIcons: vi.fn()
        };
    });

    it("deve montar as seções de conversas", () => {
        const secoes = montarSecoesConversas(lista);

        expect(secoes.listaAtivas).toBeInstanceOf(HTMLDivElement);
        expect(secoes.listaArquivadas).toBeInstanceOf(HTMLDivElement);
        expect(secoes.secaoArquivadas).toBeInstanceOf(HTMLElement);
        expect(secoes.conteudoArquivadas).toBeInstanceOf(HTMLDivElement);
        expect(secoes.contadorArquivadas).toBeInstanceOf(HTMLElement);
    });

    it("deve iniciar a seção arquivada oculta", () => {
        const secoes = montarSecoesConversas(lista);

        expect(secoes.secaoArquivadas.hidden).toBe(true);
        expect(secoes.conteudoArquivadas.hidden).toBe(true);
    });

    it("deve iniciar o botão com aria-expanded false", () => {
        montarSecoesConversas(lista);

        const botao = lista.querySelector(".conversas-arquivadas-toggle");

        expect(botao.getAttribute("aria-expanded")).toBe("false");
    });

    it("deve expandir as conversas arquivadas ao clicar", () => {
        const secoes = montarSecoesConversas(lista);

        lista.querySelector(".conversas-arquivadas-toggle").click();

        expect(secoes.conteudoArquivadas.hidden).toBe(false);
        expect(secoes.listaAtivas.hidden).toBe(true);
        expect(secoes.secaoArquivadas.classList.contains("expandida")).toBe(true);
        expect(secoes.secaoArquivadas.hidden).toBe(false);
    });

    it("deve recolher as conversas arquivadas ao clicar novamente", () => {
        const secoes = montarSecoesConversas(lista);
        const botao = lista.querySelector(".conversas-arquivadas-toggle");

        botao.click();
        botao.click();

        expect(botao.getAttribute("aria-expanded")).toBe("false");
        expect(secoes.conteudoArquivadas.hidden).toBe(true);
        expect(secoes.listaAtivas.hidden).toBe(false);
        expect(secoes.secaoArquivadas.classList.contains("expandida")).toBe(false);
    });

    it("deve chamar lucide.createIcons quando disponível", () => {
        montarSecoesConversas(lista);

        expect(window.lucide.createIcons).toHaveBeenCalled();
    });

    it("deve somar as mensagens não lidas", () => {
        const secoes = montarSecoesConversas(lista);

        secoes.listaArquivadas.innerHTML = `
            <button class="conversa-item" data-nao-lidas="2"></button>
            <button class="conversa-item" data-nao-lidas="3"></button>
        `;

        atualizarContadorArquivadas(secoes);

        expect(secoes.contadorArquivadas.textContent).toBe("5");
        expect(secoes.contadorArquivadas.hidden).toBe(false);
    });

    it("deve ignorar contadores inválidos e negativos", () => {
        const secoes = montarSecoesConversas(lista);

        secoes.listaArquivadas.innerHTML = `
            <button class="conversa-item" data-nao-lidas="abc"></button>
            <button class="conversa-item" data-nao-lidas="-2"></button>
            <button class="conversa-item" data-nao-lidas="4"></button>
        `;

        atualizarContadorArquivadas(secoes);

        expect(secoes.contadorArquivadas.textContent).toBe("4");
    });

    it("deve ocultar o contador quando não houver mensagens não lidas", () => {
        const secoes = montarSecoesConversas(lista);

        secoes.listaArquivadas.innerHTML = `
            <button class="conversa-item" data-nao-lidas="0"></button>
        `;

        atualizarContadorArquivadas(secoes);

        expect(secoes.contadorArquivadas.textContent).toBe("0");
        expect(secoes.contadorArquivadas.hidden).toBe(true);
    });

    it("deve ocultar a seção quando não houver conversas arquivadas", () => {
        const secoes = montarSecoesConversas(lista);

        atualizarContadorArquivadas(secoes);

        expect(secoes.secaoArquivadas.hidden).toBe(true);
    });

    it("não deve alterar a visibilidade da seção durante uma pesquisa", () => {
        const secoes = montarSecoesConversas(lista);

        secoes.listaArquivadas.innerHTML = `
            <button class="conversa-item" data-nao-lidas="1"></button>
        `;

        secoes.secaoArquivadas.hidden = false;
        document.getElementById("chatSearch").value = "milho";

        atualizarContadorArquivadas(secoes);

        expect(secoes.secaoArquivadas.hidden).toBe(false);
    });

    it("deve retornar sem erro quando os elementos obrigatórios estiverem ausentes", () => {
        expect(() => atualizarContadorArquivadas({})).not.toThrow();
    });
});