import { DOM } from './acesso_a_elementos_DOM.js';
import { formatarPreco, renderizarEstrelas } from './estrelas_formatacao_preco.js';
import { abrirModal } from './modal.js';
import { API } from './api.js';

// ============================================================
// CONFIGURAÇÃO E CACHE
// ============================================================

let cacheProdutos = null;
const API_URL = CONFIG.API_URL;

const FOTO_PRODUTO_GENERICA =
    "../static/assets/produto_generico.png";


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
        String(valor).charAt(0).toUpperCase()
        + String(valor).slice(1)
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

    console.log(
        "🖼️ Foto original:",
        produto.foto
    );

    // --------------------------------------------------------
    // Sem foto
    // --------------------------------------------------------

    if (!produto.foto) {

        console.warn(
            "⚠️ Produto sem foto, usando fallback"
        );

        return FOTO_PRODUTO_GENERICA;
    }


    const foto =
        String(produto.foto)
            .trim();


    // --------------------------------------------------------
    // URL SAS DO AZURE
    // --------------------------------------------------------
    //
    // O backend agora retorna diretamente algo como:
    //
    // https://agrolinkimagens.blob.core.windows.net/
    // produtos/arquivo.png?...SAS...
    //
    // Nesse caso, usamos diretamente a URL.
    // --------------------------------------------------------

    if (
        foto.startsWith("http://")
        || foto.startsWith("https://")
    ) {

        return foto;
    }


    // --------------------------------------------------------
    // Compatibilidade com caminhos antigos
    // --------------------------------------------------------

    const caminhoNormalizado =
        foto.replace(/^\/+/, "");


    if (
        caminhoNormalizado.startsWith("static/")
    ) {

        return `${API_URL}/${caminhoNormalizado}`;
    }


    // Caso antigo esteja salvo como:
    // uploads/produtos/arquivo.png

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

        DOM.resultsCount.textContent =
            `${qtd} Produtos encontrados`;
    }
}


function atualizarIcones() {

    if (window.lucide) {

        try {

            window.lucide.createIcons();

        } catch (erro) {

            console.error(
                "❌ Erro ao criar ícones:",
                erro
            );
        }
    }
}


// ============================================================
// ESTADOS DA UI
// ============================================================

function renderizarSemProdutos() {

    DOM.grid.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="package-search"></i>

            <h2>Nenhum produto cadastrado</h2>

            <p>
                Os produtores ainda não cadastraram produtos para venda.
                Tente novamente mais tarde.
            </p>
        </div>
    `;

    atualizarIcones();
}


function renderizarSemResultados() {

    DOM.grid.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="search-x"></i>

            <h2>Nenhum resultado encontrado</h2>

            <p>
                Não encontramos nenhum produto com os filtros ou termos utilizados.
                Tente realizar uma nova busca.
            </p>
        </div>
    `;

    atualizarIcones();
}


function renderizarErro() {

    DOM.grid.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="triangle-alert"></i>

            <h2>Erro ao carregar produtos</h2>

            <p>
                Não foi possível carregar os produtos neste momento.
                Tente novamente em alguns instantes.
            </p>
        </div>
    `;

    atualizarIcones();
}


// ============================================================
// CRIAR CARD DE PRODUTO
// ============================================================

export function criarCard(prod) {

    const card =
        document.createElement('div');

    card.className =
        'product-card';


    // ========================================================
    // FOTO
    // ========================================================

    const urlImagem =
        resolverCaminhoFoto(prod);


    const categoria =
        normalizarCategoria(prod.categoria);


    const categoriaLabel =
        formatarLabel(categoria);


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

                    Total:
                    ${prod.quantidade}
                    ${formatarLabel(prod.unidade)}(s)

                </div>

            </div>


            <div class="producer-info">

                Produtor:
                ${prod.produtor_nome || 'Produtor Local'}

            </div>


            <div class="rating">

                ${renderizarEstrelas(
                    prod.produtor_avaliacao || 5
                )}

                <span>
                    (
                    ${
                        prod.produtor_avaliacao
                            ? Number(
                                prod.produtor_avaliacao
                            ).toFixed(1)
                            : '5.0'
                    }
                    )
                </span>

            </div>


            <div class="location">

                ${prod.produtor_cidade || 'Região'},
                ${prod.produtor_estado || 'UF'}

            </div>


            <button
                class="btn-negociar"
                type="button"
            >
                Negociar
            </button>

        </div>
    `;


    // ========================================================
    // FALLBACK DA FOTO
    // ========================================================

    const imagem =
        card.querySelector('.product-img');


    if (imagem) {

        imagem.addEventListener(
            'error',
            () => {

                console.warn(
                    "⚠️ Não foi possível carregar a foto do produto:",
                    imagem.src
                );


                // Evita loop caso a própria imagem
                // genérica tenha algum problema.
                if (
                    imagem.dataset.fallback === 'true'
                ) {

                    return;
                }


                imagem.dataset.fallback =
                    'true';


                imagem.src =
                    FOTO_PRODUTO_GENERICA;
            }
        );
    }


    // ========================================================
    // BOTÃO NEGOCIAR
    // ========================================================

    const btnNegociar =
        card.querySelector('.btn-negociar');


    if (btnNegociar) {

        btnNegociar.addEventListener(
            'click',
            () => {
                abrirModal(prod);
            }
        );
    }


    return card;
}


// ============================================================
// RENDERIZAR LISTA DE PRODUTOS
// ============================================================

export async function renderizarProdutos(
    listaExterna = null
) {

    limparGrid();


    try {

        // ====================================================
        // BUSCAR PRODUTOS
        // ====================================================

        if (
            !cacheProdutos
            && listaExterna === null
        ) {

            console.log(
                "🔄 Buscando API..."
            );


            cacheProdutos =
                await API.listarProdutos();


            console.log(
                "📦 Produtos recebidos da API:",
                cacheProdutos
            );

        } else {

            console.log(
                "⚡ Usando cache render"
            );
        }


        // ====================================================
        // DEFINIR LISTA
        // ====================================================

        const lista =
            listaExterna !== null
                ? listaExterna
                : cacheProdutos;


        console.log(
            "📦 Lista final para renderização:",
            lista
        );


        // ====================================================
        // VALIDAR RESPOSTA
        // ====================================================

        if (!Array.isArray(lista)) {

            console.error(
                "❌ API não retornou um array:",
                lista
            );


            atualizarContador(0);

            renderizarErro();

            return;
        }


        atualizarContador(
            lista.length
        );


        // ====================================================
        // NENHUM PRODUTO
        // ====================================================

        if (lista.length === 0) {

            if (listaExterna !== null) {

                console.log(
                    "🔎 Nenhum resultado encontrado"
                );

                renderizarSemResultados();

            } else {

                console.log(
                    "📦 Nenhum produto cadastrado"
                );

                renderizarSemProdutos();
            }

            return;
        }


        // ====================================================
        // RENDERIZAR PRODUTOS
        // ====================================================

        lista.forEach(produto => {

            DOM.grid.appendChild(
                criarCard(produto)
            );
        });


        console.log(
            "✅ Produtos renderizados com sucesso"
        );


        atualizarIcones();


    } catch (e) {

        console.error(
            "❌ Erro render:",
            e
        );


        atualizarContador(0);

        renderizarErro();
    }
}