/**
 * ARQUIVO: renderizar.js
 * OBJETIVO:
 * - Renderizar os produtos do produtor na tela de forma otimizada.
 * - Implementa busca com debounce para evitar sobrecarga de requisições.
 */

async function renderProdutos(listaParaRenderizar) {

    // =========================
    // BUSCA DADOS
    // =========================
    const lista =
        listaParaRenderizar ||
        await API.meusProdutos();

    const container =
        document.getElementById(
            "produtosContainer"
        );

    console.log(
        "📦 Produtos recebidos:",
        lista
    );

    // =========================
    // VALIDA CONTAINER
    // =========================
    if (!container) {

        console.warn(
            "⚠️ Container 'produtosContainer' não encontrado"
        );

        return;
    }

    // =========================
    // VALIDA ARRAY
    // =========================
    if (!Array.isArray(lista)) {

        console.error(
            "❌ API retornou algo inválido:",
            lista
        );

        container.innerHTML = `
            <p class="sem-resultados">
                Erro ao carregar produtos
            </p>
        `;

        return;
    }

    // =========================
    // DICIONÁRIO
    // =========================
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

    // =========================
    // FORMATAR LABEL
    // =========================
    function formatarLabel(valor) {

        if (!valor) {
            return "Não informado";
        }

        return (
            dicionarioTraducao[
                valor.toLowerCase()
            ] ||

            valor.charAt(0).toUpperCase() +
            valor.slice(1)
        );
    }

    // =========================
    // NORMALIZA FOTO
    // =========================
    function resolverCaminhoFoto(produto) {

        console.log(
            "🖼️ Foto original:",
            produto.foto
        );

        // sem foto
        if (!produto.foto) {

            console.warn(
                "⚠️ Produto sem foto"
            );

            return `
                ${API_URL}/static/uploads/produtos/foto_generica.png
            `;
        }

        // url completa
        if (
            produto.foto.startsWith("http")
        ) {

            console.log(
                "✅ URL completa"
            );

            return produto.foto;
        }

        // já possui /static
        if (
            produto.foto.startsWith("/static")
        ) {

            const url =
                `${API_URL}${produto.foto}`;

            console.log(
                "🔧 URL corrigida:",
                url
            );

            return url;
        }

        // blob storage
        if (
            produto.foto.includes(
                "blob.core.windows.net"
            )
        ) {

            console.log(
                "☁️ Imagem Blob Storage"
            );

            return produto.foto;
        }

        // fallback local
        const url =
            `${API_URL}/static/uploads/produtos/${produto.foto}`;

        console.log(
            "🔧 URL montada:",
            url
        );

        return url;
    }

    // =========================
    // MONTAGEM HTML
    // =========================
    const htmlCards = lista.map(produto => {

        const produtoJSON =
            JSON.stringify(produto)
                .replace(/'/g, "&apos;");

        const caminhoFoto =
            resolverCaminhoFoto(produto);

        const precoFormatado =
            new Intl.NumberFormat(
                'pt-BR',
                {
                    style: 'currency',
                    currency: 'BRL'
                }
            ).format(
                produto.preco || 0
            );

        return `
            <div class="produtor-card">

                <!-- STATUS -->
                <div class="status ${produto.status || ''}">

                    <img
                        src="/static/assets/${produto.status}.png"
                        class="status-icon"
                    >

                    <span>
                        ${produto.status || 'indefinido'}
                    </span>

                </div>

                <!-- IMAGEM -->
                <div class="card-image-container">

                    <img
                        src="${caminhoFoto}"
                        alt="${produto.nome}"
                        loading="lazy"

                        onerror="
                            console.error(
                                '❌ Erro ao carregar imagem:',
                                this.src
                            );

                            this.src='${API_URL}/static/uploads/produtos/foto_generica.png';
                        "
                    >

                </div>

                <!-- INFORMAÇÕES -->
                <div class="produtor-info">

                    <h2>
                        ${produto.nome}
                    </h2>

                    <span class="
                        categoria
                        ${produto.categoria || 'geral'}
                    ">

                        ${formatarLabel(
                            produto.categoria
                        )}

                    </span>

                    <p class="descricao">

                        ${
                            produto.descricao ||
                            'Sem descrição disponível.'
                        }

                    </p>

                    <strong class="preco">

                        ${precoFormatado}
                        /
                        ${formatarLabel(
                            produto.unidade
                        )}

                    </strong>

                    <p class="quantidade">

                        Disponível:
                        ${produto.quantidade || 0}

                        ${formatarLabel(
                            produto.unidade
                        )}(s)

                    </p>

                    <!-- BOTÕES -->
                    <div class="botoes-card">

                        <button
                            class="editar-card-btn"

                            onclick='prepararEdicao(
                                ${produtoJSON}
                            )'
                        >

                            <i data-lucide="square-pen"></i>

                            <span>
                                Editar
                            </span>

                        </button>

                        <button
                            class="excluir-card-btn"

                            title="Excluir Produto"

                            onclick="
                                prepararExclusao(
                                    ${produto.id},
                                    '${produto.nome}'
                                )
                            "
                        >
                        </button>

                    </div>

                </div>

            </div>
        `;
    }).join('');

    // =========================
    // RENDERIZA HTML
    // =========================
    container.innerHTML =
        htmlCards ||

        `
            <p class="sem-resultados">
                Nenhum produto encontrado.
            </p>
        `;

    console.log(
        "✅ Renderização concluída"
    );

    // =========================
    // LUCIDE ICONS
    // =========================
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==========================================
// FILTRO BUSCA + DEBOUNCE
// ==========================================
let debounceTimer;

const searchInput =
    document.getElementById(
        "searchInput"
    );

if (searchInput) {

    searchInput.addEventListener(
        "input",
        (e) => {

            clearTimeout(
                debounceTimer
            );

            debounceTimer =
                setTimeout(
                    async () => {

                        const termoBusca =
                            e.target.value
                                .toLowerCase()
                                .trim();

                        console.log(
                            "🔍 Buscando:",
                            termoBusca
                        );

                        const todosProdutos =
                            await API.meusProdutos();

                        const filtrados =
                            todosProdutos.filter(
                                p =>
                                    (
                                        p.nome &&
                                        p.nome
                                            .toLowerCase()
                                            .includes(
                                                termoBusca
                                            )
                                    )
                            );

                        console.log(
                            "📊 Filtrados:",
                            filtrados
                        );

                        renderProdutos(
                            filtrados
                        );

                    },
                    300
                );
        }
    );
}

// ===============================
// INICIALIZAÇÃO
// ===============================
document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🚀 DOM carregado"
        );

        renderProdutos();
    }
);
