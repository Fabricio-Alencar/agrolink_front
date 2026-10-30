
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const caminhoModulo =
    "../../static/js/estabelecimentos/market_place_estabelecimentos/filtro_persiana.js";

describe("Filtro persiana", () => {

    let mediaCelular;
    let callbackMedia;

    beforeEach(() => {

        // Limpa o cache dos módulos para executar o código novamente.
        vi.resetModules();

        // Cria a estrutura HTML utilizada pelo módulo.
        document.body.innerHTML = `
            <aside class="sidebar">
                <button id="btnToggleFiltros" aria-expanded="false">
                    Filtros
                </button>

                <div id="painelOpcoesFiltros">
                    <div class="conteudo-filtros-interno">
                        Conteúdo dos filtros
                    </div>
                </div>
            </aside>
        `;

        // Simula o comportamento da media query.
        mediaCelular = {
            matches: true,
            addEventListener: vi.fn((evento, callback) => {
                callbackMedia = callback;
            }),
            removeEventListener: vi.fn()
        };

        // Configura matchMedia antes da importação do módulo.
        vi.stubGlobal(
            "matchMedia",
            vi.fn(() => mediaCelular)
        );

        window.matchMedia = vi.fn(() => mediaCelular);

        // Simula ResizeObserver.
        class ResizeObserverMock {
            constructor(callback) {
                this.callback = callback;
            }

            observe = vi.fn();
            disconnect = vi.fn();
            unobserve = vi.fn();
        }

        window.ResizeObserver = ResizeObserverMock;
        vi.stubGlobal("ResizeObserver", ResizeObserverMock);

        // Simula requestAnimationFrame.
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn(callback => callback())
        );

    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();

        delete window.ResizeObserver;
    });

    it("deve carregar o módulo sem erros", async () => {

        await expect(import(caminhoModulo))
            .resolves.toBeDefined();

    });

    it("deve iniciar com os filtros abertos em telas desktop", async () => {

        mediaCelular.matches = false;

        await import(caminhoModulo);

        const sidebar = document.querySelector(".sidebar");
        const botao = document.getElementById("btnToggleFiltros");

        expect(sidebar.classList.contains("filtros-abertos")).toBe(true);
        expect(botao.getAttribute("aria-expanded")).toBe("true");

    });

    it("deve iniciar com os filtros fechados em telas mobile", async () => {

        mediaCelular.matches = true;

        await import(caminhoModulo);

        const sidebar = document.querySelector(".sidebar");
        const botao = document.getElementById("btnToggleFiltros");

        expect(sidebar.classList.contains("filtros-abertos")).toBe(false);
        expect(botao.getAttribute("aria-expanded")).toBe("false");

    });

    it("deve abrir os filtros ao clicar no botão em telas mobile", async () => {

        mediaCelular.matches = true;

        await import(caminhoModulo);

        const sidebar = document.querySelector(".sidebar");
        const botao = document.getElementById("btnToggleFiltros");

        botao.click();

        expect(sidebar.classList.contains("filtros-abertos")).toBe(true);
        expect(botao.getAttribute("aria-expanded")).toBe("true");

    });

    it("deve fechar os filtros ao clicar novamente em telas mobile", async () => {

        mediaCelular.matches = true;

        await import(caminhoModulo);

        const sidebar = document.querySelector(".sidebar");
        const botao = document.getElementById("btnToggleFiltros");

        botao.click();
        botao.click();

        expect(sidebar.classList.contains("filtros-abertos")).toBe(false);
        expect(botao.getAttribute("aria-expanded")).toBe("false");

    });

    it("não deve alternar os filtros ao clicar em telas desktop", async () => {

        mediaCelular.matches = false;

        await import(caminhoModulo);

        const sidebar = document.querySelector(".sidebar");
        const botao = document.getElementById("btnToggleFiltros");

        botao.click();

        expect(sidebar.classList.contains("filtros-abertos")).toBe(true);
        expect(botao.getAttribute("aria-expanded")).toBe("true");

    });

    it("deve registrar o evento de mudança da media query", async () => {

        await import(caminhoModulo);

        expect(mediaCelular.addEventListener)
            .toHaveBeenCalledWith("change", expect.any(Function));

        expect(callbackMedia).toBeTypeOf("function");

    });

    it("deve executar o callback quando a media query mudar", async () => {

        await import(caminhoModulo);

        expect(callbackMedia).toBeTypeOf("function");

        mediaCelular.matches = false;

        callbackMedia();

        const sidebar = document.querySelector(".sidebar");
        const botao = document.getElementById("btnToggleFiltros");

        expect(sidebar.classList.contains("filtros-abertos")).toBe(true);
        expect(botao.getAttribute("aria-expanded")).toBe("true");

    });

    it("não deve quebrar quando os elementos HTML não existem", async () => {

        document.body.innerHTML = "";

        await expect(import(caminhoModulo))
            .resolves.toBeDefined();

    });

});
