
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

let janela;
let container;
let fetchMock;
let authGet;
let createIcons;

const API_URL = "http://localhost:8000";

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

const avaliacoesMock = {
    escaparHTML,
    formatarNota: vi.fn(nota => Number(nota).toFixed(1)),
    formatarData: vi.fn(() => "29/10/2026"),
    estrelas: vi.fn((nota, tamanho) =>
        `<span class="estrelas-mock" data-tamanho="${tamanho}">${nota} estrelas</span>`
    ),
    resumo: vi.fn(() => '<span class="resumo-mock">Resumo das avaliações</span>')
};

function criarHTML() {
    document.body.innerHTML = `
        <main id="conteudoPerfilProdutor"></main>
    `;

    container = document.getElementById("conteudoPerfilProdutor");
}

function criarProdutor(dados = {}) {
    return {
        id: 123,
        nome: "João Produtor",
        foto_perfil: "/fotos/joao.png",
        cidade: "Campinas",
        estado: "SP",
        media_avaliacoes: 4.5,
        total_avaliacoes: 2,
        distribuicao: {
            "5.0": 1,
            "4.5": 1,
            "4.0": 0,
            "3.0": 0,
            "2.0": 0,
            "1.0": 0
        },
        avaliacoes: [
            {
                avaliador_nome: "Mercado Central",
                data: "2026-10-20",
                nota: 5,
                comentario: "Produtos excelentes!"
            },
            {
                avaliador_nome: "Mercado Verde",
                data: "2026-10-21",
                nota: 4.5,
                comentario: ""
            }
        ],
        produtos: [
            {
                id: 10,
                nome: "Tomate",
                foto: "/fotos/tomate.png",
                preco: 12.5,
                unidade: "kg"
            }
        ],
        ...dados
    };
}

function respostaJSON(dados, opcoes = {}) {
    return {
        status: opcoes.status ?? 200,
        ok: opcoes.ok ?? true,
        json: vi.fn().mockResolvedValue(dados)
    };
}

async function carregarMain() {
    vi.resetModules();

    await import("../../static/js/perfil_produtor/main.js");
}

describe("Perfil público do produtor - main.js", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        criarHTML();

        authGet = vi.fn().mockReturnValue({ id: 1 });
        fetchMock = vi.fn();
        createIcons = vi.fn();

        janela = {
            location: {
                pathname: "/produtor/123",
                href: ""
            },
            Avaliacoes: avaliacoesMock,
            lucide: {
                createIcons
            }
        };

        vi.stubGlobal("CONFIG", {
            API_URL
        });

        vi.stubGlobal("Auth", {
            get: authGet
        });

        vi.stubGlobal("fetch", fetchMock);
        vi.stubGlobal("window", janela);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.body.innerHTML = "";
        document.title = "";
    });

    it("redireciona para o login quando o usuário não está autenticado", async () => {
        authGet.mockReturnValue(null);

        await carregarMain();

        expect(janela.location.href).toBe("/login");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("busca o produtor na API usando o ID da URL e envia cookies", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor())
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                `${API_URL}/produtores/123`,
                {
                    credentials: "include"
                }
            );
        });
    });

    it("exibe os dados principais do produtor", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor())
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(container.textContent).toContain("João Produtor");
            expect(container.textContent).toContain("Produtor");
            expect(container.textContent).toContain("Campinas, SP");
            expect(container.querySelector(".pp-foto").getAttribute("src"))
                .toBe("/fotos/joao.png");
        });

        expect(document.title).toBe("João Produtor | AgroLink");
        expect(container.querySelector(".resumo-mock")).not.toBeNull();
    });

    it("exibe avaliações, notas, comentários e distribuição", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor())
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(container.textContent).toContain("Avaliações");
            expect(container.textContent).toContain("Mercado Central");
            expect(container.textContent).toContain("Produtos excelentes!");
            expect(container.textContent).toContain("2 avaliações");
        });

        expect(container.querySelectorAll(".pp-barra")).toHaveLength(5);
        expect(container.querySelectorAll(".item-avaliacao")).toHaveLength(2);
        expect(container.querySelector(".lista-avaliacoes").textContent)
            .not.toContain("undefined");
    });

    it("exibe o produto com preço formatado e link para o marketplace", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor())
        );

        await carregarMain();

        await vi.waitFor(() => {
            const produto = container.querySelector(".pp-produto");

            expect(produto).not.toBeNull();
            expect(produto.getAttribute("href"))
                .toBe("/marketplace?produto=10");
            expect(produto.textContent).toContain("Tomate");
            expect(produto.textContent).toContain("R$ 12,50 / kg");
            expect(produto.textContent).toContain("Ver e fazer pedido");
        });

        expect(container.querySelector(".pp-produto img").getAttribute("src"))
            .toBe("/fotos/tomate.png");
    });

    it("exibe mensagem quando o produtor não possui avaliações", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor({
                total_avaliacoes: 0,
                media_avaliacoes: 0,
                distribuicao: {},
                avaliacoes: []
            }))
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(container.textContent).toContain("Sem avaliações ainda");
            expect(container.textContent).toContain(
                "Este produtor ainda não recebeu avaliações de estabelecimentos."
            );
        });

        expect(container.querySelector(".lista-avaliacoes")).toBeNull();
    });

    it("exibe mensagem quando não há produtos publicados", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor({
                produtos: []
            }))
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(container.textContent).toContain("Produtos à venda");
            expect(container.textContent).toContain(
                "Nenhum produto publicado no momento."
            );
        });

        expect(container.querySelector(".pp-produtos")).toBeNull();
    });

    it("redireciona para o login quando a API retorna 401", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON({}, {
                status: 401,
                ok: false
            })
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(janela.location.href).toBe("/login");
        });

        expect(container.innerHTML).toBe("");
    });

    it("exibe mensagem de erro quando a API retorna uma falha", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON({
                detail: {
                    erro: "Produtor não encontrado."
                }
            }, {
                status: 404,
                ok: false
            })
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(container.textContent).toContain("Perfil não encontrado");
            expect(container.textContent).toContain(
                "Produtor não encontrado."
            );
        });

        expect(createIcons).toHaveBeenCalled();
    });

    it("usa a mensagem padrão quando a API falha sem detalhe", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON({}, {
                status: 500,
                ok: false
            })
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(container.textContent).toContain("Perfil não encontrado");
            expect(container.textContent).toContain(
                "Não foi possível carregar o perfil do produtor."
            );
        });
    });

    it("escapa HTML no nome do produtor e no comentário", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor({
                nome: '<script>alert("x")</script>',
                avaliacoes: [
                    {
                        avaliador_nome: "Mercado",
                        data: "2026-10-20",
                        nota: 5,
                        comentario: "<img src=x onerror=alert(1)>"
                    }
                ]
            }))
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(container.innerHTML).toContain("&lt;script&gt;");
            expect(container.innerHTML).toContain("&lt;img");
        });

        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector(".item-avaliacao img")).toBeNull();
    });

    it("inicializa os ícones do Lucide após renderizar a página", async () => {
        fetchMock.mockResolvedValue(
            respostaJSON(criarProdutor())
        );

        await carregarMain();

        await vi.waitFor(() => {
            expect(createIcons).toHaveBeenCalled();
        });
    });
});
