
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

describe("Botão de cotações CEAGESP", () => {
    let eventosDocumento = [];
    let botao;
    let dropdown;
    let nome;
    let categoria;
    let preco;

    function prepararDOM({
        incluirBotao = true,
        incluirDropdown = true,
        incluirNome = true,
        incluirCategoria = true,
        incluirPreco = true
    } = {}) {
        document.body.innerHTML = `
            ${incluirBotao ? '<button id="btnCeagesp"></button>' : ""}
            ${incluirDropdown ? '<div id="dropdownCeagesp" class="oculto"></div>' : ""}
            ${incluirNome ? '<input id="nomeProduto">' : ""}
            ${incluirCategoria ? '<input id="categoriaProduto">' : ""}
            ${incluirPreco ? '<input id="precoProduto">' : ""}
            <div id="fora"></div>
        `;

        botao = document.getElementById("btnCeagesp");
        dropdown = document.getElementById("dropdownCeagesp");
        nome = document.getElementById("nomeProduto");
        categoria = document.getElementById("categoriaProduto");
        preco = document.getElementById("precoProduto");
    }

    async function carregarScript() {
        eventosDocumento = [];

        const addEventListenerOriginal = document.addEventListener;

        // Intercepta os eventos registrados pelo script
        document.addEventListener = function (tipo, listener, opcoes) {
            if (tipo === "DOMContentLoaded" || tipo === "click") {
                eventosDocumento.push({
                    tipo,
                    listener,
                    opcoes
                });
            }

            return addEventListenerOriginal.call(
                this,
                tipo,
                listener,
                opcoes
            );
        };

        try {
            // Limpa o cache do módulo
            vi.resetModules();

            // Importa pelo Vite para permitir a contabilização da cobertura
            await import("../../static/js/produtores/botao_ceagesp.js");

            // Executa a inicialização do script
            document.dispatchEvent(
                new Event("DOMContentLoaded")
            );

        } finally {
            // Restaura o método original
            document.addEventListener = addEventListenerOriginal;
        }
    }

    beforeEach(async () => {
        prepararDOM();

        vi.stubGlobal("fetch", vi.fn());

        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});

        await carregarScript();
    });

    afterEach(() => {
        // Remove os eventos registrados pelo script neste teste
        eventosDocumento.forEach(({ tipo, listener, opcoes }) => {
            document.removeEventListener(
                tipo,
                listener,
                opcoes
            );
        });

        eventosDocumento = [];

        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("abre o dropdown ao clicar no botão", async () => {
        nome.value = "Maçã";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "https://exemplo.com/cotacoes",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue([])
        });

        botao.click();

        expect(dropdown.classList.contains("oculto")).toBe(false);
        expect(dropdown.innerHTML).toContain("Buscando cotações");

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });

    it("não realiza busca quando o nome do produto está vazio", () => {
        nome.value = "   ";

        botao.click();

        expect(fetch).not.toHaveBeenCalled();
        expect(dropdown.innerHTML).toContain("Digite um produto primeiro");
        expect(dropdown.classList.contains("oculto")).toBe(false);
    });

    it("envia o nome e a categoria como parâmetros da consulta", async () => {
        nome.value = "  Maçã  ";
        categoria.value = "  Frutas  ";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "https://exemplo.com/cotacoes",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue([])
        });

        botao.click();

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });

        const url = fetch.mock.calls[0][0];

        expect(url).toContain("produto=ma%C3%A7%C3%A3");
        expect(url).toContain("categoria=frutas");
    });

    it("não envia categoria quando o campo está vazio", async () => {
        nome.value = "Milho";
        categoria.value = "";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "https://exemplo.com/cotacoes",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue([])
        });

        botao.click();

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });

        expect(fetch.mock.calls[0][0]).toContain("produto=milho");
        expect(fetch.mock.calls[0][0]).not.toContain("categoria=");
    });

    it("exibe aviso quando a API retorna lista vazia", async () => {
        nome.value = "Maçã";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue([])
        });

        botao.click();

        await vi.waitFor(() => {
            expect(dropdown.innerHTML).toContain("Cotação não encontrada");
        });
    });

    it("exibe aviso quando a API retorna null", async () => {
        nome.value = "Maçã";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue(null)
        });

        botao.click();

        await vi.waitFor(() => {
            expect(dropdown.innerHTML).toContain("Cotação não encontrada");
        });
    });

    it("renderiza os produtos recebidos em formato de lista", async () => {
        nome.value = "maçã";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue([
                {
                    produto: "Maçã",
                    classificacao: "Extra",
                    preco_comum: 12.5,
                    unidade_peso: "KG"
                }
            ])
        });

        botao.click();

        await vi.waitFor(() => {
            expect(dropdown.innerHTML).toContain("Maçã - Extra");
        });

        expect(dropdown.innerHTML).toContain("R$ 12,50/kg");
        expect(dropdown.innerHTML).toContain("Maçã");
    });

    it("renderiza produto sem classificação", async () => {
        nome.value = "Banana";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue([
                {
                    produto: "Banana",
                    classificacao: "-",
                    preco_comum: 5,
                    unidade_peso: ""
                }
            ])
        });

        botao.click();

        await vi.waitFor(() => {
            expect(dropdown.innerHTML).toContain(">Banana</span>");
        });

        expect(dropdown.innerHTML).toContain("R$ 5,00/kg");
    });

    it("renderiza objeto único retornado pela API", async () => {
        nome.value = "Tomate";

        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: false,
            type: "basic",
            url: "",
            headers: new Headers(),
            json: vi.fn().mockResolvedValue({
                produto: "Tomate",
                classificacao: "Especial",
                preco_comum: 8,
                unidade_peso: "KG"
            })
        });

        botao.click();

        await vi.waitFor(() => {
            expect(dropdown.innerHTML).toContain("Tomate - Especial");
        });
    });

    it("exibe aviso quando a resposta HTTP não é válida", async () => {
        nome.value = "Maçã";

        fetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            redirected: false,
            type: "basic",
            url: "",
            headers: new Headers(),
            json: vi.fn()
        });

        botao.click();

        await vi.waitFor(() => {
            expect(dropdown.innerHTML).toContain("Serviço indisponível");
        });
    });

    it("exibe aviso quando ocorre erro de rede", async () => {
        nome.value = "Maçã";

        fetch.mockRejectedValue(new Error("Falha de rede"));

        botao.click();

        await vi.waitFor(() => {
            expect(dropdown.innerHTML).toContain("Serviço indisponível");
        });
    });

    it("fecha o dropdown ao clicar novamente no botão", () => {
        dropdown.classList.remove("oculto");

        botao.click();

        expect(dropdown.classList.contains("oculto")).toBe(true);
    });

    it("fecha o dropdown ao clicar fora dele", () => {
        dropdown.classList.remove("oculto");

        document.getElementById("fora").click();

        expect(dropdown.classList.contains("oculto")).toBe(true);
    });

    it("mantém o dropdown aberto ao clicar dentro dele", () => {
        dropdown.classList.remove("oculto");
        dropdown.innerHTML = "<button id='interno'>Item</button>";

        document.getElementById("interno").click();

        expect(dropdown.classList.contains("oculto")).toBe(false);
    });

    it("preenche o preço e fecha o dropdown ao selecionar uma cotação", () => {
        window.selecionarPrecoCeagesp(12.5);

        expect(preco.value).toBe("12.50");
        expect(dropdown.classList.contains("oculto")).toBe(true);
    });

    it("fecha o dropdown mesmo quando não existe campo de preço", () => {
        document.getElementById("precoProduto").remove();

        window.selecionarPrecoCeagesp(10);

        expect(dropdown.classList.contains("oculto")).toBe(true);
    });
});
