
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const { getCacheNegociacoesMock } = vi.hoisted(() => ({
    getCacheNegociacoesMock: vi.fn()
}));

vi.mock("../../static/js/negociacoes/renderizacao.js", () => ({
    getCacheNegociacoes: getCacheNegociacoesMock
}));

const CAMINHO_WHATSAPP =
    "../../static/js/negociacoes/whatsapp.js";

let consoleWarnMock;

function prepararHTML({
    nomeProduto = "Milho",
    nomeNegociante = "João da Silva",
    incluirContainer = true,
    incluirAreaBotoes = true,
    incluirProduto = true,
    incluirNegociante = true
} = {}) {
    document.body.innerHTML = "";

    if (!incluirContainer) return;

    document.body.innerHTML = `
        <div id="details-content">
            ${
                incluirAreaBotoes
                    ? `<div class="botoes-contato">
                           <button class="btn-conversar">Conversar</button>
                       </div>`
                    : ""
            }

            <div class="col-left">
                ${
                    incluirProduto
                        ? `<span class="info-value">${nomeProduto}</span>`
                        : ""
                }
            </div>

            <div class="col-right">
                ${
                    incluirNegociante
                        ? `<span class="info-value">${nomeNegociante}</span>`
                        : ""
                }
            </div>
        </div>
    `;
}

function criarPedido(dados = {}) {
    return {
        id: 1,
        produto_nome: "Milho",
        negociante_nome: "João da Silva",
        negociante_telefone: "11987654321",
        ...dados
    };
}

async function importarWhatsApp() {
    await import(CAMINHO_WHATSAPP);
}

