import { showDetails } from "./navegacao.js";
import { deleteOrder } from "./filtros_botao_excluir.js";
import { API } from './api.js';

let cacheNegociacoes = null;

export const getCacheNegociacoes = () => cacheNegociacoes;

function limparGrid() {
    const grid = document.getElementById('orders-grid');
    if (grid) grid.innerHTML = '';
}



export function criarCardNegociacao(order, tipo_de_usuario) {
    const statusClass = order.status ? order.status.toLowerCase() : 'pendente';
    const card = document.createElement('div');
    card.className = 'card';

    // 👇 NOVA LÓGICA REFINADA DO BOTÃO SECUNDÁRIO 👇
    let botaoSecundario = '';
    let acaoSecundaria = null; 
    let novoStatus = '';

    if (statusClass === 'pendente') {
        if (tipo_de_usuario === 'produtor') {
            // Produtor recusa proposta pendente
            botaoSecundario = `<button class="btn-acao-secundaria" style="background-color: var(--status-red); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 600;">Recusar</button>`;
            novoStatus = 'Recusado';
            acaoSecundaria = 'recusar';
        } else {
            // Estabelecimento cancela proposta pendente
            botaoSecundario = `<button class="btn-acao-secundaria" style="background-color: var(--status-red); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 600;">Cancelar</button>`;
            novoStatus = 'Cancelado';
            acaoSecundaria = 'cancelar';
        }
    } else if (statusClass === 'aceito') {
        // Se foi APENAS aceito, ainda pode cancelar
        botaoSecundario = `<button class="btn-acao-secundaria" style="background-color: var(--status-red); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 600;">Cancelar</button>`;
        novoStatus = 'Cancelado';
        acaoSecundaria = 'cancelar';
    } else if (statusClass === 'recusado' || statusClass === 'cancelado' || statusClass === 'finalizado') {
        // CICLO MORTO: Mostra a lixeira apenas para limpar a tela
        botaoSecundario = `<button class="btn-delete" title="Excluir histórico">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>`;
    } 
    // OBS: Se o status for 'entregue', a variável 'botaoSecundario' continua vazia (''). Nenhuma ação de exclusão ou cancelamento é mostrada!

    card.innerHTML = `
    <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
            <div style="font-weight: 700; font-size: 1.1rem; color: #333;">
                ${order.negociante_nome}
            </div>
            <div style="display: flex; align-items: center; gap: 5px; margin-top: 5px; font-weight: 600; color: #555;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.19v6.72zm14 0v-6.72l-6 3.39v6.71l6-3.38z"/></svg>
                ${order.produto_nome}
            </div>
        </div>
        <span class="badge ${statusClass}">
            ${order.status}
        </span>
    </div>

    <div class="card-body">
        <div class="price-row">
            <div class="qty">
                <span style="display: block; font-size: 12px; margin-bottom: 4px;">Quantidade</span>
                <span style="font-size: 16px; font-weight: 600; color: #333;">${order.quantidade} <span style="font-size: 14px; font-weight: 400;">${order.produto_unidade}</span></span>
            </div>
            <div class="price">
                <span style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-muted);">Preço</span>
                R$ ${order.produto_preco}<small style="font-weight: 400; font-size: 14px; color: var(--text-muted);">/${order.produto_unidade}</small>
            </div>
        </div>

        <div style="margin-bottom: 16px;">
            <span style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Proposta/Descrição do Pedido</span>
            <p class="desc">${order.descricao || 'Sem descrição'}</p>
        </div>

        <div>
            <div class="info-row">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>
                <span>Entrega: ${order.data_entrega || 'A combinar'}</span>
            </div>
            <div class="info-row">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                <span>${order.negociante_cidade}, ${order.negociante_estado}</span>
            </div>
        </div>
    </div>

    <div class="card-actions">
        <button class="btn-details">
            Detalhes
        </button>
        ${botaoSecundario}
    </div>
    `;

    // Atribuição de cliques
    card.querySelector('.btn-details').onclick = () => showDetails(order.id, tipo_de_usuario);
    
    // Vincula a ação dependendo de qual botão foi renderizado
    if (acaoSecundaria) {
        card.querySelector('.btn-acao-secundaria').onclick = async () => {
            if(confirm(`Deseja realmente ${acaoSecundaria} este pedido?`)) {
                try {
                    await API.atualizarStatus(order.id, novoStatus);
                    alert(`Pedido ${novoStatus.toLowerCase()}!`);
                    location.reload(); 
                } catch(e) {
                    alert("Erro ao tentar atualizar o status do pedido.");
                }
            }
        };
    } else if (statusClass === 'recusado' || statusClass === 'cancelado' || statusClass === 'finalizado') {
        // Se o status for um dos finais, atrela o clique à lixeira
        card.querySelector('.btn-delete').onclick = () => deleteOrder(order.id);
    }

    return card;
}

export async function renderOrders(listaExterna = null, tipoUsuarioParam = null) {
    const grid = document.getElementById('orders-grid');
    if (!grid) return;

    limparGrid();
    
    const tipo_de_usuario = tipoUsuarioParam || (window.location.href.includes('estabelecimento') ? 'estabelecimento' : 'produtor');

    try {
        if (!cacheNegociacoes && !listaExterna) {
            cacheNegociacoes = await API.listarNegociacoes(tipo_de_usuario);
        }

        let lista = listaExterna || cacheNegociacoes || [];

        if (lista.length === 0) {
            grid.innerHTML = '<p class="aviso">Nenhuma negociação encontrada.</p>';
            return;
        }

        // --- LÓGICA DE AGRUPAMENTO/ORDENAÇÃO ---
        const ordemPrioridade = {
            'pendente': 1,
            'aceito': 2,
            'entregue': 3,
            'finalizado': 4,
            'cancelado': 5,
            'recusado': 6
        };

        const listaOrdenada = [...lista].sort((a, b) => {
            const statusA = (a.status || "").toLowerCase();
            const statusB = (b.status || "").toLowerCase();
            
            // Atribui um peso alto (99) se o status não estiver no mapeamento por segurança
            const pesoA = ordemPrioridade[statusA] || 99;
            const pesoB = ordemPrioridade[statusB] || 99;

            return pesoA - pesoB;
        });
        // --------------------------------------

        listaOrdenada.forEach(order => grid.appendChild(criarCardNegociacao(order, tipo_de_usuario)));
    } catch (error) {
        grid.innerHTML = '<p class="erro">Erro ao carregar dados.</p>';
    }
}