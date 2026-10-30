
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const { criarPaginacaoMock } = vi.hoisted(() => ({
    criarPaginacaoMock: vi.fn()
}));

vi.mock("../../static/js/paginacao.js", () => ({
    criarPaginacao: criarPaginacaoMock
}));

describe("Renderização dos produtos do produtor", () => {
    let renderProdutos;
    let paginacaoMock;

    function prepararDOM() {
        document.body.innerHTML = `
            <input id="searchInput">
            <main>
                <div id="produtosContainer"></div>
            </main>
        `;
    }

    function produto(id, dados = {}) {
        return {
            id,
            nome: `Produto ${id}`,
            categoria: "frutas",
            unidade: "kg",
            preco: 5,
            quantidade: 10,
            status: "publicado",
            descricao: "Produto de teste",
            ...dados
        };
    }

    function obterHTML() {
        return document.getElementById("produtosContainer").innerHTML;
    }

    function obterTextoCategoria() {
        return document.querySelector(".categoria")?.textContent.trim();
    }

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        prepararDOM();

        globalThis.API = {
            meusProdutos: vi.fn()
        };

        globalThis.API_URL = "http://localhost:5000";

        globalThis.window.lucide = {
            createIcons: vi.fn()
        };

        paginacaoMock = {
            atualizar: vi.fn(),
            destruir: vi.fn()
        };

        criarPaginacaoMock.mockImplementation(({ aoMudarPagina }) => {
            paginacaoMock.atualizar.mockImplementation((lista) => {
                aoMudarPagina({
                    itens: lista.slice(0, 9)
                });
            });

            return paginacaoMock;
        });

        const modulo = await import(
            "../../static/js/produtores/renderizar.js"
        );

        renderProdutos = modulo.renderProdutos;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("não faz nada quando o container não existe", async () => {
        document.getElementById("produtosContainer").remove();

        await renderProdutos();

        expect(API.meusProdutos).not.toHaveBeenCalled();
    });

    it("mostra carregamento enquanto busca produtos na API", async () => {
        let resolver;

        API.meusProdutos.mockReturnValue(
            new Promise((resolve) => {
                resolver = resolve;
            })
        );

        const requisicao = renderProdutos();

        expect(obterHTML()).toContain("Carregando produtos");

        resolver([produto(1)]);

        await requisicao;
    });

    it("busca produtos na API quando a lista não é informada", async () => {
        API.meusProdutos.mockResolvedValue([
            produto(1)
        ]);

        await renderProdutos();

        expect(API.meusProdutos).toHaveBeenCalled();
    });

    it("usa lista recebida como parâmetro sem consultar a API", async () => {
        const lista = [produto(1)];

        await renderProdutos(lista);

        expect(API.meusProdutos).not.toHaveBeenCalled();
        expect(criarPaginacaoMock).toHaveBeenCalled();
    });

    it("ordena produtos pelo ID em ordem decrescente", async () => {
        const lista = [
            produto(1),
            produto(3),
            produto(2)
        ];

        await renderProdutos(lista);

        expect(paginacaoMock.atualizar).toHaveBeenCalledWith([
            produto(3),
            produto(2),
            produto(1)
        ]);
    });

    it("cria paginação com nove itens por página", async () => {
        await renderProdutos([produto(1)]);

        expect(criarPaginacaoMock).toHaveBeenCalledWith(
            expect.objectContaining({
                itensPorPagina: 9,
                container: expect.any(HTMLElement),
                aoMudarPagina: expect.any(Function)
            })
        );
    });

    it("cria wrapper e área de controles da paginação", async () => {
        await renderProdutos([produto(1)]);

        expect(document.querySelector(".area-lista-produtos"))
            .not.toBeNull();

        expect(document.querySelector(".area-controles-paginacao"))
            .not.toBeNull();
    });

    it("renderiza os cards recebidos pelo callback da paginação", async () => {
        await renderProdutos([
            produto(1),
            produto(2)
        ]);

        const html = obterHTML();

        expect(html).toContain("Produto 1");
        expect(html).toContain("Produto 2");
        expect(html).toContain("produtor-card");
    });

    it("formata preço em moeda brasileira", async () => {
        await renderProdutos([
            produto(1, { preco: 12.5 })
        ]);

        const preco = document.querySelector(".preco").textContent;

        expect(preco.replace(/\s+/g, " "))
            .toContain("R$ 12,50");
    });

    it("apresenta descrição padrão quando não existe descrição", async () => {
        await renderProdutos([
            produto(1, { descricao: "" })
        ]);

        expect(obterHTML())
            .toContain("Sem descrição disponível.");
    });

    it("apresenta quantidade zero quando quantidade não existe", async () => {
        await renderProdutos([
            produto(1, { quantidade: null })
        ]);

        expect(obterHTML())
            .toContain("Disponível:");

        expect(document.querySelector(".quantidade").textContent)
            .toContain("0");
    });

    it("apresenta status padrão quando status não existe", async () => {
        await renderProdutos([
            produto(1, { status: "" })
        ]);

        expect(obterHTML())
            .toContain("indefinido");
    });

    it("traduz categoria frutas", async () => {
        await renderProdutos([
            produto(1, { categoria: "frutas" })
        ]);

        expect(obterTextoCategoria()).toBe("Frutas");
    });

    it("traduz categoria legumes", async () => {
        await renderProdutos([
            produto(1, { categoria: "legumes" })
        ]);

        expect(obterTextoCategoria()).toBe("Legumes");
    });

    it("traduz categoria hortaliças", async () => {
        await renderProdutos([
            produto(1, { categoria: "hortalicas" })
        ]);

        expect(obterTextoCategoria()).toBe("Hortaliças");
    });

    it("traduz categoria grãos", async () => {
        await renderProdutos([
            produto(1, { categoria: "graos" })
        ]);

        expect(obterTextoCategoria()).toBe("Grãos e Cereais");
    });

    it("traduz unidade quilograma", async () => {
        await renderProdutos([
            produto(1, { unidade: "kg" })
        ]);

        expect(obterHTML())
            .toContain("quilograma");
    });

    it("usa primeira letra maiúscula para valores sem tradução", async () => {
        await renderProdutos([
            produto(1, { categoria: "especial" })
        ]);

        expect(obterTextoCategoria()).toBe("Especial");
    });

    it("apresenta Não informado quando o valor está vazio", async () => {
        await renderProdutos([
            produto(1, { unidade: "" })
        ]);

        expect(obterHTML())
            .toContain("Não informado");
    });

    it("usa imagem genérica quando produto não possui foto", async () => {
        await renderProdutos([
            produto(1, { foto: "" })
        ]);

        expect(document.querySelector(".produto-foto").getAttribute("src"))
            .toBe("../static/assets/produto_generico.png");
    });

    it("mantém URL HTTP da foto", async () => {
        await renderProdutos([
            produto(1, {
                foto: "http://cdn.exemplo.com/maca.png"
            })
        ]);

        expect(document.querySelector(".produto-foto").src)
            .toBe("http://cdn.exemplo.com/maca.png");
    });

    it("mantém URL HTTPS da foto", async () => {
        await renderProdutos([
            produto(1, {
                foto: "https://cdn.exemplo.com/maca.png"
            })
        ]);

        expect(document.querySelector(".produto-foto").src)
            .toBe("https://cdn.exemplo.com/maca.png");
    });

    it("monta URL para nome simples de arquivo", async () => {
        await renderProdutos([
            produto(1, { foto: "maca.png" })
        ]);

        expect(document.querySelector(".produto-foto").src)
            .toBe("http://localhost:5000/static/uploads/produtos/maca.png");
    });

    it("remove prefixo static do caminho da foto", async () => {
        await renderProdutos([
            produto(1, { foto: "static/uploads/produtos/maca.png" })
        ]);

        expect(document.querySelector(".produto-foto").src)
            .toBe("http://localhost:5000/static/uploads/produtos/maca.png");
    });

    it("remove barras iniciais do caminho da foto", async () => {
        await renderProdutos([
            produto(1, { foto: "/maca.png" })
        ]);

        expect(document.querySelector(".produto-foto").src)
            .toBe("http://localhost:5000/static/uploads/produtos/maca.png");
    });

    it("usa imagem genérica para foto_generica.png", async () => {
        await renderProdutos([
            produto(1, { foto: "foto_generica.png" })
        ]);

        expect(document.querySelector(".produto-foto").getAttribute("src"))
            .toBe("../static/assets/produto_generico.png");
    });

    it("usa imagem genérica para produto_generico.png", async () => {
        await renderProdutos([
            produto(1, { foto: "produto_generico.png" })
        ]);

        expect(document.querySelector(".produto-foto").getAttribute("src"))
            .toBe("../static/assets/produto_generico.png");
    });

    it("usa imagem genérica quando a imagem dispara erro", async () => {
        await renderProdutos([
            produto(1, { foto: "maca.png" })
        ]);

        const imagem = document.querySelector(".produto-foto");

        imagem.dispatchEvent(new Event("error"));

        expect(imagem.getAttribute("src"))
            .toBe("../static/assets/produto_generico.png");

        expect(imagem.dataset.fallback).toBe("true");
    });

    it("não repete fallback quando a imagem genérica também falha", async () => {
        await renderProdutos([
            produto(1, { foto: "maca.png" })
        ]);

        const imagem = document.querySelector(".produto-foto");

        imagem.dispatchEvent(new Event("error"));

        const srcFallback = imagem.getAttribute("src");

        imagem.dispatchEvent(new Event("error"));

        expect(imagem.getAttribute("src")).toBe(srcFallback);
    });

    it("atualiza ícones quando renderiza cards", async () => {
        await renderProdutos([produto(1)]);

        expect(window.lucide.createIcons).toHaveBeenCalled();
    });

    it("renderiza estado sem produtos quando API retorna lista vazia", async () => {
        API.meusProdutos.mockResolvedValue([]);

        await renderProdutos();

        expect(obterHTML())
            .toContain("Nenhum produto cadastrado");
    });

    it("renderiza estado sem resultados quando recebe lista vazia", async () => {
        await renderProdutos([]);

        expect(obterHTML())
            .toContain("Nenhum produto encontrado");
    });

    it("esconde paginação quando não existem produtos", async () => {
        await renderProdutos([produto(1)]);
        await renderProdutos([]);

        expect(document.querySelector(".area-controles-paginacao").hidden)
            .toBe(true);
    });

    it("renderiza erro quando a API retorna valor que não é array", async () => {
        API.meusProdutos.mockResolvedValue({
            erro: "Resposta inválida"
        });

        await renderProdutos();

        expect(obterHTML())
            .toContain("Não foi possível carregar os produtos");
    });

    it("renderiza erro quando a API lança exceção", async () => {
        API.meusProdutos.mockRejectedValue(
            new Error("Falha na API")
        );

        await renderProdutos();

        expect(obterHTML())
            .toContain("Não foi possível carregar os produtos");
    });

    it("usa todos os cards quando a paginação não pode ser criada", async () => {
        criarPaginacaoMock.mockReturnValue(null);

        await renderProdutos([produto(1)]);

        expect(obterHTML())
            .toContain("Produto 1");
    });

    it("destrói paginação anterior quando o container é recriado", async () => {
        await renderProdutos([produto(1)]);

        const primeiroContainer = document.getElementById("produtosContainer");

        primeiroContainer.remove();

        const novoContainer = document.createElement("div");
        novoContainer.id = "produtosContainer";

        document.querySelector("main").appendChild(novoContainer);

        await renderProdutos([produto(2)]);

        expect(paginacaoMock.destruir).toHaveBeenCalled();
    });

    it("filtra produtos pelo nome após debounce", async () => {
        vi.useFakeTimers();

        API.meusProdutos.mockResolvedValue([
            produto(1, { nome: "Maçã" }),
            produto(2, { nome: "Banana" })
        ]);

        await renderProdutos([produto(1)]);

        const input = document.getElementById("searchInput");

        input.value = "maçã";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        await vi.advanceTimersByTimeAsync(300);

        expect(API.meusProdutos).toHaveBeenCalled();

        expect(obterHTML())
            .toContain("Maçã");

        expect(obterHTML())
            .not.toContain("Banana");
    });

    it("ignora produtos sem nome durante a busca", async () => {
        vi.useFakeTimers();

        API.meusProdutos.mockResolvedValue([
            produto(1, { nome: "" }),
            produto(2, { nome: "Maçã" })
        ]);

        await renderProdutos([produto(1)]);

        const input = document.getElementById("searchInput");

        input.value = "maçã";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        await vi.advanceTimersByTimeAsync(300);

        expect(obterHTML())
            .toContain("Maçã");
    });

    it("ignora diferença entre maiúsculas e minúsculas na busca", async () => {
        vi.useFakeTimers();

        API.meusProdutos.mockResolvedValue([
            produto(1, { nome: "MAÇÃ" })
        ]);

        await renderProdutos([produto(1)]);

        const input = document.getElementById("searchInput");

        input.value = "maçã";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        await vi.advanceTimersByTimeAsync(300);

        expect(obterHTML())
            .toContain("MAÇÃ");
    });

    it("remove espaços do termo de busca", async () => {
        vi.useFakeTimers();

        API.meusProdutos.mockResolvedValue([
            produto(1, { nome: "Maçã" })
        ]);

        await renderProdutos([produto(1)]);

        const input = document.getElementById("searchInput");

        input.value = "  Maçã  ";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        await vi.advanceTimersByTimeAsync(300);

        expect(obterHTML())
            .toContain("Maçã");
    });

    it("trata erro ocorrido durante a busca", async () => {
        vi.useFakeTimers();

        API.meusProdutos.mockRejectedValue(
            new Error("Falha na busca")
        );

        vi.spyOn(console, "error").mockImplementation(() => {});

        await renderProdutos([produto(1)]);

        const input = document.getElementById("searchInput");

        input.value = "Maçã";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        await vi.advanceTimersByTimeAsync(300);

        expect(console.error).toHaveBeenCalledWith(
            "Erro ao filtrar produtos:",
            expect.any(Error)
        );
    });
});
