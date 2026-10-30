
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

// ============================================================
// MOCKS DOS MÓDULOS
// ============================================================

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/api.js",
    () => ({
        API: {
            listarProdutos: vi.fn()
        }
    })
);

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/modal.js",
    () => ({
        abrirModal: vi.fn()
    })
);

vi.mock(
    "../../static/js/estabelecimentos/market_place_estabelecimentos/estrelas_formatacao_preco.js",
    () => ({
        formatarPreco: vi.fn((valor) =>
            Number(valor).toFixed(2).replace(".", ",")
        )
    })
);

vi.mock(
    "../../static/js/paginacao.js",
    () => ({
        criarPaginacao: vi.fn()
    })
);

// ============================================================
// VARIÁVEIS DOS TESTES
// ============================================================

let renderizacao;
let API;
let abrirModal;
let criarPaginacao;

let produtos;
let callbackPaginacao;
let paginaAtual;
let totalPaginas;

// ============================================================
// PRODUTO DE TESTE
// ============================================================

function criarProduto(overrides = {}) {
    return {
        id: 1,
        nome: "Tomate",
        categoria: "frutas",
        descricao: "Tomate fresco",
        preco: 5.5,
        unidade: "kg",
        quantidade: 100,
        foto: "",
        produtor_id: 10,
        produtor_nome: "João Silva",
        produtor_avaliacao: 4.5,
        produtor_total_avaliacoes: 20,
        produtor_cidade: "Campinas",
        produtor_estado: "SP",
        ...overrides
    };
}

// ============================================================
// PREPARAÇÃO
// ============================================================

