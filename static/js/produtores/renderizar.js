/**
 * ARQUIVO: renderizar.js
 * OBJETIVO:
 * - Renderizar os produtos do produtor na tela de forma otimizada.
 * - Utilizar URLs SAS do Azure Blob Storage quando disponíveis.
 * - Utilizar imagem genérica quando o produto não possuir foto
 *   ou quando a imagem não puder ser carregada.
 * - Utilizar o componente reutilizável de paginação.
 */

import { criarPaginacao } from '../paginacao.js';

// ==========================================
// CONSTANTES DE FALLBACK
// ==========================================
const FOTO_GENERICA = "../static/assets/produto_generico.png";
const ITENS_POR_PAGINA = 9;

// ==========================================
// CONTROLE DA PAGINAÇÃO
// ==========================================
let paginacao = null;
let containerPaginacao = null;
let containerProdutosPaginados = null;

// ==========================================
// DICIONÁRIO E AUXILIARES
// ==========================================
const dicionarioTraducao = {
    "kg": "quilograma",
    "g": "grama",
    "arroba": "arroba",
    "t": "tonelada",
    "unidade": "unidade",
    "duzia": "dúzia",
    "cento": "cento",
    "milheiro": "milheiro",
    "caixa": "caixa",
    "saca": "saca",
    "maco": "maço",
    "bandeja": "bandeja",
    "litro": "litro",
    "frutas": "Frutas",
    "legumes": "Legumes",
    "hortalicas": "Hortaliças",
    "graos": "Grãos e Cereais",
    "oleaginosas": "Oleaginosas e Sementes",
    "ervas": "Ervas e Temperos",
    "outros": "Outros"
};

function formatarLabel(valor) {
    if (!valor) return "Não informado";

    return (
        dicionarioTraducao[valor.toLowerCase()]
        || valor.charAt(0).toUpperCase() + valor.slice(1)
    );
}

// ==========================================
// CARDS DE ESTADO
// ==========================================
function renderizarCarregando(container) {
    container.innerHTML = `
        <div class="carregando-produtos">
            <div class="spinner-produtos"></div>
            <p>Carregando produtos...</p>
        </div>
    `;
}

function renderizarSemProdutos(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="package-open"></i>
            <h2>Nenhum produto cadastrado</h2>
            <p>Você ainda não possui produtos cadastrados. Cadastre um produto para começar a disponibilizá-lo no marketplace.</p>
        </div>
    `;

    atualizarIcones();
}

function renderizarSemResultados(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="search-x"></i>
            <h2>Nenhum produto encontrado</h2>
            <p>Não encontramos nenhum produto para a sua busca. Tente pesquisar utilizando outro nome.</p>
        </div>
    `;

    atualizarIcones();
}