describe("Botão do WhatsApp", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        prepararHTML();

        getCacheNegociacoesMock.mockReturnValue([
            criarPedido()
        ]);

        consoleWarnMock = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("deve criar o botão do WhatsApp quando há negociação e telefone", async () => {
        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao).not.toBeNull();
        expect(botao.tagName).toBe("A");
        expect(botao.textContent).toContain(
            "Contatar via WhatsApp"
        );
    });

    it("deve inserir o botão na área de contato", async () => {
        await importarWhatsApp();

        const area = document.querySelector(".botoes-contato");
        const botao = area.querySelector(".btn-whatsapp");

        expect(botao).not.toBeNull();
        expect(botao.parentElement).toBe(area);
    });

    it("deve manter o botão Conversar existente", async () => {
        await importarWhatsApp();

        const area = document.querySelector(".botoes-contato");

        expect(area.querySelector(".btn-conversar")).not.toBeNull();
        expect(area.querySelector(".btn-whatsapp")).not.toBeNull();
    });

    it("deve gerar o link com o código do Brasil quando o telefone não o possui", async () => {
        getCacheNegociacoesMock.mockReturnValue([
            criarPedido({
                negociante_telefone: "(11) 98765-4321"
            })
        ]);

        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao.href).toContain("https://wa.me/5511987654321?");
    });

    it("não deve duplicar o código do Brasil quando o telefone já começa com 55", async () => {
        getCacheNegociacoesMock.mockReturnValue([
            criarPedido({
                negociante_telefone: "5511987654321"
            })
        ]);

        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao.href).toContain("https://wa.me/5511987654321?");
        expect(botao.href).not.toContain("https://wa.me/5555");
    });

    it("deve remover caracteres não numéricos do telefone", async () => {
        getCacheNegociacoesMock.mockReturnValue([
            criarPedido({
                negociante_telefone: "+55 (11) 98765-4321"
            })
        ]);

        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao.href).toContain("https://wa.me/5511987654321?");
    });

    it("deve incluir uma mensagem personalizada com produto e negociante", async () => {
        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");
        const url = new URL(botao.href);
        const mensagem = url.searchParams.get("text");

        expect(mensagem).toBe(
            "Olá João da Silva! Gostaria de alinhar alguns detalhes sobre a negociação de Milho."
        );
    });

    it("deve abrir o WhatsApp em uma nova aba com atributos seguros", async () => {
        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao.target).toBe("_blank");
        expect(botao.rel).toBe("noopener noreferrer");
    });

    it("deve procurar o telefone alternativo quando negociante_telefone não existe", async () => {
        getCacheNegociacoesMock.mockReturnValue([
            criarPedido({
                negociante_telefone: null,
                telefone: "11999998888"
            })
        ]);

        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao).not.toBeNull();
        expect(botao.href).toContain("https://wa.me/5511999998888?");
    });

    it("não deve criar botão quando não existe container de detalhes", async () => {
        prepararHTML({ incluirContainer: false });

        await importarWhatsApp();

        expect(document.querySelector(".btn-whatsapp")).toBeNull();
        expect(getCacheNegociacoesMock).not.toHaveBeenCalled();
    });

    it("não deve criar botão quando não existe área de contato", async () => {
        prepararHTML({ incluirAreaBotoes: false });

        await importarWhatsApp();

        expect(document.querySelector(".btn-whatsapp")).toBeNull();
        expect(getCacheNegociacoesMock).not.toHaveBeenCalled();
    });

    it("não deve criar botão quando não existe o elemento do produto", async () => {
        prepararHTML({ incluirProduto: false });

        await importarWhatsApp();

        expect(document.querySelector(".btn-whatsapp")).toBeNull();
        expect(getCacheNegociacoesMock).not.toHaveBeenCalled();
    });

    it("não deve criar botão quando não existe o elemento do negociante", async () => {
        prepararHTML({ incluirNegociante: false });

        await importarWhatsApp();

        expect(document.querySelector(".btn-whatsapp")).toBeNull();
        expect(getCacheNegociacoesMock).not.toHaveBeenCalled();
    });

    it("deve avisar quando a negociação não estiver no cache", async () => {
        getCacheNegociacoesMock.mockReturnValue([]);

        await importarWhatsApp();

        expect(document.querySelector(".btn-whatsapp")).toBeNull();

        expect(consoleWarnMock).toHaveBeenCalledWith(
            "Negociação não encontrada no cache para criar o botão WhatsApp."
        );
    });

    it("deve localizar a negociação pelo produto e pelo nome do negociante", async () => {
        getCacheNegociacoesMock.mockReturnValue([
            criarPedido({
                id: 2,
                produto_nome: "Soja",
                negociante_nome: "Maria",
                negociante_telefone: "11911112222"
            }),
            criarPedido({
                id: 3,
                produto_nome: "Milho",
                negociante_nome: "João da Silva",
                negociante_telefone: "11987654321"
            })
        ]);

        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao.href).toContain("https://wa.me/5511987654321?");
    });

    it("deve avisar quando não houver telefone no cache", async () => {
        getCacheNegociacoesMock.mockReturnValue([
            criarPedido({
                negociante_telefone: null,
                telefone: null
            })
        ]);

        await importarWhatsApp();

        expect(document.querySelector(".btn-whatsapp")).toBeNull();

        expect(consoleWarnMock).toHaveBeenCalledWith(
            "Telefone do negociante não encontrado no cache."
        );
    });

    it("deve avisar quando o telefone contém somente caracteres não numéricos", async () => {
        getCacheNegociacoesMock.mockReturnValue([
            criarPedido({
                negociante_telefone: "---",
                telefone: null
            })
        ]);

        await importarWhatsApp();

        expect(document.querySelector(".btn-whatsapp")).toBeNull();

        expect(consoleWarnMock).toHaveBeenCalledWith(
            "O telefone do negociante é inválido."
        );
    });

    it("deve reposicionar um botão existente para a área de contato correta", async () => {
        const details = document.getElementById("details-content");
        const botaoExistente = document.createElement("a");

        botaoExistente.className = "btn-whatsapp";
        botaoExistente.textContent = "WhatsApp";

        details.appendChild(botaoExistente);

        await importarWhatsApp();

        expect(botaoExistente.parentElement).toBe(
            details.querySelector(".botoes-contato")
        );

        expect(
            details.querySelectorAll(".btn-whatsapp")
        ).toHaveLength(1);
    });

    it("não deve duplicar um botão que já está na área correta", async () => {
        await importarWhatsApp();

        const area = document.querySelector(".botoes-contato");

        const botaoOriginal = area.querySelector(".btn-whatsapp");

        expect(botaoOriginal).not.toBeNull();

        // Dispara novamente a lógica de observação por meio
        // de uma mutação nos detalhes.
        const elemento = document.createElement("span");
        elemento.textContent = "Atualização";
        document.getElementById("details-content").appendChild(elemento);

        await Promise.resolve();

        expect(area.querySelectorAll(".btn-whatsapp")).toHaveLength(1);
    });

    it("deve aplicar display inline-flex ao botão", async () => {
        await importarWhatsApp();

        const botao = document.querySelector(".btn-whatsapp");

        expect(botao.style.display).toBe("inline-flex");
    });
});
