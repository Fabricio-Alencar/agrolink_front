
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

async function carregarDrawer() {
    vi.resetModules();
    await import("../../static/js/drawer.js");
}

describe("Drawer", () => {
    let codigo;
    let fetchMock;
    let menu;
    let mascara;
    let botaoAbrir;
    let botaoFechar;
    let guia;

    const respostaSessao = (dados) => ({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(dados)
    });

    async function aguardarCarregamento() {
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    beforeEach(async () => {
        document.body.innerHTML = `
            <button id="botaoAbrirMenu">Abrir</button>
            <button id="botaoFecharMenu">Fechar</button>

            <aside id="painelLateral"></aside>
            <div id="mascaraMenu"></div>

            <guia-passos
                titulo="Título original"
                subtitulo="Subtítulo original"
                passos='[{"numero":1}]'
            ></guia-passos>

            <span id="usuarioNome"></span>
            <span id="usuarioTipo"></span>
            <img class="usuario-foto">

            <nav class="painel-navegacao"></nav>
        `;

        menu = document.getElementById("painelLateral");
        mascara = document.getElementById("mascaraMenu");
        botaoAbrir = document.getElementById("botaoAbrirMenu");
        botaoFechar = document.getElementById("botaoFecharMenu");
        guia = document.querySelector("guia-passos");

        globalThis.CONFIG = {
            API_URL: "http://localhost:5000"
        };

        fetchMock = vi.fn().mockResolvedValue(
            respostaSessao({ logado: false })
        );

        vi.stubGlobal("fetch", fetchMock);

        window.lucide = {
            createIcons: vi.fn()
        };

        window.history.pushState({}, "", "/");

        await carregarDrawer();
    });

    afterEach(() => {
        document.body.innerHTML = "";

        vi.unstubAllGlobals();
        vi.restoreAllMocks();

        delete globalThis.CONFIG;
        delete window.lucide;
    });

    // =====================================================
    // ABRIR E FECHAR
    // =====================================================

    describe("Alternar menu", () => {
        it("abre o drawer ao clicar no botão de abrir", () => {
            botaoAbrir.click();

            expect(menu.classList.contains("ativo")).toBe(true);
        });

        it("exibe a máscara ao abrir o drawer", () => {
            botaoAbrir.click();

            expect(mascara.classList.contains("ativo")).toBe(true);
        });

        it("fecha o drawer ao clicar no botão de fechar", () => {
            botaoAbrir.click();
            botaoFechar.click();

            expect(menu.classList.contains("ativo")).toBe(false);
        });

        it("remove a máscara ao fechar o drawer", () => {
            botaoAbrir.click();
            botaoFechar.click();

            expect(mascara.classList.contains("ativo")).toBe(false);
        });

        it("fecha o drawer ao clicar na máscara", () => {
            botaoAbrir.click();
            mascara.click();

            expect(menu.classList.contains("ativo")).toBe(false);
            expect(mascara.classList.contains("ativo")).toBe(false);
        });

        it("permite abrir e fechar o drawer sucessivamente", () => {
            botaoAbrir.click();

            expect(menu.classList.contains("ativo")).toBe(true);

            botaoAbrir.click();

            expect(menu.classList.contains("ativo")).toBe(false);

            botaoAbrir.click();

            expect(menu.classList.contains("ativo")).toBe(true);
        });

        it("não apresenta erro quando o menu não existe", () => {
            menu.remove();

            expect(() => botaoAbrir.click()).not.toThrow();
        });

        it("não apresenta erro quando a máscara não existe", () => {
            mascara.remove();

            expect(() => botaoAbrir.click()).not.toThrow();
            expect(menu.classList.contains("ativo")).toBe(true);
        });
    });

    // =====================================================
    // GUIA DO DRAWER
    // =====================================================

    describe("Guia de passos", () => {
        it("altera o título do guia ao abrir o drawer", () => {
            botaoAbrir.click();

            expect(guia.getAttribute("titulo")).toBe(
                "Guia do Menu Lateral"
            );
        });

        it("altera o subtítulo do guia ao abrir o drawer", () => {
            botaoAbrir.click();

            expect(guia.getAttribute("subtitulo")).toBe(
                "Conheça o que você encontra em cada seção do sistema:"
            );
        });

        it("define quatro passos no guia do drawer", () => {
            botaoAbrir.click();

            const passos = JSON.parse(
                guia.getAttribute("passos")
            );

            expect(passos).toHaveLength(4);
            expect(passos[0].titulo).toBe("Pedidos");
            expect(passos[1].titulo).toBe("Chat");
            expect(passos[2].titulo).toBe("Perfil");
            expect(passos[3].titulo).toBe("Marketplace / Produtos");
        });

        it("restaura os atributos originais ao fechar", () => {
            botaoAbrir.click();
            botaoFechar.click();

            expect(guia.getAttribute("titulo")).toBe(
                "Título original"
            );

            expect(guia.getAttribute("subtitulo")).toBe(
                "Subtítulo original"
            );

            expect(guia.getAttribute("passos")).toBe(
                '[{"numero":1}]'
            );
        });

        it("restaura atributos que originalmente não existiam", () => {
            guia.removeAttribute("titulo");
            guia.removeAttribute("subtitulo");
            guia.removeAttribute("passos");

            botaoAbrir.click();
            botaoFechar.click();

            expect(guia.hasAttribute("titulo")).toBe(false);
            expect(guia.hasAttribute("subtitulo")).toBe(false);
            expect(guia.hasAttribute("passos")).toBe(false);
        });

        it("mantém o guia alterado enquanto o drawer continua aberto", () => {
    botaoAbrir.click();

    expect(menu.classList.contains("ativo")).toBe(true);

    expect(guia.getAttribute("titulo")).toBe(
        "Guia do Menu Lateral"
    );

    expect(guia.getAttribute("subtitulo")).toBe(
        "Conheça o que você encontra em cada seção do sistema:"
    );

    // O drawer continua aberto, então o guia permanece alterado.
    expect(menu.classList.contains("ativo")).toBe(true);

    expect(guia.getAttribute("titulo")).toBe(
        "Guia do Menu Lateral"
    );
});

        it("restaura os atributos após abrir e fechar novamente", () => {
            botaoAbrir.click();
            botaoFechar.click();

            botaoAbrir.click();

            expect(guia.getAttribute("titulo")).toBe(
                "Guia do Menu Lateral"
            );

            botaoFechar.click();

            expect(guia.getAttribute("titulo")).toBe(
                "Título original"
            );
        });
    });

    // =====================================================
    // CAPITALIZAÇÃO E FOTO
    // =====================================================

    describe("Carregamento do usuário", () => {
        it("consulta a sessão no endpoint correto", async () => {
            await aguardarCarregamento();

            expect(fetchMock).toHaveBeenCalledWith(
                "http://localhost:5000/session",
                {
                    method: "GET",
                    credentials: "include"
                }
            );
        });

        it("não altera os dados quando o usuário não está logado", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: false,
                    nome: "joão",
                    tipo: "produtor"
                })
            );

            // A chamada inicial do beforeEach já ocorreu.
            // A inicialização é verificada por meio de uma nova execução.
            document.body.innerHTML = `
                <span id="usuarioNome">Original</span>
                <span id="usuarioTipo">Original</span>
            `;

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.getElementById("usuarioNome").textContent
            ).toBe("Original");
        });

        it("capitaliza o nome do usuário", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor"
                })
            );

            document.getElementById("usuarioNome").textContent = "";

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.getElementById("usuarioNome").textContent
            ).toBe("João");
        });

        it("capitaliza o tipo de usuário", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "maria",
                    tipo: "produtor"
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.getElementById("usuarioTipo").textContent
            ).toBe("Produtor");
        });

        it("não altera elementos ausentes", async () => {
            document.body.innerHTML = `
                <nav class="painel-navegacao"></nav>
            `;

            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor"
                })
            );

            fetchMock.mockClear();

            await expect(carregarDrawer()).resolves.toBeUndefined();

            await aguardarCarregamento();

            expect(fetchMock).toHaveBeenCalled();
        });

        it("não atualiza os dados quando a resposta HTTP falha", async () => {
            const erro = vi.spyOn(console, "error").mockImplementation(
                () => {}
            );

            fetchMock.mockResolvedValue({
                ok: false,
                status: 401
            });

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(erro).toHaveBeenCalledWith(
                "Erro ao consultar sessão:",
                401
            );
        });

        it("trata falha de rede ao consultar sessão", async () => {
            const erro = vi.spyOn(console, "error").mockImplementation(
                () => {}
            );

            fetchMock.mockRejectedValue(
                new Error("Erro de rede")
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(erro).toHaveBeenCalledWith(
                "Erro ao carregar usuário:",
                expect.any(Error)
            );
        });

        it("não apresenta erro quando nome e tipo não existem", async () => {
            document.body.innerHTML = "";

            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor"
                })
            );

            fetchMock.mockClear();

            await expect(carregarDrawer()).resolves.toBeUndefined();

            await aguardarCarregamento();
        });
    });

    // =====================================================
    // FOTO DE PERFIL
    // =====================================================

    describe("Configuração da foto de perfil", () => {
        it("utiliza o caminho padrão quando não existe foto", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor",
                    foto_perfil: null
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.querySelector(".usuario-foto").getAttribute("src")
            ).toContain("../static/assets/user.png");
        });

        it("utiliza URL absoluta quando a foto é HTTP", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor",
                    foto_perfil: "https://exemplo.com/foto.png"
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.querySelector(".usuario-foto").src
            ).toBe("https://exemplo.com/foto.png");
        });

        it("utiliza URL absoluta quando a foto é HTTPS", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor",
                    foto_perfil: "http://exemplo.com/foto.png"
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.querySelector(".usuario-foto").src
            ).toBe("http://exemplo.com/foto.png");
        });

        it("adiciona static ao caminho relativo da foto", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor",
                    foto_perfil: "uploads/foto.png"
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.querySelector(".usuario-foto").src
            ).toBe(
                "http://localhost:5000/static/uploads/foto.png"
            );
        });

        it("não duplica static quando o caminho já começa com static/", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor",
                    foto_perfil: "static/uploads/foto.png"
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            expect(
                document.querySelector(".usuario-foto").src
            ).toBe(
                "http://localhost:5000/static/uploads/foto.png"
            );
        });

        it("usa imagem padrão quando ocorre erro ao carregar a foto", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor",
                    foto_perfil: "https://exemplo.com/foto.png"
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();

            await aguardarCarregamento();

            const foto = document.querySelector(".usuario-foto");
            const aviso = vi.spyOn(console, "warn").mockImplementation(
                () => {}
            );

            foto.onerror();

            expect(foto.getAttribute("src")).toContain(
                "../static/assets/user.png"
            );

            expect(foto.onerror).toBe(null);
            expect(aviso).toHaveBeenCalled();
        });
    });

    // =====================================================
    // NAVEGAÇÃO
    // =====================================================

    describe("Renderização da navegação", () => {
        it("renderiza os links do produtor", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor"
                })
            );

            fetchMock.mockClear();

            await carregarDrawer();


            await aguardarCarregamento();

            const links = document.querySelectorAll(
                ".painel-navegacao a"
            );

            expect(links).toHaveLength(4);
            expect(links[0].textContent).toContain("Meus Produtos");
            expect(links[1].textContent).toContain("Pedidos");
            expect(links[2].textContent).toContain("Chat");
            expect(links[3].textContent).toContain("Perfil");
        });

        it("renderiza os links do estabelecimento", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "mercado",
                    tipo: "estabelecimento"
                })
            );

            fetchMock.mockClear();

                        await carregarDrawer();


            await aguardarCarregamento();

            const links = document.querySelectorAll(
                ".painel-navegacao a"
            );

            expect(links).toHaveLength(4);
            expect(links[0].textContent).toContain("Marketplace");
        });

        it("marca a página atual como ativa", async () => {
            window.history.pushState(
                {},
                "",
                "/negociacoes_produtor"
            );

            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor"
                })
            );

            fetchMock.mockClear();

                        await carregarDrawer();


            await aguardarCarregamento();

            const pedidos = [
                ...document.querySelectorAll(".painel-navegacao a")
            ].find(link => link.textContent.includes("Pedidos"));

            expect(pedidos.classList.contains("ativo")).toBe(true);
        });

        it("não renderiza navegação para tipo desconhecido", async () => {
            const erro = vi.spyOn(console, "error").mockImplementation(
                () => {}
            );

            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "teste",
                    tipo: "desconhecido"
                })
            );

            fetchMock.mockClear();

                        await carregarDrawer();


            await aguardarCarregamento();

            expect(erro).toHaveBeenCalledWith(
                "Tipo de usuário não reconhecido:",
                "desconhecido"
            );
        });

        it("atualiza ícones quando lucide está disponível", async () => {
            fetchMock.mockResolvedValue(
                respostaSessao({
                    logado: true,
                    nome: "joão",
                    tipo: "produtor"
                })
            );

            fetchMock.mockClear();

                        await carregarDrawer();


            await aguardarCarregamento();

            expect(window.lucide.createIcons).toHaveBeenCalled();
        });
    });
});
