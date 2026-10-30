
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";



describe("Avaliações", () => {
    let Avaliacoes;


    beforeEach(async () => {
    document.body.innerHTML = "";

    vi.resetModules();

    delete window.Avaliacoes;

    await import("../../static/js/avaliacoes.js");

    Avaliacoes = window.Avaliacoes;
});

    afterEach(() => {
        delete window.Avaliacoes;
        delete globalThis.exibirNotificacao;
        vi.restoreAllMocks();
    });

    // =====================================================
    // UTILITÁRIOS
    // =====================================================

    describe("formatarNota", () => {
        it("formata nota inteira com uma casa decimal", () => {
            expect(Avaliacoes.formatarNota(5)).toBe("5,0");
        });

        it("formata nota decimal utilizando vírgula", () => {
            expect(Avaliacoes.formatarNota(4.5)).toBe("4,5");
        });

        it("converte texto numérico em nota", () => {
            expect(Avaliacoes.formatarNota("3.5")).toBe("3,5");
        });
    });

    describe("formatarData", () => {
        it("formata uma data ISO válida", () => {
            expect(
                Avaliacoes.formatarData("2025-05-06T12:00:00")
            ).toBe("06/05/2025");
        });

        it("retorna string vazia quando a data não é informada", () => {
            expect(Avaliacoes.formatarData(null)).toBe("");
            expect(Avaliacoes.formatarData(undefined)).toBe("");
            expect(Avaliacoes.formatarData("")).toBe("");
        });

        it("retorna string vazia para data inválida", () => {
            expect(
                Avaliacoes.formatarData("data inválida")
            ).toBe("");
        });
    });

    describe("escaparHTML", () => {
        it("escapa os caracteres HTML especiais", () => {
            expect(
                Avaliacoes.escaparHTML(
                    `<script>alert("teste")</script>`
                )
            ).toBe(
                "&lt;script&gt;alert(&quot;teste&quot;)&lt;/script&gt;"
            );
        });

        it("escapa apóstrofos", () => {
            expect(
                Avaliacoes.escaparHTML("usuário's")
            ).toBe("usuário&#39;s");
        });

        it("escapa o caractere &", () => {
            expect(
                Avaliacoes.escaparHTML("A & B")
            ).toBe("A &amp; B");
        });

        it("converte null e undefined em string vazia", () => {
            expect(Avaliacoes.escaparHTML(null)).toBe("");
            expect(Avaliacoes.escaparHTML(undefined)).toBe("");
        });

        it("converte números para string", () => {
            expect(Avaliacoes.escaparHTML(123)).toBe("123");
        });
    });

    // =====================================================
    // ESTRELAS
    // =====================================================

    describe("estrelas", () => {
        it("gera cinco estrelas para uma nota máxima", () => {
            const html = Avaliacoes.estrelas(5);

            expect((html.match(/<svg/g) || [])).toHaveLength(5);
            expect(html).toContain('aria-label="5,0 de 5 estrelas"');
        });

        it("gera estrelas vazias quando a nota é zero", () => {
            const html = Avaliacoes.estrelas(0);

            expect(html).toContain('aria-label="Sem avaliações"');
            expect((html.match(/<svg/g) || [])).toHaveLength(5);
            expect(html).toContain("#dcdcdc");
        });

        it("gera estrelas vazias quando a nota é null", () => {
            const html = Avaliacoes.estrelas(null);

            expect(html).toContain('aria-label="Sem avaliações"');
        });

        it("gera uma estrela meia quando a nota é 0.5", () => {
            const html = Avaliacoes.estrelas(0.5);

            expect(html).toContain("<linearGradient");
            expect(html).toContain('offset="50%"');
        });

        it("gera quatro estrelas cheias e uma meia para nota 4.5", () => {
            const html = Avaliacoes.estrelas(4.5);

            expect((html.match(/<svg/g) || [])).toHaveLength(5);
            expect(html).toContain("<linearGradient");
            expect(html).toContain('aria-label="4,5 de 5 estrelas"');
        });

        it("gera somente estrelas cheias para nota inteira", () => {
            const html = Avaliacoes.estrelas(3);

            expect(html).not.toContain("<linearGradient");
            expect((html.match(/<svg/g) || [])).toHaveLength(5);
        });

        it("utiliza o tamanho informado", () => {
            const html = Avaliacoes.estrelas(5, 24);

            expect(html).toContain('width="24"');
            expect(html).toContain('height="24"');
        });

        it("utiliza tamanho padrão quando não informado", () => {
            const html = Avaliacoes.estrelas(5);

            expect(html).toContain('width="16"');
            expect(html).toContain('height="16"');
        });

        it("gera identificadores diferentes para gradientes", () => {
            const primeira = Avaliacoes.estrelas(0.5);
            const segunda = Avaliacoes.estrelas(0.5);

            const idPrimeiro = primeira.match(/id="([^"]+)"/)?.[1];
            const idSegundo = segunda.match(/id="([^"]+)"/)?.[1];

            expect(idPrimeiro).toBeTruthy();
            expect(idSegundo).toBeTruthy();
            expect(idPrimeiro).not.toBe(idSegundo);
        });
    });

    // =====================================================
    // RESUMO
    // =====================================================

    describe("resumo", () => {
        it("mostra Sem avaliações quando a média é null", () => {
            const html = Avaliacoes.resumo(null, 0);

            expect(html).toContain("Sem avaliações");
            expect(html).toContain("sem-avaliacoes");
        });

        it("mostra Sem avaliações quando a média é undefined", () => {
            const html = Avaliacoes.resumo(undefined, 0);

            expect(html).toContain("Sem avaliações");
        });

        it("mostra Sem avaliações quando o total é zero", () => {
            const html = Avaliacoes.resumo(4.5, 0);

            expect(html).toContain("Sem avaliações");
        });

        it("mostra média e quantidade de avaliações", () => {
            const html = Avaliacoes.resumo(4.5, 12);

            expect(html).toContain("4,5");
            expect(html).toContain("12 avaliações");
        });

        it("utiliza avaliação no singular quando o total é um", () => {
            const html = Avaliacoes.resumo(5, 1);

            expect(html).toContain("1 avaliação");
            expect(html).not.toContain("1 avaliações");
        });

        it("permite personalizar o tamanho das estrelas", () => {
            const html = Avaliacoes.resumo(5, 2, 30);

            expect(html).toContain('width="30"');
            expect(html).toContain('height="30"');
        });
    });

    // =====================================================
    // SELETOR DE ESTRELAS
    // =====================================================

    describe("criarSeletor", () => {
        let container;
        let callback;

        beforeEach(() => {
            container = document.createElement("div");
            document.body.appendChild(container);

            callback = vi.fn();

            // O método é interno. O seletor é exercitado pelo modal.
            Avaliacoes.abrirModal({
                onEnviar: vi.fn()
            });

            container = document.querySelector("#seletorAvaliacao");
        });

        it("cria cinco elementos de estrela no modal", () => {
            expect(
                container.querySelectorAll(".seletor-estrela")
            ).toHaveLength(5);
        });

        it("configura o papel de slider para acessibilidade", () => {
            expect(container.getAttribute("role")).toBe("slider");
            expect(container.getAttribute("aria-label")).toBe(
                "Nota de 0,5 a 5 estrelas"
            );
            expect(container.getAttribute("aria-valuemin")).toBe("0.5");
            expect(container.getAttribute("aria-valuemax")).toBe("5");
        });

        it("inicia sem nota selecionada", () => {
            expect(container.hasAttribute("aria-valuenow")).toBe(false);
        });

        it("seleciona meia estrela pelo lado esquerdo", () => {
            const estrela = container.querySelector(
                '.seletor-estrela[data-valor="1"]'
            );

            vi.spyOn(estrela, "getBoundingClientRect").mockReturnValue({
                left: 0,
                width: 100,
                right: 100,
                top: 0,
                bottom: 40,
                height: 40,
                x: 0,
                y: 0,
                toJSON: () => ({})
            });

            estrela.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true,
                    clientX: 20
                })
            );

            expect(container.getAttribute("aria-valuenow")).toBe("0.5");
            expect(container.getAttribute("aria-valuetext")).toBe(
                "0,5 estrelas"
            );
        });

        it("seleciona uma estrela inteira pelo lado direito", () => {
            const estrela = container.querySelector(
                '.seletor-estrela[data-valor="1"]'
            );

            vi.spyOn(estrela, "getBoundingClientRect").mockReturnValue({
                left: 0,
                width: 100,
                right: 100,
                top: 0,
                bottom: 40,
                height: 40,
                x: 0,
                y: 0,
                toJSON: () => ({})
            });

            estrela.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true,
                    clientX: 80
                })
            );

            expect(container.getAttribute("aria-valuenow")).toBe("1");
        });

        it("permite selecionar nota máxima", () => {
            const estrela = container.querySelector(
                '.seletor-estrela[data-valor="5"]'
            );

            vi.spyOn(estrela, "getBoundingClientRect").mockReturnValue({
                left: 0,
                width: 100,
                right: 100,
                top: 0,
                bottom: 40,
                height: 40,
                x: 0,
                y: 0,
                toJSON: () => ({})
            });

            estrela.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true,
                    clientX: 80
                })
            );

            expect(container.getAttribute("aria-valuenow")).toBe("5");
        });

        it("permite aumentar a nota com ArrowRight", () => {
            container.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            expect(container.getAttribute("aria-valuenow")).toBe("0.5");
        });

        it("permite aumentar a nota com ArrowUp", () => {
            container.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowUp",
                    bubbles: true
                })
            );

            expect(container.getAttribute("aria-valuenow")).toBe("0.5");
        });

        it("permite diminuir a nota com ArrowLeft", () => {
            container.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            container.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowLeft",
                    bubbles: true
                })
            );

            expect(container.getAttribute("aria-valuenow")).toBe("0.5");
        });

        it("permite diminuir a nota com ArrowDown", () => {
            container.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            container.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowDown",
                    bubbles: true
                })
            );

            expect(container.getAttribute("aria-valuenow")).toBe("0.5");
        });

        it("não permite ultrapassar a nota máxima", () => {
            for (let i = 0; i < 12; i++) {
                container.dispatchEvent(
                    new KeyboardEvent("keydown", {
                        key: "ArrowRight",
                        bubbles: true
                    })
                );
            }

            expect(container.getAttribute("aria-valuenow")).toBe("5");
        });

        it("restaura a nota selecionada quando o mouse sai", () => {
            const estrela = container.querySelector(
                '.seletor-estrela[data-valor="1"]'
            );

            vi.spyOn(estrela, "getBoundingClientRect").mockReturnValue({
                left: 0,
                width: 100,
                right: 100,
                top: 0,
                bottom: 40,
                height: 40,
                x: 0,
                y: 0,
                toJSON: () => ({})
            });

            estrela.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true,
                    clientX: 80
                })
            );

            container.dispatchEvent(
                new MouseEvent("mouseleave")
            );

            expect(container.getAttribute("aria-valuenow")).toBe("1");
        });
    });

    // =====================================================
    // MODAL
    // =====================================================

    describe("abrirModal", () => {
        it("cria o modal quando ele ainda não existe", () => {
            Avaliacoes.abrirModal();

            expect(
                document.getElementById("modalAvaliacao")
            ).not.toBeNull();
        });

        it("reutiliza o modal existente", () => {
            Avaliacoes.abrirModal();
            const primeiro = document.getElementById("modalAvaliacao");

            Avaliacoes.abrirModal();
            const segundo = document.getElementById("modalAvaliacao");

            expect(segundo).toBe(primeiro);
            expect(
                document.querySelectorAll("#modalAvaliacao")
            ).toHaveLength(1);
        });

        it("exibe o modal com a classe ativo", () => {
            Avaliacoes.abrirModal();

            expect(
                document.getElementById("modalAvaliacao")
                    .classList.contains("ativo")
            ).toBe(true);
        });

        it("preenche o subtítulo informado", () => {
            Avaliacoes.abrirModal({
                subtitulo: "Pedido de milho"
            });

            expect(
                document.getElementById("subtituloAvaliacao").textContent
            ).toBe("Pedido de milho");
        });

        it("limpa o comentário ao abrir", () => {
            Avaliacoes.abrirModal();

            const comentario = document.getElementById(
                "comentarioAvaliacao"
            );

            comentario.value = "Comentário anterior";

            Avaliacoes.abrirModal();

            expect(comentario.value).toBe("");
        });

        it("inicia o botão de envio desabilitado", () => {
            Avaliacoes.abrirModal();

            expect(
                document.getElementById("btnEnviarAvaliacao").disabled
            ).toBe(true);
        });

        it("define o limite de caracteres do comentário", () => {
            Avaliacoes.abrirModal();

            expect(
                document.getElementById("comentarioAvaliacao").maxLength
            ).toBe(500);

            expect(Avaliacoes.TAMANHO_MAXIMO_COMENTARIO).toBe(500);
        });

        it("atualiza o contador de caracteres do comentário", () => {
            Avaliacoes.abrirModal();

            const comentario = document.getElementById(
                "comentarioAvaliacao"
            );

            comentario.value = "Excelente";
            comentario.dispatchEvent(new Event("input"));

            expect(
                document.getElementById("contadorAvaliacao").textContent
            ).toBe("9/500");
        });

        it("habilita o botão após selecionar uma nota", () => {
            Avaliacoes.abrirModal();

            const seletor = document.getElementById(
                "seletorAvaliacao"
            );

            seletor.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            expect(
                document.getElementById("btnEnviarAvaliacao").disabled
            ).toBe(false);
        });

        it("atualiza a legenda de acordo com a nota", () => {
            Avaliacoes.abrirModal();

            const seletor = document.getElementById(
                "seletorAvaliacao"
            );

            seletor.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            expect(
                document.getElementById("legendaAvaliacao").textContent
            ).toBe("0,5 · Muito ruim");
        });

        it("fecha o modal pelo botão de fechar", () => {
            const onFechar = vi.fn();

            Avaliacoes.abrirModal({ onFechar });

            document.querySelector(
                ".modal-avaliacao-fechar"
            ).click();

            expect(
                document.getElementById("modalAvaliacao")
                    .classList.contains("ativo")
            ).toBe(false);

            expect(onFechar).toHaveBeenCalledTimes(1);
        });

        it("fecha o modal pelo botão Avaliar depois", () => {
            const onFechar = vi.fn();

            Avaliacoes.abrirModal({ onFechar });

            document.getElementById("btnAvaliarDepois").click();

            expect(
                document.getElementById("modalAvaliacao")
                    .classList.contains("ativo")
            ).toBe(false);

            expect(onFechar).toHaveBeenCalledTimes(1);
        });

        it("fecha o modal ao clicar no fundo", () => {
            Avaliacoes.abrirModal();

            const modal = document.getElementById("modalAvaliacao");

            modal.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true
                })
            );

            expect(modal.classList.contains("ativo")).toBe(false);
        });

        it("não fecha o modal ao clicar no conteúdo interno", () => {
            Avaliacoes.abrirModal();

            const modal = document.getElementById("modalAvaliacao");
            const conteudo = modal.querySelector(
                ".modal-avaliacao-conteudo"
            );

            conteudo.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true
                })
            );

            expect(modal.classList.contains("ativo")).toBe(true);
        });

        it("fecha o modal ao pressionar Escape", () => {
            Avaliacoes.abrirModal();

            document.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Escape"
                })
            );

            expect(
                document.getElementById("modalAvaliacao")
                    .classList.contains("ativo")
            ).toBe(false);
        });

        it("não fecha o modal ao pressionar outra tecla", () => {
            Avaliacoes.abrirModal();

            document.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Enter"
                })
            );

            expect(
                document.getElementById("modalAvaliacao")
                    .classList.contains("ativo")
            ).toBe(true);
        });

        it("envia nota e comentário sem espaços nas extremidades", async () => {
            const onEnviar = vi.fn().mockResolvedValue();

            Avaliacoes.abrirModal({ onEnviar });

            const seletor = document.getElementById(
                "seletorAvaliacao"
            );

            seletor.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            const comentario = document.getElementById(
                "comentarioAvaliacao"
            );

            comentario.value = "  Muito bom!  ";

            document.getElementById("btnEnviarAvaliacao").click();

            await Promise.resolve();
            await Promise.resolve();

            expect(onEnviar).toHaveBeenCalledWith(
                0.5,
                "Muito bom!"
            );
        });

        it("fecha o modal após envio bem-sucedido", async () => {
            const onEnviar = vi.fn().mockResolvedValue();

            Avaliacoes.abrirModal({ onEnviar });

            document.getElementById("seletorAvaliacao").dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            document.getElementById("btnEnviarAvaliacao").click();

            await Promise.resolve();
            await Promise.resolve();

            expect(
                document.getElementById("modalAvaliacao")
                    .classList.contains("ativo")
            ).toBe(false);
        });

        it("exibe estado Enviando durante o envio", async () => {
            let resolver;

            const onEnviar = vi.fn(
                () => new Promise(resolve => {
                    resolver = resolve;
                })
            );

            Avaliacoes.abrirModal({ onEnviar });

            document.getElementById("seletorAvaliacao").dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            const botao = document.getElementById("btnEnviarAvaliacao");

            botao.click();

            expect(botao.textContent).toBe("Enviando...");
            expect(botao.disabled).toBe(true);

            resolver();

            await Promise.resolve();
            await Promise.resolve();
        });

        it("mantém o modal aberto quando o envio falha", async () => {
            const onEnviar = vi.fn().mockRejectedValue(
                new Error("Falha no envio")
            );

            Avaliacoes.abrirModal({ onEnviar });

            document.getElementById("seletorAvaliacao").dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            document.getElementById("btnEnviarAvaliacao").click();

            await Promise.resolve();
            await Promise.resolve();

            const modal = document.getElementById("modalAvaliacao");
            const botao = document.getElementById("btnEnviarAvaliacao");

            expect(modal.classList.contains("ativo")).toBe(true);
            expect(botao.disabled).toBe(false);
            expect(botao.textContent).toBe("Enviar avaliação");
        });

        it("exibe notificação quando o envio falha", async () => {
            globalThis.exibirNotificacao = vi.fn();

            const onEnviar = vi.fn().mockRejectedValue(
                new Error("Erro de conexão")
            );

            Avaliacoes.abrirModal({ onEnviar });

            document.getElementById("seletorAvaliacao").dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            document.getElementById("btnEnviarAvaliacao").click();

            await Promise.resolve();
            await Promise.resolve();

            expect(globalThis.exibirNotificacao).toHaveBeenCalledWith(
                "erro",
                "Erro de conexão"
            );
        });

        it("utiliza mensagem padrão quando o erro não possui mensagem", async () => {
            globalThis.exibirNotificacao = vi.fn();

            const onEnviar = vi.fn().mockRejectedValue({});

            Avaliacoes.abrirModal({ onEnviar });

            document.getElementById("seletorAvaliacao").dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    bubbles: true
                })
            );

            document.getElementById("btnEnviarAvaliacao").click();

            await Promise.resolve();
            await Promise.resolve();

            expect(globalThis.exibirNotificacao).toHaveBeenCalledWith(
                "erro",
                "Não foi possível enviar a avaliação."
            );
        });

        it("não envia avaliação sem nota escolhida", async () => {
            const onEnviar = vi.fn();

            Avaliacoes.abrirModal({ onEnviar });

            document.getElementById("btnEnviarAvaliacao").click();

            expect(onEnviar).not.toHaveBeenCalled();
        });
    });
});
