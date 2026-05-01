// ===============================
// 4. RENDERIZAÇÃO (UI)
// ===============================

import { DOM } from './acesso_a_elementos_DOM.js';
import { formatarPreco, renderizarEstrelas } from './estrelas_formatacao_preco.js';
import { abrirModal } from './modal.js';
import { API } from './api.js';

// 🔹 cache único compartilhado
let cacheProdutos = null;

const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";


// ===============================
// TRADUÇÃO
// ===============================
const dicionarioTraducao = {
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

    return dicionarioTraducao[valor.toLowerCase()] ||
        valor.charAt(0).toUpperCase() + valor.slice(1);
}

// ===============================
// RESOLVE CAMINHO DA IMAGEM
// ===============================
function resolverCaminhoFoto(produto) {
    console.log("🖼️ Foto original:", produto.foto);

    if (!produto.foto) {
        console.warn("⚠️ Produto sem foto, usando fallback");
        return "/static/uploads/produtos/foto_generica.png";
    }

    // Caso venha só nome do arquivo
    const url = `${API_URL}/static/${produto.foto}`;
    console.log("🔧 Caminho montado:", url);
    return url;
}

// ===============================
// LIMPA GRID
// ===============================
function limparGrid() {
    DOM.grid.innerHTML = '';
}

// ===============================
// ATUALIZA CONTADOR
// ===============================
function atualizarContador(qtd) {
    DOM.resultsCount.textContent = `${qtd} Produtos encontrados`;
}

// ===============================
// CRIA CARD
// ===============================
export function criarCard(prod) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const urlImagem = resolverCaminhoFoto(prod);

    card.innerHTML = `
        <img 
            src="${urlImagem}" 
            alt="${prod.nome}" 
            loading="lazy" 
            class="product-img"
            onerror="console.error('❌ Erro ao carregar imagem:', this.src); this.src='/static/uploads/produtos/foto_generica.png';"
        >
        
        <div class="product-info">
            <h3 class="product-title">${prod.nome}</h3>
            <span class="product-tag ${prod.categoria || 'geral'}">${formatarLabel(prod.categoria) || 'Sem categoria'}</span>
            <p class="product-desc">${prod.descricao || 'Sem descrição.'}</p>
            
            <div class="price-row">
                <div class="price">
                    <strong>R$ ${formatarPreco(prod.preco)}</strong> 
                    <span>/${formatarLabel(prod.unidade)}</span>
                </div>
                <div class="stock">Total: ${prod.quantidade} ${formatarLabel(prod.unidade)}(s)</div>
            </div>
            
            <div class="producer-info">Produtor: ${prod.produtor_nome || 'Produtor Local'}</div>
            
            <div class="rating">
                ${renderizarEstrelas(prod.produtor_avaliacao || 5)}
                <span>(${prod.produtor_avaliacao ? prod.produtor_avaliacao.toFixed(1) : '5.0'})</span>
            </div>
            
            <div class="location">
                ${prod.produtor_cidade || 'Região'}, ${prod.produtor_estado || 'UF'}
            </div>
            
            <button class="btn-negociar">Negociar</button>
        </div>
    `;

    card.querySelector('.btn-negociar')
        .addEventListener('click', () => abrirModal(prod));

    return card;
}

// ===============================
// RENDERIZA PRODUTOS
// ===============================
export async function renderizarProdutos(listaExterna = null) {
    limparGrid();

    try {
        if (!cacheProdutos) {
            console.log("🔄 Buscando API...");
            cacheProdutos = await API.listarProdutos();
        } else {
            console.log("⚡ Usando cache render");
        }

        const lista = listaExterna || cacheProdutos;

        console.log("📦 Renderizando:", lista);

        atualizarContador(lista.length);

        if (!lista.length) {
            DOM.grid.innerHTML = '<p class="aviso">Nenhum produto encontrado.</p>';
            return;
        }

        lista.forEach(p => {
            DOM.grid.appendChild(criarCard(p));
        });

    } catch (e) {
        console.error("❌ Erro render:", e);
    }
}