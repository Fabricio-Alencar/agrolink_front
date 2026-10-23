import { DOM } from './acesso_a_elementos_DOM.js';
import { formatarPreco } from './estrelas_formatacao_preco.js';
import { abrirModal } from './modal.js';
import { API } from './api.js';
import { criarPaginacao } from '../../paginacao.js';

// ============================================================
// CONFIGURAÇÃO E CACHE
// ============================================================

let cacheProdutos = null;

const API_URL = CONFIG.API_URL;
const FOTO_PRODUTO_GENERICA = "../static/assets/produto_generico.png";
const ITENS_POR_PAGINA = 9;

// ============================================================
// PAGINAÇÃO REUTILIZÁVEL
// ============================================================

// O container será criado automaticamente abaixo da grade.
let containerPaginacao = null;
let paginacao = null;

// ============================================================
// TRADUÇÃO
// ============================================================

const dicionarioTraducao = {
    // UNIDADES
    "kg": "kg",
    "g": "g",
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

    // CATEGORIAS
    "frutas": "Frutas",
    "legumes": "Legumes",
    "hortalicas": "Hortaliças",
    "graos": "Grãos e Cereais",
    "oleaginosas": "Oleaginosas e Sementes",
    "ervas": "Ervas e Temperos",
    "laticinios": "Laticínios",
    "proteinas": "Proteínas",
    "outros": "Outros"
};

// ============================================================
// FORMATAR LABEL
// ============================================================

function formatarLabel(valor) {
    if (!valor) {
        return "Não informado";
    }

    const valorNormalizado = String(valor)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return (
        dicionarioTraducao[valorNormalizado] ||
        String(valor).charAt(0).toUpperCase() + String(valor).slice(1)
    );
}

// ============================================================
// NORMALIZAR CATEGORIA
// ============================================================

