/**
 * ARQUIVO: renderizar.js
 * OBJETIVO:
 * - Renderizar os produtos do produtor na tela de forma otimizada.
 * - Implementa busca com debounce para evitar sobrecarga de requisições.
 */

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
    return dicionarioTraducao[valor.toLowerCase()] || valor.charAt(0).toUpperCase() + valor.slice(1);
}

// ==========================================
// CARDS DE ESTADO
// ==========================================

function renderizarSemProdutos(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="package-open"></i>
            <h2>Nenhum produto cadastrado</h2>
            <p>
                Você ainda não possui produtos cadastrados.
                Cadastre um produto para começar a disponibilizá-lo no marketplace.
            </p>
        </div>
    `;
    atualizarIcones();
}

function renderizarSemResultados(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="search-x"></i>
            <h2>Nenhum produto encontrado</h2>
            <p>
                Não encontramos nenhum produto para a sua busca.
                Tente pesquisar utilizando outro nome.
            </p>
        </div>
    `;
    atualizarIcones();
}

function renderizarErro(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="triangle-alert"></i>
            <h2>Não foi possível carregar os produtos</h2>
            <p>
                Ocorreu um problema ao carregar seus produtos.
                Tente novamente em alguns instantes.
            </p>
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
// BUSCA DADOS E RENDERIZAÇÃO
// ==========================================

async function renderProdutos(listaParaRenderizar) {
    // =========================
    // BUSCA DADOS (API ou lista filtrada)
    // =========================
    const lista = listaParaRenderizar || await API.meusProdutos();
    const container = document.getElementById("produtosContainer");

    console.log("Produtos recebidos:", lista);

    if (!container) {
        console.warn("Container 'produtosContainer' não encontrado no DOM");
        return;
    }

    if (!Array.isArray(lista)) {
        console.error("API retornou algo que não é array:", lista);
        renderizarErro(container);
        return;
    }

    // =========================
    // VERIFICA PRODUTOS
    // =========================
    if (lista.length === 0) {
        if (listaParaRenderizar) {
            renderizarSemResultados(container);
        } else {
            renderizarSemProdutos(container);
        }
        return;
    }

    // =========================
    // FUNÇÃO PARA NORMALIZAR FOTO
    // =========================
    function resolverCaminhoFoto(produto) {
        console.log("🖼️ Foto original:", produto.foto);

        if (!produto.foto) {
            console.warn("Produto sem foto, usando fallback");
            return `${API_URL}/static/uploads/produtos/foto_generica.png`;
        }

        // =========================
        // CASO JÁ VENHA COMPLETA
        // =========================
        if (produto.foto.startsWith("http")) {
            console.log("Foto já é URL completa");
            return produto.foto;
        }

        // =========================
        // CASO VENHA COM /static
        // =========================
        if (produto.foto.startsWith("/static")) {
            const url = `${API_URL}${produto.foto}`;
            console.log("🔧 Foto corrigida (static):", url);
            return url;
        }

        // =========================
        // CASO VENHA SÓ NOME DO ARQUIVO
        // =========================
        const url = `${API_URL}/static/uploads/produtos/${produto.foto}`;
        console.log("🔧 Foto montada:", url);
        return url;
    }

    // =========================
    // MONTAGEM HTML
    // =========================
    const htmlCards = lista.map(produto => {
        const produtoJSON = JSON.stringify(produto).replace(/'/g, "&apos;");
        const caminhoFoto = resolverCaminhoFoto(produto);
        const precoFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(produto.preco || 0);

        return `
            <div class="produtor-card">
                <!-- =========================
                     STATUS
                     ========================= -->
                <div class="status ${produto.status || ''}">
                    <img src="/static/assets/${produto.status}.png" class="status-icon">
                    <span>${produto.status || 'indefinido'}</span>
                </div>

                <!-- =========================
                     IMAGEM
                     ========================= -->
                <div class="card-image-container">
                    <img
                        src="${caminhoFoto}"
                        alt="${produto.nome}"
                        loading="lazy"
                        onerror="console.error('Erro ao carregar imagem:', this.src); this.src='${API_URL}/static/uploads/produtos/foto_generica.png';"
                    >
                </div>

                <!-- =========================
                     INFORMAÇÕES
                     ========================= -->
                <div class="produtor-info">
                    <h2>${produto.nome}</h2>

                    <span class="categoria ${produto.categoria || 'geral'}">
                        ${formatarLabel(produto.categoria)}
                    </span>

                    <p class="descricao">
                        ${produto.descricao || 'Sem descrição disponível.'}
                    </p>

                    <strong class="preco">
                        ${precoFormatado}/${formatarLabel(produto.unidade)}
                    </strong>

                    <p class="quantidade">
                        Disponível: ${produto.quantidade || 0} ${formatarLabel(produto.unidade)}(s)
                    </p>

                    <!-- =========================
                         BOTÕES
                         ========================= -->
                    <div class="botoes-card">
                        <button class="editar-card-btn" onclick='prepararEdicao(${produtoJSON})'>
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
    }).join('');

    // =========================
    // INSERE CARDS NO DOM
    // =========================
    container.innerHTML = htmlCards;
    console.log("Renderização concluída");

    // =========================
    // ATUALIZA ÍCONES
    // =========================
    atualizarIcones();
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
            const termoBusca = e.target.value.toLowerCase().trim();
            console.log("🔍 Buscando por:", termoBusca);

            const todosProdutos = await API.meusProdutos();
            const filtrados = todosProdutos.filter(p =>
                (p.nome && p.nome.toLowerCase().includes(termoBusca))
            );

            console.log("Produtos filtrados:", filtrados);
            renderProdutos(filtrados);
        }, 300);
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM carregado, iniciando renderização...");
    renderProdutos();
});