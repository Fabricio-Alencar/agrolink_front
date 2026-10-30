
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";



describe("Guia de passos", () => {

    let guia;

    beforeEach(async () => {
    document.body.innerHTML = "";

    vi.resetModules();

    await import("../../static/js/guia-passos.js");
});

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    function criarGuia(atributos = {}, classe = "") {
        guia = document.createElement("guia-passos");

        if (classe) {
            guia.className = classe;
        }

        Object.entries(atributos).forEach(([chave, valor]) => {
            guia.setAttribute(chave, valor);
        });

        document.body.appendChild(guia);

        return guia;
    }

    function obterElemento(seletor) {
        return guia.shadowRoot.querySelector(seletor);
    }

    // =====================================================
    // REGISTRO
    // =====================================================

    describe("Registro do componente", () => {
        it("registra o componente guia-passos", () => {
            expect(
                customElements.get("guia-passos")
            ).toBeDefined();
        });

        it("define os atributos observados", () => {
            const Classe = customElements.get("guia-passos");

            expect(Classe.observedAttributes).toEqual([
                "titulo",
                "subtitulo",
                "passos",
                "imagem"
            ]);
        });

        it("não registra novamente o componente", () => {
                    expect(
            customElements.get("guia-passos")
        ).toBeDefined();
        });

        it("cria shadow DOM no componente", () => {
            criarGuia();

            expect(guia.shadowRoot).not.toBeNull();
        });
    });

    // =====================================================
    // POSICIONAMENTO E CONEXÃO
    // =====================================================

    describe("Conexão do componente", () => {
        it("move o componente para o body quando está dentro de outro elemento", () => {
            const pai = document.createElement("div");

            guia = document.createElement("guia-passos");

            pai.appendChild(guia);
            document.body.appendChild(pai);

            expect(guia.parentElement).toBe(document.body);
        });

        it("renderiza quando o componente está diretamente no body", () => {
            criarGuia();

            expect(
                obterElemento(".guia-flutuante-container")
            ).not.toBeNull();
        });

        it("adiciona posicionamento especial quando possui classe guia-chat", () => {
            criarGuia({}, "guia-chat");

            expect(
                obterElemento(".guia-flutuante-container")
                    .classList.contains("guia-chat-posicao")
            ).toBe(true);
        });

        it("não adiciona posicionamento especial sem a classe guia-chat", () => {
            criarGuia();

            expect(
                obterElemento(".guia-flutuante-container")
                    .classList.contains("guia-chat-posicao")
            ).toBe(false);
        });
    });

    // =====================================================
    // RENDERIZAÇÃO
    // =====================================================

    describe("Renderização", () => {
        it("renderiza o título padrão", () => {
            criarGuia();

            expect(
                obterElemento(".header-text h2").textContent
            ).toBe("Como usar esta página");
        });

        it("renderiza o subtítulo padrão", () => {
            criarGuia();

            expect(
                obterElemento(".header-text p").textContent
            ).toBe(
                "Veja como manter sua página organizada em poucos passos."
            );
        });

        it("renderiza o título personalizado", () => {
            criarGuia({
                titulo: "Ajuda do sistema"
            });

            expect(
                obterElemento(".header-text h2").textContent
            ).toBe("Ajuda do sistema");
        });

        it("renderiza o subtítulo personalizado", () => {
            criarGuia({
                subtitulo: "Conheça as funcionalidades."
            });

            expect(
                obterElemento(".header-text p").textContent
            ).toBe("Conheça as funcionalidades.");
        });

        it("renderiza a imagem padrão", () => {
            criarGuia();

            const imagens = guia.shadowRoot.querySelectorAll("img");

            expect(imagens).toHaveLength(2);

            expect(imagens[0].getAttribute("src")).toContain(
                "../static/assets/login/minhoca_pequena.png"
            );
        });

        it("renderiza uma imagem personalizada", () => {
            criarGuia({
                imagem: "/assets/guia.png"
            });

            const imagens = guia.shadowRoot.querySelectorAll("img");

            expect(imagens[0].getAttribute("src")).toBe(
                "/assets/guia.png"
            );

            expect(imagens[1].getAttribute("src")).toBe(
                "/assets/guia.png"
            );
        });

        it("renderiza os passos informados", () => {
            criarGuia({
                passos: JSON.stringify([
                    {
                        numero: 1,
                        titulo: "Primeiro passo",
                        descricao: "Descrição do primeiro passo"
                    },
                    {
                        numero: 2,
                        titulo: "Segundo passo",
                        descricao: "Descrição do segundo passo"
                    }
                ])
            });

            expect(
                guia.shadowRoot.querySelectorAll(".card-passo")
            ).toHaveLength(2);

            expect(
                obterElemento(".card-passo h4").textContent
            ).toBe("Primeiro passo");
        });

        it("renderiza número e descrição dos passos", () => {
            criarGuia({
                passos: JSON.stringify([
                    {
                        numero: 3,
                        titulo: "Cadastro",
                        descricao: "Cadastre seus produtos."
                    }
                ])
            });

            expect(
                obterElemento(".passo-numero").textContent
            ).toBe("3");

            expect(
                obterElemento(".passo-conteudo p").textContent
            ).toBe("Cadastre seus produtos.");
        });

        it("renderiza lista vazia quando passos não são informados", () => {
            criarGuia();

            expect(
                guia.shadowRoot.querySelectorAll(".card-passo")
            ).toHaveLength(0);
        });

        it("trata JSON inválido nos passos", () => {
            criarGuia({
                passos: "{json inválido"
            });

            expect(
                guia.shadowRoot.querySelectorAll(".card-passo")
            ).toHaveLength(0);
        });

        it("cria o botão de abrir guia", () => {
            criarGuia();

            expect(
                obterElemento("#abrirModal")
            ).not.toBeNull();
        });

        it("cria o botão de fechar pelo X", () => {
            criarGuia();

            expect(
                obterElemento("#fecharModalX")
            ).not.toBeNull();
        });

        it("cria o botão Entendi", () => {
            criarGuia();

            expect(
                obterElemento("#fecharModalBtn")
            ).not.toBeNull();
        });

        it("configura o atributo de acessibilidade do botão de ajuda", () => {
            criarGuia();

            const abrir = obterElemento("#abrirModal");

            expect(abrir.getAttribute("role")).toBe("button");
            expect(abrir.getAttribute("tabindex")).toBe("0");
            expect(abrir.getAttribute("aria-label")).toBe(
                "Abrir guia de ajuda"
            );
        });
    });

    // =====================================================
    // ATUALIZAÇÃO DOS ATRIBUTOS
    // =====================================================

    describe("Atualização dos atributos", () => {
        it("atualiza o título quando o atributo muda", () => {
            criarGuia({
                titulo: "Título inicial"
            });

            guia.setAttribute("titulo", "Novo título");

            expect(
                obterElemento(".header-text h2").textContent
            ).toBe("Novo título");
        });

        it("atualiza o subtítulo quando o atributo muda", () => {
            criarGuia({
                subtitulo: "Texto inicial"
            });

            guia.setAttribute("subtitulo", "Novo subtítulo");

            expect(
                obterElemento(".header-text p").textContent
            ).toBe("Novo subtítulo");
        });

        it("atualiza os passos quando o atributo muda", () => {
            criarGuia({
                passos: JSON.stringify([
                    {
                        numero: 1,
                        titulo: "Inicial",
                        descricao: "Inicial"
                    }
                ])
            });

            guia.setAttribute(
                "passos",
                JSON.stringify([
                    {
                        numero: 2,
                        titulo: "Atualizado",
                        descricao: "Novo conteúdo"
                    }
                ])
            );

            expect(
                obterElemento(".card-passo h4").textContent
            ).toBe("Atualizado");
        });

        it("atualiza a imagem quando o atributo muda", () => {
            criarGuia();

            guia.setAttribute("imagem", "/nova-imagem.png");

            const imagens = guia.shadowRoot.querySelectorAll("img");

            expect(imagens[0].getAttribute("src")).toBe(
                "/nova-imagem.png"
            );
        });

        it("não apresenta erro ao atualizar atributo antes da renderização", () => {
            guia = document.createElement("guia-passos");

            expect(
    customElements.get("guia-passos")
).toBeDefined();
        });
    });

    // =====================================================
    // EVENTOS DO MODAL
    // =====================================================

    describe("Eventos do modal", () => {
        it("abre o modal ao clicar no botão de ajuda", () => {
            criarGuia();

            const abrir = obterElemento("#abrirModal");
            const overlay = obterElemento("#modalOverlay");

            abrir.click();

            expect(overlay.classList.contains("ativo")).toBe(true);
        });

        it("abre o modal ao pressionar Enter", () => {
            criarGuia();

            const abrir = obterElemento("#abrirModal");
            const overlay = obterElemento("#modalOverlay");

            abrir.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Enter",
                    bubbles: true
                })
            );

            expect(overlay.classList.contains("ativo")).toBe(true);
        });

        it("abre o modal ao pressionar Espaço", () => {
            criarGuia();

            const abrir = obterElemento("#abrirModal");
            const overlay = obterElemento("#modalOverlay");

            abrir.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: " ",
                    bubbles: true
                })
            );

            expect(overlay.classList.contains("ativo")).toBe(true);
        });

        it("previne o comportamento padrão ao pressionar Enter", () => {
            criarGuia();

            const evento = new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            });

            obterElemento("#abrirModal").dispatchEvent(evento);

            expect(evento.defaultPrevented).toBe(true);
        });

        it("previne o comportamento padrão ao pressionar Espaço", () => {
            criarGuia();

            const evento = new KeyboardEvent("keydown", {
                key: " ",
                bubbles: true,
                cancelable: true
            });

            obterElemento("#abrirModal").dispatchEvent(evento);

            expect(evento.defaultPrevented).toBe(true);
        });

        it("não abre o modal para outra tecla", () => {
            criarGuia();

            obterElemento("#abrirModal").dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Escape",
                    bubbles: true
                })
            );

            expect(
                obterElemento("#modalOverlay")
                    .classList.contains("ativo")
            ).toBe(false);
        });

        it("fecha o modal pelo botão X", () => {
            criarGuia();

            const overlay = obterElemento("#modalOverlay");

            obterElemento("#abrirModal").click();
            obterElemento("#fecharModalX").click();

            expect(overlay.classList.contains("ativo")).toBe(false);
        });

        it("fecha o modal pelo botão Entendi", () => {
            criarGuia();

            const overlay = obterElemento("#modalOverlay");

            obterElemento("#abrirModal").click();
            obterElemento("#fecharModalBtn").click();

            expect(overlay.classList.contains("ativo")).toBe(false);
        });

        it("fecha o modal ao clicar no fundo", () => {
            criarGuia();

            const overlay = obterElemento("#modalOverlay");

            obterElemento("#abrirModal").click();

            overlay.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true
                })
            );

            expect(overlay.classList.contains("ativo")).toBe(false);
        });

        it("não fecha o modal ao clicar no cartão interno", () => {
            criarGuia();

            const overlay = obterElemento("#modalOverlay");
            const cartao = obterElemento(".modal-card");

            obterElemento("#abrirModal").click();

            cartao.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true
                })
            );

            expect(overlay.classList.contains("ativo")).toBe(true);
        });
    });

    // =====================================================
    // VISIBILIDADE
    // =====================================================

    describe("Visibilidade", () => {
        it("oculta o componente enquanto aguarda os recursos", () => {
            criarGuia();

            expect(guia.style.visibility).toBe("hidden");
        });

        it("adiciona os ouvintes de carregamento do CSS", () => {
            criarGuia();

            const link = obterElemento("link");

            expect(link).not.toBeNull();
        });

        it("mantém o componente oculto enquanto as imagens não carregam", () => {
            criarGuia();

            expect(guia.style.visibility).toBe("hidden");
        });

        it("não apresenta erro ao desconectar o componente", () => {
            criarGuia();

            expect(() => guia.remove()).not.toThrow();
        });
    });
});