function renderizarErro(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="triangle-alert"></i>
            <h2>Não foi possível carregar os produtos</h2>
            <p>Ocorreu um problema ao carregar seus produtos. Tente novamente em alguns instantes.</p>
        </div>
    `;

    atualizarIcones();
}

function atualizarIcones() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==========================================
// RESOLVER FOTO DO PRODUTO
// ==========================================
function resolverCaminhoFoto(produto) {

    if (!produto || !produto.foto) {
        return FOTO_GENERICA;
    }

    let foto = String(produto.foto).trim();

    if (
        foto.startsWith("http://")
        || foto.startsWith("https://")
    ) {
        return foto;
    }

    foto = foto.replace(/^\/+/, "");
    foto = foto.replace(/^static\//, "");
    foto = foto.replace(/^uploads\/produtos\//, "");

    if (
        foto === "foto_generica.png"
        || foto === "produto_generico.png"
    ) {
        return FOTO_GENERICA;
    }

    const baseApi = (
        typeof API_URL !== "undefined"
            ? API_URL
            : ""
    ).replace(/\/$/, "");

    const urlAntiga =
        `${baseApi}/static/uploads/produtos/${foto}`;

    return urlAntiga;
}

// ==========================================
// CONFIGURAR FALLBACK DA IMAGEM
// ==========================================
function configurarFallbackImagem(imagem) {

    if (!imagem) return;

    imagem.addEventListener("error", () => {

        if (imagem.dataset.fallback === "true") {
            return;
        }

        imagem.dataset.fallback = "true";

        imagem.src = FOTO_GENERICA;
    });
}

// ==========================================
// PREPARAR CONTAINER DA PAGINAÇÃO
// ==========================================
function obterContainerPaginacao(container) {

    if (
        containerPaginacao?.isConnected
        && containerProdutosPaginados === container
    ) {
        return containerPaginacao;
    }

    // Evita duplicar a paginação caso o container
    // dos produtos seja recriado.
    if (paginacao) {
        paginacao.destruir();
        paginacao = null;
    }

    const wrapper = document.createElement("div");

    wrapper.className = "area-lista-produtos";
    wrapper.style.width = "100%";
    wrapper.style.minWidth = "0";

    const host = document.createElement("div");

    host.className = "area-controles-paginacao";
    host.style.width = "100%";

    // Agrupa o grid e a paginação para que os controles
    // fiquem abaixo dos cards, sem virar outra coluna.
    const pai = container.parentElement;

    if (!pai) {
        return null;
    }

    pai.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    wrapper.appendChild(host);

    containerProdutosPaginados = container;
    containerPaginacao = host;

    return containerPaginacao;
}

// ==========================================
// INICIALIZAR PAGINAÇÃO
// ==========================================
function inicializarPaginacao(container) {

    const host = obterContainerPaginacao(container);

    if (!host) {
        console.error(
            "Não foi possível criar o container da paginação."
        );

        return null;
    }

    if (!paginacao) {
        paginacao = criarPaginacao({
            container: host,

            itensPorPagina: ITENS_POR_PAGINA,

            aoMudarPagina({ itens }) {
                renderizarCards(itens, container);
            }
        });
    }

    return paginacao;
}

// ==========================================
// RENDERIZAR CARDS
// ==========================================
function renderizarCards(lista, container) {

    console.time("⏱️ Renderização dos cards");

    const htmlCards = lista.map(produto => {

        const produtoJSON =
            JSON.stringify(produto)
                .replace(/'/g, "&apos;");

        const caminhoFoto =
            resolverCaminhoFoto(produto);

        const precoFormatado =
            new Intl.NumberFormat(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            ).format(produto.preco || 0);

        const status = produto.status || "indefinido";

        return `
            <div class="produtor-card">

                <div class="status ${status}">
                    <span>
                        ● ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>

                <div class="card-image-container">
                    <img
                        src="${caminhoFoto}"
                        alt="${produto.nome}"
                        loading="lazy"
                        class="produto-foto"
                    >
                </div>

                <div class="produtor-info">

                    <h2>
                        ${produto.nome}
                    </h2>

                    <span class="categoria ${produto.categoria || "geral"}">
                        ${formatarLabel(produto.categoria)}
                    </span>

                    <p class="descricao">
                        ${produto.descricao || "Sem descrição disponível."}
                    </p>

                    <strong class="preco">
                        ${precoFormatado}/${formatarLabel(produto.unidade)}
                    </strong>

                    <p class="quantidade">
                        Disponível:
                        ${produto.quantidade || 0}
                        ${formatarLabel(produto.unidade)}(s)
                    </p>

                    <div class="botoes-card">

                        <button
                            class="editar-card-btn"
                            onclick='prepararEdicao(${produtoJSON})'
                        >
                            <i data-lucide="square-pen"></i>
                            <span>Editar</span>
                        </button>

                        <button
                            class="excluir-card-btn"
                            title="Excluir Produto"
                            onclick="window.prepararExclusao(${produto.id}, '${produto.nome}')"
                        >
                            <i data-lucide="trash-2"></i>
                        </button>

                    </div>

                </div>

            </div>
        `;
    }).join("");

    // Insere somente os produtos da página atual.
    container.innerHTML = htmlCards;

    const imagens = container.querySelectorAll(".produto-foto");

    imagens.forEach(imagem => {
        configurarFallbackImagem(imagem);
    });

    atualizarIcones();

    console.timeEnd("⏱️ Renderização dos cards");
}

// ==========================================
// BUSCA DADOS E RENDERIZAÇÃO
// ==========================================
async function renderProdutos(listaParaRenderizar) {

    const container = document.getElementById("produtosContainer");

    if (!container) {
        return;
    }

    // Mostra o carregamento apenas quando a lista
    // ainda será buscada na API.
    if (listaParaRenderizar === undefined) {
        renderizarCarregando(container);
    }

    let lista;

    try {

        lista = listaParaRenderizar !== undefined
            ? listaParaRenderizar
            : await API.meusProdutos();

    } catch (err) {

        if (containerPaginacao) {
            containerPaginacao.hidden = true;
        }

        renderizarErro(container);

        return;
    }

    if (!Array.isArray(lista)) {

        if (containerPaginacao) {
            containerPaginacao.hidden = true;
        }

        renderizarErro(container);

        return;
    }

    // ==========================================
    // NENHUM PRODUTO ENCONTRADO
    // ==========================================
    if (lista.length === 0) {

        if (paginacao) {
            paginacao.atualizar([]);
        }

        if (containerPaginacao) {
            containerPaginacao.hidden = true;
        }

        if (listaParaRenderizar !== undefined) {
            renderizarSemResultados(container);
        } else {
            renderizarSemProdutos(container);
        }

        return;
    }

    // ==========================================
    // ATUALIZAR PAGINAÇÃO
    // ==========================================
    const componentePaginacao = inicializarPaginacao(container);

    if (!componentePaginacao) {
        // Fallback: se a paginação não puder ser
        // inicializada, mostra todos os produtos.
        renderizarCards(lista, container);
        return;
    }

    containerPaginacao.hidden = false;

    // O componente controla a página atual e chama
    // renderizarCards() com os itens correspondentes.
    componentePaginacao.atualizar(lista);
}

// ==========================================
// FILTRO DE BUSCA COM DEBOUNCE
// ==========================================
let debounceTimer;

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", (e) => {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {

            const termoBusca = e.target.value
                .toLowerCase()
                .trim();

            try {

                const todosProdutos = await API.meusProdutos();

                const filtrados = todosProdutos.filter(
                    p =>
                        p.nome
                        && p.nome.toLowerCase().includes(termoBusca)
                );

                // atualizar() reinicia a paginação
                // na primeira página para cada busca.
                await renderProdutos(filtrados);

            } catch (err) {

                console.error(
                    "Erro ao filtrar produtos:",
                    err
                );
            }

        }, 300);
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    renderProdutos();
});
