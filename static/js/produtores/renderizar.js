/**
 * ARQUIVO: renderizar.js
 * OBJETIVO:
 * - Renderizar os produtos do produtor na tela de forma otimizada.
 * - Utilizar URLs SAS do Azure Blob Storage quando disponíveis.
 * - Utilizar imagem genérica quando o produto não possuir foto
 *   ou quando a imagem não puder ser carregada.
 */

// ==========================================
// CHECAGEM DE DEBUG INICIAL
// ==========================================
console.log("=== [DEBUG] INICIALIZANDO RENDERIZAR.JS ===");

if (typeof API_URL === "undefined" || !API_URL) {
    console.error("❌ [DEBUG CRÍTICO]: A variável global 'API_URL' NÃO está definida no escopo global!");
} else {
    console.log("✅ [DEBUG]: API_URL detectada:", API_URL);
}

// ==========================================
// CONSTANTES DE FALLBACK
// ==========================================
const FOTO_GENERICA = "../static/assets/produto_generico.png";
console.log("🖼️ [DEBUG]: Caminho da FOTO_GENERICA:", FOTO_GENERICA);

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
    console.log(`\n🔍 [DEBUG FOTO] Produto ID ${produto?.id} (${produto?.nome}):`);
    console.log(` - Atributo produto.foto original:`, produto?.foto);

    if (!produto || !produto.foto) {
        console.warn(` - ⚠️ Sem foto no produto. Usando FOTO_GENERICA:`, FOTO_GENERICA);
        return FOTO_GENERICA;
    }

    let foto = String(produto.foto).trim();

    if (foto.startsWith("http://") || foto.startsWith("https://")) {
        console.log(` - ✅ URL do Azure/SAS identificada:`, foto);
        return foto;
    }

    foto = foto.replace(/^\/+/, "");
    foto = foto.replace(/^static\//, "");
    foto = foto.replace(/^uploads\/produtos\//, "");

    if (foto === "foto_generica.png" || foto === "produto_generico.png") {
        console.log(" - ℹ️ Foto genérica identificada. Usando fallback.");
        return FOTO_GENERICA;
    }

    const baseApi = (typeof API_URL !== "undefined" ? API_URL : "").replace(/\/$/, "");
    const urlAntiga = `${baseApi}/static/uploads/produtos/${foto}`;
    console.log(` - ⚠️ Foto antiga/local identificada:`, urlAntiga);

    return urlAntiga;
}

// ==========================================
// CONFIGURAR FALLBACK DA IMAGEM
// ==========================================
function configurarFallbackImagem(imagem) {
    if (!imagem) return;

    imagem.addEventListener("error", () => {
        console.warn("⚠️ [DEBUG FOTO] Falha ao carregar:", imagem.src);
        if (imagem.dataset.fallback === "true") return;

        imagem.dataset.fallback = "true";
        console.log("🔄 [DEBUG FOTO] Aplicando imagem genérica:", FOTO_GENERICA);
        imagem.src = FOTO_GENERICA;
    });
}

// ==========================================
// BUSCA DADOS E RENDERIZAÇÃO
// ==========================================
async function renderProdutos(listaParaRenderizar) {
    console.log("\n--- [DEBUG] INICIANDO RENDERPRODUTOS ---");
    let lista;

    try {
        lista = listaParaRenderizar || await API.meusProdutos();
        console.log("📦 [DEBUG] Produtos recebidos da API/Filtro:", lista);
    } catch (err) {
        console.error("❌ [DEBUG] Erro ao chamar API.meusProdutos():", err);
        const containerErro = document.getElementById("produtosContainer");
        if (containerErro) renderizarErro(containerErro);
        return;
    }

    const container = document.getElementById("produtosContainer");
    if (!container) {
        console.warn("⚠️ [DEBUG]: Container 'produtosContainer' não encontrado no DOM");
        return;
    }

    if (!Array.isArray(lista)) {
        console.error("❌ [DEBUG]: API retornou dados inválidos (não é um Array):", lista);
        renderizarErro(container);
        return;
    }

    if (lista.length === 0) {
        console.log("ℹ️ [DEBUG]: Nenhum produto retornado na lista.");
        if (listaParaRenderizar) {
            renderizarSemResultados(container);
        } else {
            renderizarSemProdutos(container);
        }
        return;
    }

    const htmlCards = lista.map(produto => {
        const produtoJSON = JSON.stringify(produto).replace(/'/g, "&apos;");
        const caminhoFoto = resolverCaminhoFoto(produto);
        const precoFormatado = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(produto.preco || 0);

        return `
            <div class="produtor-card">
                <div class="status ${produto.status || ''}">
                    <span>${produto.status || 'indefinido'}</span>
                </div>
                <div class="card-image-container">
                    <img src="${caminhoFoto}" alt="${produto.nome}" loading="lazy" class="produto-foto">
                </div>
                <div class="produtor-info">
                    <h2>${produto.nome}</h2>
                    <span class="categoria ${produto.categoria || 'geral'}">${formatarLabel(produto.categoria)}</span>
                    <p class="descricao">${produto.descricao || 'Sem descrição disponível.'}</p>
                    <strong class="preco">${precoFormatado}/${formatarLabel(produto.unidade)}</strong>
                    <p class="quantidade">Disponível: ${produto.quantidade || 0} ${formatarLabel(produto.unidade)}(s)</p>
                    <div class="botoes-card">
                        <button class="editar-card-btn" onclick='prepararEdicao(${produtoJSON})'>
                            <i data-lucide="square-pen"></i>
                            <span>Editar</span>
                        </button>
                        <button class="excluir-card-btn" title="Excluir Produto" onclick="window.prepararExclusao(${produto.id}, '${produto.nome}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = htmlCards;
    console.log("\n✅ [DEBUG]: Renderização no DOM concluída!");

    const imagens = container.querySelectorAll(".produto-foto");
    imagens.forEach(imagem => configurarFallbackImagem(imagem));

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
            console.log("🔍 [DEBUG BUSCA] Buscando por:", termoBusca);

            try {
                const todosProdutos = await API.meusProdutos();
                const filtrados = todosProdutos.filter(p => (
                    p.nome && p.nome.toLowerCase().includes(termoBusca)
                ));
                console.log("🔍 [DEBUG BUSCA] Produtos filtrados:", filtrados);
                renderProdutos(filtrados);
            } catch (err) {
                console.error("❌ [DEBUG BUSCA] Erro ao filtrar produtos:", err);
            }
        }, 300);
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 [DEBUG]: DOM carregado, disparando renderProdutos()...");
    renderProdutos();
});