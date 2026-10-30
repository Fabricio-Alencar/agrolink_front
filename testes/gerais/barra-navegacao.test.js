
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

describe("Barra de navegação", () => {

    let fetchMock;
    let componente;

    const template = `
        <nav>
            <a data-link="produtos" data-page="produtos" href="#">
                <span>Produtos</span>
            </a>

            <a data-link="pedidos" data-page="negociacoes" href="#">
                <span>Pedidos</span>
            </a>

            <a data-link="chat" data-page="chat" href="#">
                <span>Chat</span>
            </a>

            <a data-link="inicio" data-page="inicio" href="#">
                <span>Início</span>
            </a>
        </nav>
    `;

    async function aguardarCarregamento() {
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    beforeEach(async () => {
        document.body.innerHTML = "";

        vi.resetModules();

        fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: vi.fn().mockResolvedValue(template)
        });

        vi.stubGlobal("fetch", fetchMock);

        window.Auth = {
            getType: vi.fn().mockReturnValue("produtor")
        };

        window.lucide = {
            createIcons: vi.fn()
        };

        await import("../../static/js/barra-navegacao.js");
    });

    afterEach(() => {
        document.body.innerHTML = "";

        vi.unstubAllGlobals();
        vi.restoreAllMocks();

        delete window.Auth;
        delete window.lucide;
    });

    function criarComponente(atributos = {}) {
        componente = document.createElement("barra-navegacao");

        Object.entries(atributos).forEach(([chave, valor]) => {
            componente.setAttribute(chave, valor);
        });

        document.body.appendChild(componente);

        return componente;
    }

    // =====================================================
    // REGISTRO DO COMPONENTE
    // =====================================================

    describe("Registro", () => {

        it("registra o componente barra-navegacao", () => {
            expect(
                customElements.get("barra-navegacao")
            ).toBeDefined();
        });

        it("define os atributos observados", () => {
            const Classe = customElements.get("barra-navegacao");

            expect(Classe.observedAttributes).toEqual([
                "pagina",
                "url-produtos",
                "url-pedidos",
                "url-chat",
                "url-inicio"
            ]);
        });
    });

    // =====================================================
    // CARREGAMENTO DO TEMPLATE
    // =====================================================

    describe("Carregamento do template", () => {

        it("solicita o HTML da barra de navegação", async () => {
            criarComponente();

            await aguardarCarregamento();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("insere o HTML retornado pelo servidor", async () => {
            criarComponente();

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="produtos"]')
            ).not.toBeNull();
        });

        it("marca o componente como pronto após carregar", async () => {
            criarComponente();

            await aguardarCarregamento();

            expect(componente.dataset.pronto).toBe("true");
            expect(componente.dataset.carregando).toBe("false");
        });

        it("remove aria-busy após carregar", async () => {
            criarComponente();

            await aguardarCarregamento();

            expect(componente.hasAttribute("aria-busy")).toBe(false);
        });

        it("evita iniciar outro carregamento enquanto está carregando", async () => {
            let resolver;

            fetchMock.mockReturnValue(
                new Promise(resolve => {
                    resolver = resolve;
                })
            );

            criarComponente();

            componente.connectedCallback();

            expect(fetchMock).toHaveBeenCalledTimes(1);

            resolver({
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue(template)
            });

            await aguardarCarregamento();
        });

        it("não carrega novamente quando já está pronto", async () => {
            criarComponente();

            await aguardarCarregamento();

            componente.connectedCallback();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("trata resposta HTTP inválida", async () => {
            const erro = vi.spyOn(console, "error").mockImplementation(
                () => {}
            );

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500
            });

            criarComponente();

            await aguardarCarregamento();

            expect(componente.dataset.carregando).toBe("false");
            expect(componente.hasAttribute("aria-busy")).toBe(false);
            expect(erro).toHaveBeenCalled();
        });

        it("trata falha de rede", async () => {
            const erro = vi.spyOn(console, "error").mockImplementation(
                () => {}
            );

            fetchMock.mockRejectedValue(
                new Error("Falha de conexão")
            );

            criarComponente();

            await aguardarCarregamento();

            expect(componente.dataset.carregando).toBe("false");
            expect(erro).toHaveBeenCalled();
        });
    });

    // =====================================================
    // ROTAS DO PRODUTOR
    // =====================================================

    describe("Navegação do produtor", () => {

        beforeEach(async () => {
            window.Auth.getType.mockReturnValue("produtor");

            criarComponente({ pagina: "produtos" });

            await aguardarCarregamento();
        });

        it("configura a rota de produtos do produtor", () => {
            const link = componente.querySelector(
                '[data-link="produtos"]'
            );

            expect(link.getAttribute("href")).toBe("/meus_produtos");
        });

        it("altera o texto para Meus produtos", () => {
            const texto = componente.querySelector(
                '[data-link="produtos"] span'
            );

            expect(texto.textContent).toBe("Meus produtos");
        });

        it("define data-page como produtos", () => {
            const link = componente.querySelector(
                '[data-link="produtos"]'
            );

            expect(link.dataset.page).toBe("produtos");
        });

        it("configura a rota de pedidos do produtor", () => {
            expect(
                componente.querySelector('[data-link="pedidos"]')
                    .getAttribute("href")
            ).toBe("/negociacoes_produtor");
        });

        it("configura a rota do chat", () => {
            expect(
                componente.querySelector('[data-link="chat"]')
                    .getAttribute("href")
            ).toBe("/chat");
        });

        it("configura a rota inicial", () => {
            expect(
                componente.querySelector('[data-link="inicio"]')
                    .getAttribute("href")
            ).toBe("/");
        });

        it("destaca a página atual", () => {
            const link = componente.querySelector(
                '[data-link="produtos"]'
            );

            expect(link.classList.contains("is-active")).toBe(true);
            expect(link.getAttribute("aria-current")).toBe("page");
        });

        it("não destaca páginas diferentes da atual", () => {
            const link = componente.querySelector(
                '[data-link="chat"]'
            );

            expect(link.classList.contains("is-active")).toBe(false);
            expect(link.hasAttribute("aria-current")).toBe(false);
        });
    });

    // =====================================================
    // ROTAS DO ESTABELECIMENTO
    // =====================================================

    describe("Navegação do estabelecimento", () => {

        beforeEach(async () => {
            window.Auth.getType.mockReturnValue("estabelecimento");

            criarComponente({ pagina: "marketplace" });

            await aguardarCarregamento();
        });

        it("configura a rota do marketplace", () => {
            expect(
                componente.querySelector('[data-link="produtos"]')
                    .getAttribute("href")
            ).toBe("/marketplace");
        });

        it("altera o texto para Marketplace", () => {
            expect(
                componente.querySelector('[data-link="produtos"] span')
                    .textContent
            ).toBe("Marketplace");
        });

        it("define data-page como marketplace", () => {
            expect(
                componente.querySelector('[data-link="produtos"]')
                    .dataset.page
            ).toBe("marketplace");
        });

        it("configura a rota de pedidos do estabelecimento", () => {
            expect(
                componente.querySelector('[data-link="pedidos"]')
                    .getAttribute("href")
            ).toBe("/negociacoes_estabelecimento");
        });

        it("destaca o marketplace como página atual", () => {
            const link = componente.querySelector(
                '[data-link="produtos"]'
            );

            expect(link.classList.contains("is-active")).toBe(true);
            expect(link.getAttribute("aria-current")).toBe("page");
        });
    });

    // =====================================================
    // PERSONALIZAÇÃO DAS ROTAS
    // =====================================================

    describe("Rotas personalizadas", () => {

        it("utiliza URL personalizada para produtos", async () => {
            criarComponente({
                "url-produtos": "/produtos-personalizados"
            });

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="produtos"]')
                    .getAttribute("href")
            ).toBe("/produtos-personalizados");
        });

        it("utiliza URL personalizada para pedidos", async () => {
            criarComponente({
                "url-pedidos": "/pedidos-personalizados"
            });

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="pedidos"]')
                    .getAttribute("href")
            ).toBe("/pedidos-personalizados");
        });

        it("utiliza URL personalizada para chat", async () => {
            criarComponente({
                "url-chat": "/chat-personalizado"
            });

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="chat"]')
                    .getAttribute("href")
            ).toBe("/chat-personalizado");
        });

        it("utiliza URL personalizada para início", async () => {
            criarComponente({
                "url-inicio": "/inicio-personalizado"
            });

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="inicio"]')
                    .getAttribute("href")
            ).toBe("/inicio-personalizado");
        });

        it("ignora URL de produtos terminada em .html", async () => {
            criarComponente({
                "url-produtos": "/produtos.html"
            });

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="produtos"]')
                    .getAttribute("href")
            ).toBe("/meus_produtos");
        });

        it("ignora URL de pedidos terminada em .html", async () => {
            criarComponente({
                "url-pedidos": "/pedidos.html"
            });

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="pedidos"]')
                    .getAttribute("href")
            ).toBe("/negociacoes_produtor");
        });

        it("atualiza a navegação quando o atributo pagina muda", async () => {
            criarComponente({ pagina: "produtos" });

            await aguardarCarregamento();

            componente.setAttribute("pagina", "chat");

            const produtos = componente.querySelector(
                '[data-link="produtos"]'
            );

            const chat = componente.querySelector(
                '[data-link="chat"]'
            );

            expect(produtos.classList.contains("is-active")).toBe(false);
            expect(chat.classList.contains("is-active")).toBe(true);
            expect(chat.getAttribute("aria-current")).toBe("page");
        });
    });

    // =====================================================
    // TIPO DE USUÁRIO NÃO IDENTIFICADO
    // =====================================================

    describe("Tipo de usuário", () => {

        it("utiliza rota padrão quando o tipo é desconhecido", async () => {
            window.Auth.getType.mockReturnValue("desconhecido");

            const aviso = vi.spyOn(console, "warn").mockImplementation(
                () => {}
            );

            criarComponente();

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="pedidos"]')
                    .getAttribute("href")
            ).toBe("/");

            expect(aviso).toHaveBeenCalled();
        });

        it("aceita tipo de usuário em maiúsculas", async () => {
            window.Auth.getType.mockReturnValue("PRODUTOR");

            criarComponente();

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="produtos"]')
                    .getAttribute("href")
            ).toBe("/meus_produtos");
        });

        it("aceita espaços no tipo de usuário", async () => {
            window.Auth.getType.mockReturnValue("  produtor  ");

            criarComponente();

            await aguardarCarregamento();

            expect(
                componente.querySelector('[data-link="produtos"]')
                    .getAttribute("href")
            ).toBe("/meus_produtos");
        });

        it("atualiza os ícones quando lucide está disponível", async () => {
            criarComponente();

            await aguardarCarregamento();

            expect(window.lucide.createIcons).toHaveBeenCalled();
        });
    });
});