function normalizarCategoria(categoria) {
    if (!categoria) {
        return "outros";
    }

    return String(categoria)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// ============================================================
// RESOLVER CAMINHO DA IMAGEM
// ============================================================

function resolverCaminhoFoto(produto) {
    if (!produto.foto) {
        return FOTO_PRODUTO_GENERICA;
    }

    const foto = String(produto.foto).trim();

    if (foto.startsWith("http://") || foto.startsWith("https://")) {
        return foto;
    }

    const caminhoNormalizado = foto.replace(/^\/+/, "");

    if (caminhoNormalizado.startsWith("static/")) {
        return `${API_URL}/${caminhoNormalizado}`;
    }

    return `${API_URL}/static/${caminhoNormalizado}`;
}

// ============================================================
// AUXILIARES DA UI
// ============================================================

function limparGrid() {
    if (DOM.grid) {
        DOM.grid.innerHTML = '';
    }
}

function atualizarContador(qtd) {
    if (DOM.resultsCount) {
        DOM.resultsCount.textContent = `${qtd} Produtos encontrados`;
    }
}

function atualizarIcones() {
    if (window.lucide) {
        try {
            window.lucide.createIcons();
        } catch (erro) {
            console.error("❌ Erro ao criar ícones:", erro);
        }
    }
}

// ============================================================
// CONTAINER DA PAGINAÇÃO
// ============================================================

function obterContainerPaginacao() {
    if (containerPaginacao?.isConnected) {
        return containerPaginacao;
    }

    if (!DOM.grid?.parentElement) {
        return null;
    }

    containerPaginacao = document.createElement('div');
    containerPaginacao.id = 'containerPaginacaoProdutos';
    containerPaginacao.className = 'container-paginacao-produtos';

    // Insere a paginação dentro da área de produtos,
    // sem transformá-la em uma terceira coluna.
    const areaProdutos = DOM.grid.closest('.area-produtos');

    if (areaProdutos) {
        areaProdutos.appendChild(containerPaginacao);
    } else {
        DOM.grid.insertAdjacentElement('afterend', containerPaginacao);
    }

    return containerPaginacao;
}

// ============================================================
// INICIALIZAR PAGINAÇÃO
// ============================================================

function inicializarPaginacao() {
    const container = obterContainerPaginacao();

    if (!container) {
        console.error(
            'Não foi possível criar o container da paginação.'
        );
        return null;
    }

    if (!paginacao) {
        paginacao = criarPaginacao({
            container,
            itensPorPagina: ITENS_POR_PAGINA,

            // Executada quando a página atual mudar.
            aoMudarPagina({ itens }) {
                limparGrid();

                itens.forEach(produto => {
                    DOM.grid.appendChild(criarCard(produto));
                });

                atualizarIcones();
            }
        });
    }

    return paginacao;
}

// ============================================================
// ESTADOS DA UI
// ============================================================

function renderizarCarregando() {
    DOM.grid.innerHTML = `
        <div class="carregando-produtos">
            <div class="spinner-produtos"></div>
            <p>Carregando produtos...</p>
        </div>
    `;

    ocultarPaginacao();
}

function renderizarSemProdutos() {
    DOM.grid.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="package-search"></i>
            <h2>Nenhum produto cadastrado</h2>
            <p>Os produtores ainda não cadastraram produtos para venda. Tente novamente mais tarde.</p>
        </div>
    `;

    ocultarPaginacao();
    atualizarIcones();
}

function renderizarSemResultados() {
    DOM.grid.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="search-x"></i>
            <h2>Nenhum resultado encontrado</h2>
            <p>Não encontramos nenhum produto com os filtros ou termos utilizados. Tente realizar uma nova busca.</p>
        </div>
    `;

    ocultarPaginacao();
    atualizarIcones();
}

function renderizarErro() {
    DOM.grid.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="triangle-alert"></i>
            <h2>Erro ao carregar produtos</h2>
            <p>Não foi possível carregar os produtos neste momento. Tente novamente em alguns instantes.</p>
        </div>
    `;

    ocultarPaginacao();
    atualizarIcones();
}

function ocultarPaginacao() {
    if (containerPaginacao) {
        containerPaginacao.hidden = true;
    }
}

// ============================================================
// CRIAR CARD DE PRODUTO
// ============================================================

export function criarCard(prod) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.produtoId = prod.id;

    const urlImagem = resolverCaminhoFoto(prod);
    const categoria = normalizarCategoria(prod.categoria);
    const categoriaLabel = formatarLabel(categoria);

    card.innerHTML = `
        <img
            src="${urlImagem}"
            alt="${prod.nome || 'Produto'}"
            loading="lazy"
            class="product-img"
        >

        <div class="product-info">
            <h3 class="product-title">
                ${prod.nome || 'Produto'}
            </h3>

            <span class="categoria ${categoria}">
                ${categoriaLabel}
            </span>

            <p class="product-desc">
                ${prod.descricao || 'Sem descrição.'}
            </p>

            <div class="price-row">
                <div class="price">
                    <strong>
                        R$ ${formatarPreco(prod.preco)}
                    </strong>
                    <span>
                        / ${formatarLabel(prod.unidade)}
                    </span>
                </div>

                <div class="stock">
                    Total: ${prod.quantidade} ${formatarLabel(prod.unidade)}(s)
                </div>
            </div>

            <div class="producer-info">
                Produtor: ${
                    prod.produtor_id
                        ? `<a class="link-produtor" href="/produtor/${Number(prod.produtor_id)}" title="Ver perfil e avaliações do produtor">${window.Avaliacoes.escaparHTML(prod.produtor_nome || 'Produtor Local')}</a>`
                        : (prod.produtor_nome || 'Produtor Local')
                }
            </div>

            <div class="rating">
                ${window.Avaliacoes.resumo(
                    prod.produtor_avaliacao,
                    prod.produtor_total_avaliacoes
                )}
            </div>

            <div class="location">
                ${prod.produtor_cidade || 'Região'}, ${prod.produtor_estado || 'UF'}
            </div>

            <button class="btn-negociar" type="button">
                Fazer pedido
            </button>
        </div>
    `;

    const imagem = card.querySelector('.product-img');

    if (imagem) {
        imagem.addEventListener('error', () => {
            if (imagem.dataset.fallback === 'true') {
                return;
            }

            imagem.dataset.fallback = 'true';
            imagem.src = FOTO_PRODUTO_GENERICA;
        });
    }

    const btnNegociar = card.querySelector('.btn-negociar');

    if (btnNegociar) {
        btnNegociar.addEventListener('click', () => {
            abrirModal(prod);
        });
    }

    return card;
}

// ============================================================
// RENDERIZAR LISTA DE PRODUTOS
// ============================================================

export async function renderizarProdutos(listaExterna = null) {
    try {
        if (!cacheProdutos && listaExterna === null) {
            renderizarCarregando();
            cacheProdutos = await API.listarProdutos();
        }

        const lista = listaExterna !== null
            ? listaExterna
            : cacheProdutos;

        if (!Array.isArray(lista)) {
            atualizarContador(0);
            renderizarErro();
            return;
        }

        atualizarContador(lista.length);

        if (lista.length === 0) {
            ocultarPaginacao();

            if (listaExterna !== null) {
                renderizarSemResultados();
            } else {
                renderizarSemProdutos();
            }

            return;
        }

        const paginacaoAtual = inicializarPaginacao();

        if (!paginacaoAtual) {
            // Fallback caso não seja possível criar o container.
            limparGrid();

            lista.forEach(produto => {
                DOM.grid.appendChild(criarCard(produto));
            });

            atualizarIcones();
            return;
        }

        // Atualiza a lista e retorna à primeira página.
        paginacaoAtual.atualizar(lista);

        if (containerPaginacao) {
            containerPaginacao.hidden = false;
        }

    } catch (erro) {
        console.error('Erro ao renderizar produtos:', erro);
        atualizarContador(0);
        renderizarErro();
    }
}

// ============================================================
// LOCALIZAR PRODUTO E NAVEGAR ATÉ SUA PÁGINA
// ============================================================

export async function destacarProdutoPorId(id) {
    try {
        // Garante que a lista completa esteja carregada.
        if (!Array.isArray(cacheProdutos)) {
            cacheProdutos = await API.listarProdutos();
        }

        if (!Array.isArray(cacheProdutos)) {
            return false;
        }

        // Localiza o produto na lista completa, não apenas
        // nos cards que estão visíveis na página atual.
        const indiceProduto = cacheProdutos.findIndex(
            produto => String(produto.id) === String(id)
        );

        if (indiceProduto === -1) {
            return false;
        }

        // Calcula em qual página o produto está.
        const paginaDestino =
            Math.floor(indiceProduto / ITENS_POR_PAGINA) + 1;

        const paginacaoAtual = inicializarPaginacao();

        if (!paginacaoAtual) {
            return false;
        }

        // Garante que a paginação esteja usando a lista completa.
        paginacaoAtual.atualizar(cacheProdutos);

        // Vai para a página do produto, se necessário.
        if (paginaDestino > 1) {
            paginacaoAtual.irParaPagina(paginaDestino);
        }

        if (containerPaginacao) {
            containerPaginacao.hidden = false;
        }

        // Aguarda a atualização do HTML dos cards.
        await new Promise(resolve => requestAnimationFrame(resolve));

        const card = Array.from(
            DOM.grid.querySelectorAll('.product-card')
        ).find(
            elemento => String(elemento.dataset.produtoId) === String(id)
        );

        if (!card) {
            return false;
        }

        card.classList.add('produto-destacado');

        card.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        setTimeout(() => {
            card.classList.remove('produto-destacado');
        }, 4000);

        return true;

    } catch (erro) {
        console.error('Erro ao localizar produto:', erro);
        return false;
    }
}