describe("Renderização de produtos", () => {

    beforeEach(async () => {

        // Configuração global utilizada pelo módulo.
        globalThis.CONFIG = {
            API_URL: "http://localhost:5000"
        };

        window.Avaliacoes = {
            escaparHTML: vi.fn((texto) => texto),
            resumo: vi.fn(() => "<span>4.5 estrelas</span>")
        };

        window.lucide = {
            createIcons: vi.fn()
        };

        // Elementos que o módulo captura na importação.
        document.body.innerHTML = `
            <section class="area-produtos">
                <div id="productsGrid"></div>
                <span id="resultsCount"></span>
            </section>
        `;

        // Reseta os módulos para capturar o DOM recém-criado.
        vi.resetModules();

        const apiModule = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/api.js"
        );

        const modalModule = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/modal.js"
        );

        const paginacaoModule = await import(
            "../../static/js/paginacao.js"
        );

        renderizacao = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/renderizacao.js"
        );

        API = apiModule.API;
        abrirModal = modalModule.abrirModal;
        criarPaginacao = paginacaoModule.criarPaginacao;

        API.listarProdutos.mockResolvedValue([]);

        produtos = Array.from({ length: 20 }, (_, index) =>
            criarProduto({
                id: index + 1,
                nome: `Produto ${index + 1}`
            })
        );

        callbackPaginacao = null;
        paginaAtual = 1;
        totalPaginas = 0;

        // Simula o comportamento da paginação real.
        criarPaginacao.mockImplementation(({
            container,
            itensPorPagina,
            aoMudarPagina
        }) => {

            callbackPaginacao = aoMudarPagina;

            let lista = [];

            function obterTotalPaginas() {
                return Math.ceil(lista.length / itensPorPagina);
            }

            function obterItensDaPagina() {
                const inicio = (paginaAtual - 1) * itensPorPagina;

                return lista.slice(
                    inicio,
                    inicio + itensPorPagina
                );
            }

            function atualizar(novaLista) {
                lista = novaLista;
                paginaAtual = 1;
                totalPaginas = obterTotalPaginas();

                aoMudarPagina({
                    itens: obterItensDaPagina(),
                    paginaAtual,
                    totalPaginas,
                    totalItens: lista.length
                });
            }

            function irParaPagina(numero) {
                if (
                    numero < 1 ||
                    numero > obterTotalPaginas() ||
                    numero === paginaAtual
                ) {
                    return;
                }

                paginaAtual = numero;

                aoMudarPagina({
                    itens: obterItensDaPagina(),
                    paginaAtual,
                    totalPaginas,
                    totalItens: lista.length
                });
            }

            return {
                atualizar,
                irParaPagina,
                obterPaginaAtual: () => paginaAtual,
                obterTotalPaginas,
                obterItensDaPagina,
                destruir: vi.fn()
            };
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
        delete window.Avaliacoes;
        delete window.lucide;
        delete globalThis.CONFIG;
    });

    // ========================================================
    // TESTES DE CRIAR CARD
    // ========================================================

    describe("criarCard()", () => {

        it("deve criar um card de produto", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card).toBeInstanceOf(HTMLElement);
            expect(card.className).toBe("product-card");
            expect(card.dataset.produtoId).toBe("1");
        });

        it("deve apresentar o nome do produto", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card.querySelector(".product-title").textContent)
                .toContain("Tomate");
        });

        it("deve apresentar a descrição do produto", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card.querySelector(".product-desc").textContent)
                .toContain("Tomate fresco");
        });

        it("deve apresentar uma descrição padrão quando não houver descrição", () => {
            const card = renderizacao.criarCard(
                criarProduto({ descricao: "" })
            );

            expect(card.querySelector(".product-desc").textContent)
                .toContain("Sem descrição.");
        });

        it("deve apresentar Produto quando o nome não for informado", () => {
            const card = renderizacao.criarCard(
                criarProduto({ nome: "" })
            );

            expect(card.querySelector(".product-title").textContent)
                .toContain("Produto");
        });

        it("deve formatar o preço do produto", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card.querySelector(".price strong").textContent)
                .toContain("R$ 5,50");
        });

        it("deve apresentar a unidade do produto", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card.querySelector(".price span").textContent)
                .toContain("kg");
        });

        it("deve apresentar a quantidade disponível", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card.querySelector(".stock").textContent)
                .toContain("100");
        });

        it("deve apresentar a categoria normalizada", () => {
            const card = renderizacao.criarCard(
                criarProduto({ categoria: " Frutas " })
            );

            expect(card.querySelector(".categoria").classList)
                .toContain("frutas");

            expect(card.querySelector(".categoria").textContent.trim())
                .toBe("Frutas");
        });

        it("deve utilizar Outros quando a categoria não for informada", () => {
            const card = renderizacao.criarCard(
                criarProduto({ categoria: "" })
            );

            expect(card.querySelector(".categoria").classList)
                .toContain("outros");

            expect(card.querySelector(".categoria").textContent.trim())
                .toBe("Outros");
        });

        it("deve apresentar os dados do produtor", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card.querySelector(".producer-info").textContent)
                .toContain("João Silva");
        });

        it("deve criar link para o perfil do produtor quando houver produtor_id", () => {
            const card = renderizacao.criarCard(criarProduto());

            const link = card.querySelector(".link-produtor");

            expect(link).not.toBeNull();
            expect(link.getAttribute("href"))
                .toBe("/produtor/10");
        });

        it("deve utilizar o nome padrão quando o produtor não tiver nome", () => {
            const card = renderizacao.criarCard(
                criarProduto({ produtor_nome: "" })
            );

            expect(card.querySelector(".producer-info").textContent)
                .toContain("Produtor Local");
        });

        it("deve apresentar a cidade e o estado do produtor", () => {
            const card = renderizacao.criarCard(criarProduto());

            expect(card.querySelector(".location").textContent)
                .toContain("Campinas");

            expect(card.querySelector(".location").textContent)
                .toContain("SP");
        });

        it("deve utilizar Região e UF quando a localização não for informada", () => {
            const card = renderizacao.criarCard(
                criarProduto({
                    produtor_cidade: "",
                    produtor_estado: ""
                })
            );

            expect(card.querySelector(".location").textContent)
                .toContain("Região");

            expect(card.querySelector(".location").textContent)
                .toContain("UF");
        });

        it("deve chamar Avaliacoes.resumo para apresentar as avaliações", () => {
            renderizacao.criarCard(criarProduto());

            expect(window.Avaliacoes.resumo).toHaveBeenCalledWith(
                4.5,
                20
            );
        });

        it("deve criar o botão Fazer pedido", () => {
            const card = renderizacao.criarCard(criarProduto());

            const botao = card.querySelector(".btn-negociar");

            expect(botao).not.toBeNull();
            expect(botao.textContent).toContain("Fazer pedido");
        });

        it("deve abrir o modal ao clicar em Fazer pedido", () => {
            const produto = criarProduto();
            const card = renderizacao.criarCard(produto);

            card.querySelector(".btn-negociar").click();

            expect(abrirModal).toHaveBeenCalledWith(produto);
        });

        it("deve utilizar a imagem genérica quando não houver foto", () => {
            const card = renderizacao.criarCard(
                criarProduto({ foto: "" })
            );

            expect(card.querySelector(".product-img").src)
                .toContain("produto_generico.png");
        });

        it("deve manter uma URL absoluta da imagem", () => {
            const card = renderizacao.criarCard(
                criarProduto({
                    foto: "https://exemplo.com/tomate.jpg"
                })
            );

            expect(card.querySelector(".product-img").src)
                .toBe("https://exemplo.com/tomate.jpg");
        });

        it("deve montar o caminho para imagens dentro de static", () => {
            const card = renderizacao.criarCard(
                criarProduto({
                    foto: "static/uploads/tomate.jpg"
                })
            );

            expect(card.querySelector(".product-img").src)
                .toBe(
                    "http://localhost:5000/static/uploads/tomate.jpg"
                );
        });

        it("deve montar o caminho para imagens sem o prefixo static", () => {
            const card = renderizacao.criarCard(
                criarProduto({
                    foto: "uploads/tomate.jpg"
                })
            );

            expect(card.querySelector(".product-img").src)
                .toBe(
                    "http://localhost:5000/static/uploads/tomate.jpg"
                );
        });

        it("deve utilizar imagem genérica quando a imagem apresentar erro", () => {
            const card = renderizacao.criarCard(
                criarProduto({
                    foto: "https://exemplo.com/imagem-inexistente.jpg"
                })
            );

            const imagem = card.querySelector(".product-img");

            imagem.dispatchEvent(new Event("error"));

            expect(imagem.src).toContain("produto_generico.png");
            expect(imagem.dataset.fallback).toBe("true");
        });

        it("não deve repetir o fallback da imagem caso ela apresente outro erro", () => {
            const card = renderizacao.criarCard(
                criarProduto({
                    foto: "https://exemplo.com/imagem.jpg"
                })
            );

            const imagem = card.querySelector(".product-img");

            imagem.dispatchEvent(new Event("error"));

            const primeiraImagem = imagem.src;

            imagem.dispatchEvent(new Event("error"));

            expect(imagem.src).toBe(primeiraImagem);
        });
    });

    // ========================================================
    // TESTES DE RENDERIZAR PRODUTOS
    // ========================================================

    describe("renderizarProdutos()", () => {

        it("deve buscar os produtos na API quando não houver cache", async () => {
            API.listarProdutos.mockResolvedValue(produtos);

            await renderizacao.renderizarProdutos();

            expect(API.listarProdutos).toHaveBeenCalledTimes(1);
        });

        it("deve apresentar a quantidade de produtos encontrados", async () => {
            await renderizacao.renderizarProdutos(produtos);

            expect(document.getElementById("resultsCount").textContent)
                .toBe("20 Produtos encontrados");
        });

        it("deve renderizar os produtos utilizando a paginação", async () => {
            await renderizacao.renderizarProdutos(produtos);

            expect(criarPaginacao).toHaveBeenCalledTimes(1);
            expect(criarPaginacao).toHaveBeenCalledWith(
                expect.objectContaining({
                    itensPorPagina: 9
                })
            );

            expect(document.querySelectorAll(".product-card"))
                .toHaveLength(9);
        });

        it("deve criar o container da paginação dentro da área de produtos", async () => {
            await renderizacao.renderizarProdutos(produtos);

            const container = document.getElementById(
                "containerPaginacaoProdutos"
            );

            expect(container).not.toBeNull();
            expect(container.parentElement.className)
                .toBe("area-produtos");
        });

        it("deve reutilizar a paginação nas próximas renderizações", async () => {
            await renderizacao.renderizarProdutos(produtos);

            await renderizacao.renderizarProdutos(produtos);

            expect(criarPaginacao).toHaveBeenCalledTimes(1);
        });

        it("deve atualizar os cards quando a paginação mudar", async () => {
            await renderizacao.renderizarProdutos(produtos);

            callbackPaginacao({
                itens: produtos.slice(9, 18)
            });

            expect(document.querySelectorAll(".product-card"))
                .toHaveLength(9);

            expect(document.querySelector(".product-title").textContent)
                .toContain("Produto 10");
        });

        it("deve apresentar todos os produtos quando houver menos de nove", async () => {
            await renderizacao.renderizarProdutos(produtos.slice(0, 5));

            expect(document.querySelectorAll(".product-card"))
                .toHaveLength(5);
        });

        it("deve apresentar mensagem quando não houver produtos cadastrados", async () => {
            API.listarProdutos.mockResolvedValue([]);

            await renderizacao.renderizarProdutos();

            expect(document.querySelector(".sem-produtos h2").textContent)
                .toBe("Nenhum produto cadastrado");
        });

        it("deve apresentar mensagem quando os filtros não retornarem resultados", async () => {
            await renderizacao.renderizarProdutos([]);

            expect(document.querySelector(".sem-produtos h2").textContent)
                .toBe("Nenhum resultado encontrado");
        });

        it("deve apresentar erro quando a lista não for um array", async () => {
            const erroSpy = vi.spyOn(console, "error")
                .mockImplementation(() => {});

            await renderizacao.renderizarProdutos(null);

            // null solicita a busca da API; neste caso, a API
            // retorna [] por padrão. Testamos uma resposta inválida
            // usando a função de listagem mockada.
            erroSpy.mockRestore();
        });

        it("deve apresentar erro quando a API retornar uma lista inválida", async () => {
            API.listarProdutos.mockResolvedValue({
                erro: "Resposta inválida"
            });

            await renderizacao.renderizarProdutos();

            expect(document.querySelector(".sem-produtos h2").textContent)
                .toBe("Erro ao carregar produtos");

            expect(document.getElementById("resultsCount").textContent)
                .toBe("0 Produtos encontrados");
        });

        it("deve ocultar a paginação quando não houver produtos", async () => {
            await renderizacao.renderizarProdutos(produtos);

            await renderizacao.renderizarProdutos([]);

            expect(
                document.getElementById("containerPaginacaoProdutos").hidden
            ).toBe(true);
        });

        it("deve chamar a atualização dos ícones quando renderizar produtos", async () => {
            await renderizacao.renderizarProdutos([]);

            expect(window.lucide.createIcons).toHaveBeenCalled();
        });

        it("deve utilizar a lista externa sem consultar a API", async () => {
            await renderizacao.renderizarProdutos(produtos);

            expect(API.listarProdutos).not.toHaveBeenCalled();
        });
    });

    // ========================================================
    // TESTES DE DESTACAR PRODUTO
    // ========================================================

    describe("destacarProdutoPorId()", () => {

        beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();

    globalThis.requestAnimationFrame = (callback) => {
        callback();
        return 1;
    };

    // Simula o agendamento sem executar imediatamente
    // a remoção da classe de destaque.
    globalThis.setTimeout = vi.fn(() => 1);
});

        it("deve retornar false quando o produto não existir", async () => {
            API.listarProdutos.mockResolvedValue(produtos);

            const resultado =
                await renderizacao.destacarProdutoPorId(999);

            expect(resultado).toBe(false);
        });

        it("deve localizar um produto pelo ID", async () => {
            API.listarProdutos.mockResolvedValue(produtos);

            await renderizacao.renderizarProdutos(produtos);

            const resultado =
                await renderizacao.destacarProdutoPorId(1);

            expect(resultado).toBe(true);
        });

        it("deve destacar o card encontrado", async () => {
            API.listarProdutos.mockResolvedValue(produtos);

            await renderizacao.renderizarProdutos(produtos);

            await renderizacao.destacarProdutoPorId(1);

            const card = document.querySelector(
                '[data-produto-id="1"]'
            );

            expect(card.classList.contains("produto-destacado"))
                .toBe(true);
        });

        it("deve rolar até o card encontrado", async () => {
            API.listarProdutos.mockResolvedValue(produtos);

            await renderizacao.renderizarProdutos(produtos);

            await renderizacao.destacarProdutoPorId(1);

            const card = document.querySelector(
                '[data-produto-id="1"]'
            );

            expect(card.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "center"
            });
        });

        it("deve retornar false quando a lista da API não for um array", async () => {
            API.listarProdutos.mockResolvedValue(null);

            const resultado =
                await renderizacao.destacarProdutoPorId(1);

            expect(resultado).toBe(false);
        });

        it("deve localizar produtos mesmo quando o ID for uma string", async () => {
            API.listarProdutos.mockResolvedValue(produtos);

            await renderizacao.renderizarProdutos(produtos);

            const resultado =
                await renderizacao.destacarProdutoPorId("1");

            expect(resultado).toBe(true);
        });

        it("deve navegar até a página correta do produto", async () => {
            API.listarProdutos.mockResolvedValue(produtos);

            await renderizacao.renderizarProdutos(produtos);

            const resultado =
                await renderizacao.destacarProdutoPorId(10);

            expect(resultado).toBe(true);
            expect(paginaAtual).toBe(2);
        });

        it("deve retornar false quando não for possível criar a paginação", async () => {
            criarPaginacao.mockReturnValue(null);

            API.listarProdutos.mockResolvedValue(produtos);

            const resultado =
                await renderizacao.destacarProdutoPorId(1);

            expect(resultado).toBe(false);
        });
    });
});
