import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createContext, runInContext } from "node:vm";

describe("Sistema de notificações", () => {

    let codigo;
    let contexto;

    beforeEach(async () => {
        vi.useFakeTimers();

        document.body.innerHTML = "";
        sessionStorage.clear();

        codigo = await readFile(
            resolve(process.cwd(), "static/js/notificacao.js"),
            "utf8"
        );

        contexto = createContext({
            window,
            document,
            sessionStorage,
            setTimeout: (...args) => globalThis.setTimeout(...args)
        });

        runInContext(codigo, contexto, {
            filename: resolve(process.cwd(), "static/js/notificacao.js")
        });
    });

    afterEach(() => {
        document.body.innerHTML = "";
        sessionStorage.clear();

        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    function exibir(tipo, mensagem) {
        return contexto.exibirNotificacao(tipo, mensagem);
    }

    function agendar(tipo, mensagem) {
        return contexto.agendarNotificacao(tipo, mensagem);
    }

    describe("exibirNotificacao", () => {

        it("cria o container de notificações quando não existe", () => {
            exibir("cadastro", "Produto cadastrado");

            expect(document.getElementById("toast-container")).not.toBeNull();
        });

        it("define a classe do container", () => {
            exibir("cadastro", "Produto cadastrado");

            expect(
                document.getElementById("toast-container")
                    .classList.contains("toast-container")
            ).toBe(true);
        });

        it("cria uma notificação dentro do container", () => {
            exibir("cadastro", "Produto cadastrado");

            expect(
                document.querySelector("#toast-container .notificacao-base")
            ).not.toBeNull();
        });

        it("exibe a mensagem informada", () => {
            exibir("cadastro", "Produto cadastrado");

            expect(
                document.querySelector(".notificacao-texto").textContent
            ).toBe("Produto cadastrado");
        });

        it("adiciona notificações ao mesmo container", () => {
            exibir("cadastro", "Primeira");
            exibir("edicao", "Segunda");

            expect(
                document.querySelectorAll("#toast-container .notificacao-base")
            ).toHaveLength(2);

            expect(
                document.querySelectorAll("#toast-container")
            ).toHaveLength(1);
        });

        it("cria uma imagem para a notificação", () => {
            exibir("cadastro", "Teste");

            const imagem = document.querySelector(".notificacao-icone");

            expect(imagem).not.toBeNull();
            expect(imagem.getAttribute("alt")).toBe("ícone");
        });
    });

    describe("Tipos de notificação", () => {

        it("utiliza estilo de sucesso para cadastro", () => {
            exibir("cadastro", "Cadastro concluído");

            const notificacao = document.querySelector(".notificacao-base");

            expect(
                notificacao.classList.contains("notificacao-sucesso")
            ).toBe(true);

            expect(
                notificacao.querySelector("img").getAttribute("src")
            ).toContain("produto_cadastrado.png");
        });

        it("utiliza estilo de edição", () => {
            exibir("edicao", "Produto editado");

            const notificacao = document.querySelector(".notificacao-base");

            expect(
                notificacao.classList.contains("notificacao-edicao")
            ).toBe(true);

            expect(
                notificacao.querySelector("img").getAttribute("src")
            ).toContain("produto_editado.png");
        });

        it("utiliza estilo de exclusão", () => {
            exibir("exclusao", "Produto excluído");

            const notificacao = document.querySelector(".notificacao-base");

            expect(
                notificacao.classList.contains("notificacao-exclusao")
            ).toBe(true);

            expect(
                notificacao.querySelector("img").getAttribute("src")
            ).toContain("produto_excluido.png");
        });

        it("utiliza estilo de erro", () => {
            exibir("erro", "Ocorreu um erro");

            const notificacao = document.querySelector(".notificacao-base");

            expect(
                notificacao.classList.contains("notificacao-erro")
            ).toBe(true);

            expect(
                notificacao.querySelector("img").getAttribute("src")
            ).toContain("erro.png");
        });

        it("utiliza estilo genérico para tipo desconhecido", () => {
            exibir("outro", "Notificação");

            const notificacao = document.querySelector(".notificacao-base");

            expect(
                notificacao.classList.contains("notificacao-generica")
            ).toBe(true);

            expect(
                notificacao.querySelector("img").getAttribute("src")
            ).toContain("generica.png");
        });
    });

    describe("Remoção automática", () => {

        it("não remove a notificação antes de quatro segundos", () => {
            exibir("cadastro", "Teste");

            vi.advanceTimersByTime(3999);

            expect(
                document.querySelector(".notificacao-base")
            ).not.toBeNull();
        });

        it("adiciona a classe saindo após quatro segundos", () => {
            exibir("cadastro", "Teste");

            vi.advanceTimersByTime(4000);

            expect(
                document.querySelector(".notificacao-base")
                    .classList.contains("saindo")
            ).toBe(true);
        });

        it("remove a notificação após a animação de saída", () => {
            exibir("cadastro", "Teste");

            vi.advanceTimersByTime(4500);

            expect(
                document.querySelector(".notificacao-base")
            ).toBeNull();
        });

        it("mantém a notificação durante os 500ms da animação", () => {
            exibir("cadastro", "Teste");

            vi.advanceTimersByTime(4000);

            expect(
                document.querySelector(".notificacao-base")
            ).not.toBeNull();

            vi.advanceTimersByTime(499);

            expect(
                document.querySelector(".notificacao-base")
            ).not.toBeNull();
        });

        it("remove notificações independentemente", () => {
            exibir("cadastro", "Primeira");

            vi.advanceTimersByTime(2000);

            exibir("edicao", "Segunda");

            vi.advanceTimersByTime(2000);

            expect(
                document.querySelectorAll(".notificacao-base")
            ).toHaveLength(2);

            vi.advanceTimersByTime(2000);

            expect(
                document.querySelectorAll(".notificacao-base")
            ).toHaveLength(1);

            expect(
                document.querySelector(".notificacao-texto").textContent
            ).toBe("Segunda");
        });
    });

    describe("agendarNotificacao", () => {

        it("armazena a notificação no sessionStorage", () => {
            agendar("cadastro", "Produto cadastrado");

            expect(
                sessionStorage.getItem("notificacao_pendente")
            ).not.toBeNull();
        });

        it("armazena os dados em formato JSON", () => {
            agendar("edicao", "Produto editado");

            expect(
                JSON.parse(sessionStorage.getItem("notificacao_pendente"))
            ).toEqual({
                tipo: "edicao",
                mensagem: "Produto editado"
            });
        });

        it("substitui notificação anteriormente agendada", () => {
            agendar("cadastro", "Primeira");
            agendar("erro", "Segunda");

            expect(
                JSON.parse(sessionStorage.getItem("notificacao_pendente"))
            ).toEqual({
                tipo: "erro",
                mensagem: "Segunda"
            });
        });
    });

    describe("Notificação pendente ao carregar a página", () => {

        it("exibe notificação pendente ao disparar DOMContentLoaded", () => {
            sessionStorage.setItem(
                "notificacao_pendente",
                JSON.stringify({
                    tipo: "cadastro",
                    mensagem: "Cadastro realizado"
                })
            );

            window.dispatchEvent(new Event("DOMContentLoaded"));

            expect(
                document.querySelector(".notificacao-texto").textContent
            ).toBe("Cadastro realizado");
        });

        it("remove a notificação pendente do sessionStorage após exibir", () => {
            sessionStorage.setItem(
                "notificacao_pendente",
                JSON.stringify({
                    tipo: "edicao",
                    mensagem: "Edição realizada"
                })
            );

            window.dispatchEvent(new Event("DOMContentLoaded"));

            expect(
                sessionStorage.getItem("notificacao_pendente")
            ).toBeNull();
        });

        it("não cria notificação quando não existe pendência", () => {
            window.dispatchEvent(new Event("DOMContentLoaded"));

            expect(
                document.querySelector(".notificacao-base")
            ).toBeNull();
        });

        it("exibe o tipo correto da notificação pendente", () => {
            sessionStorage.setItem(
                "notificacao_pendente",
                JSON.stringify({
                    tipo: "erro",
                    mensagem: "Falha na operação"
                })
            );

            window.dispatchEvent(new Event("DOMContentLoaded"));

            expect(
                document.querySelector(".notificacao-base")
                    .classList.contains("notificacao-erro")
            ).toBe(true);
        });
    });
});