import { showDetails } from "./navegacao.js";
import { deleteOrder } from "./filtros_botao_excluir.js";
import { API } from './api.js';

let cacheNegociacoes = null;

export const getCacheNegociacoes = () => cacheNegociacoes;

// ==========================================
// LIMPA GRID
// ==========================================

function limparGrid() {
    const grid = document.getElementById('orders-grid');
    if (grid) {
        grid.innerHTML = '';
    }
}

// ==========================================
// CARDS DE ESTADO
// ==========================================

function atualizarIcones() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==========================================
// NENHUM PEDIDO CADASTRADO
// ==========================================

function renderizarSemPedidos(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="inbox"></i>
            <h2>Nenhum pedido cadastrado</h2>
            <p>
                Você ainda não possui pedidos ou negociações
                para visualizar neste momento.
            </p>
        </div>
    `;
    atualizarIcones();
}

// ==========================================
// NENHUM RESULTADO
// ==========================================

function renderizarSemResultados(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="search-x"></i>
            <h2>Nenhum resultado encontrado</h2>
            <p>
                Não encontramos nenhum pedido com os filtros
                selecionados. Tente alterar os filtros para
                encontrar outras negociações.
            </p>
        </div>
    `;
    atualizarIcones();
}

// ==========================================
// ERRO
// ==========================================

function renderizarErro(container) {
    container.innerHTML = `
        <div class="sem-produtos">
            <i data-lucide="triangle-alert"></i>
            <h2>Não foi possível carregar os pedidos</h2>
            <p>
                Ocorreu um problema ao carregar suas negociações.
                Tente novamente em alguns instantes.
            </p>
        </div>
    `;
    atualizarIcones();
}

// ==========================================
// CRIA CARD DE NEGOCIAÇÃO
// ==========================================

export function criarCardNegociacao(order, tipo_de_usuario) {
    const statusClass = order.status ? order.status.toLowerCase() : 'pendente';
    const card = document.createElement('div');
    card.className = 'card';

    let botaoSecundario = '';
    let acaoSecundaria = null;
    let novoStatus = '';

    // ==========================================
    // STATUS PENDENTE
    // ==========================================

    if (statusClass === 'pendente') {
        if (tipo_de_usuario === 'produtor') {
            // Produtor recusa proposta pendente
            botaoSecundario = `
                <button
                    class="btn-acao-secundaria"
                    style="
                        background-color: var(--status-red);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-weight: 600;
                    "
                >
                    Recusar
                </button>
            `;
            novoStatus = 'Recusado';
            acaoSecundaria = 'recusar';
        } else {
            // Estabelecimento cancela proposta pendente
            botaoSecundario = `
                <button
                    class="btn-acao-secundaria"
                    style="
                        background-color: var(--status-red);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-weight: 600;
                    "
                >
                    Cancelar
                </button>
            `;
            novoStatus = 'Cancelado';
            acaoSecundaria = 'cancelar';
        }

    // ==========================================
    // STATUS ACEITO
    // ==========================================

    } else if (statusClass === 'aceito') {
        // Se foi apenas aceito, ainda pode cancelar
        botaoSecundario = `
            <button
                class="btn-acao-secundaria"
                style="
                    background-color: var(--status-red);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: 600;
                "
            >
                Cancelar
            </button>
        `;
        novoStatus = 'Cancelado';
        acaoSecundaria = 'cancelar';

    // ==========================================
    // STATUS FINAIS
    // ==========================================

    } else if (
        statusClass === 'recusado' ||
        statusClass === 'cancelado' ||
        statusClass === 'finalizado'
    ) {
        // CICLO MORTO:
        // Mostra a lixeira apenas para limpar a tela
        botaoSecundario = `
            <button
                class="btn-delete"
                title="Excluir histórico"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="white"
                >
                    <path d="
                        M6 19c0 1.1.9 2 2 2h8
                        c1.1 0 2-.9 2-2V7H6v12z
                        M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z
                    "/>
                </svg>
            </button>
        `;
    }

    // OBS:
    // Se o status for 'entregue', botaoSecundario continua vazio.
    // Nenhuma ação de exclusão ou cancelamento é mostrada.

    // ==========================================
    // HTML DO CARD
    // ==========================================

    card.innerHTML = `
        <div
            class="card-header"
            style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            "
        >
            <div>
                <div
                    style="
                        font-weight: 700;
                        font-size: 1.1rem;
                        color: #333;
                    "
                >
                    ${order.negociante_nome}
                </div>

                <div
                    style="
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        margin-top: 5px;
                        font-weight: 600;
                        color: #555;
                    "
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                    >
                        <path d="
                            M21 16.5c0 .38-.21.71-.53.88l-7.9
                            4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18
                            l-7.9-4.44A.991.991 0 0 1 3 16.5v-9
                            c0-.38.21-.71.53-.88l7.9-4.44
                            c-.16.12-.36.18-.57.18s-.41-.06-.57-.18
                            l-7.9 4.44c-.32.17-.53.5-.53.88v9z
                            M12 4.15L6.04 7.5 12 10.85
                            17.96 7.5 12 4.15z
                            M5 15.91l6 3.38v-6.71L5 9.19v6.72zm14 0
                            v-6.72l-6 3.39v6.71l6-3.38z
                        "/>
                    </svg>
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
                    <span
                        style="
                            display: block;
                            font-size: 12px;
                            margin-bottom: 4px;
                        "
                    >
                        Quantidade
                    </span>

                    <span
                        style="
                            font-size: 16px;
                            font-weight: 600;
                            color: #333;
                        "
                    >
                        ${order.quantidade}
                        <span
                            style="
                                font-size: 14px;
                                font-weight: 400;
                            "
                        >
                            ${order.produto_unidade}
                        </span>
                    </span>
                </div>

                <div class="price">
                    <span
                        style="
                            display: block;
                            font-size: 12px;
                            margin-bottom: 4px;
                            color: var(--text-muted);
                        "
                    >
                        Preço
                    </span>
                    R$ ${order.produto_preco}
                    <small
                        style="
                            font-weight: 400;
                            font-size: 14px;
                            color: var(--text-muted);
                        "
                    >
                        /${order.produto_unidade}
                    </small>
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <span
                    style="
                        font-size: 12px;
                        color: var(--text-muted);
                        display: block;
                        margin-bottom: 4px;
                    "
                >
                    Proposta/Descrição do Pedido
                </span>

                <p class="desc">
                    ${order.descricao || 'Sem descrição'}
                </p>
            </div>

            <div>
                <div class="info-row">
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                    >
                        <path d="
                            M19 4h-1V2h-2v2H8V2H6v2H5
                            c-1.11 0-1.99.9-1.99 2L3 20
                            a2 2 0 0 0 2 2h14c1.1 0 2-.9
                            2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z
                            M9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8
                            4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z
                        "/>
                    </svg>

                    <span>
                        Entrega:
                        ${order.data_entrega || 'A combinar'}
                    </span>
                </div>

                <div class="info-row">
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                    >
                        <path d="
                            M12 2C8.13 2 5 5.13 5 9
                            c0 5.25 7 13 7 13s7-7.75
                            7-13c0-3.87-3.13-7-7-7zm0
                            9.5c-1.38 0-2.5-1.12-2.5-2.5
                            s1.12-2.5 2.5-2.5 2.5
                            1.12 2.5 2.5-1.12 2.5-2.5 2.5z
                        "/>
                    </svg>

                    <span>
                        ${order.negociante_cidade},
                        ${order.negociante_estado}
                    </span>
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

    // ==========================================
    // BOTÃO DETALHES
    // ==========================================

    card.querySelector('.btn-details').onclick = () => {
        showDetails(
            order.id,
            tipo_de_usuario
        );
    };

    // ==========================================
    // AÇÃO SECUNDÁRIA
    // ==========================================

    if (acaoSecundaria) {
        card.querySelector('.btn-acao-secundaria').onclick = async () => {
            if (confirm(`Deseja realmente ${acaoSecundaria} este pedido?`)) {
                try {
                    await API.atualizarStatus(order.id, novoStatus);
                    alert(`Pedido ${novoStatus.toLowerCase()}!`);
                    location.reload();
                } catch (e) {
                    alert("Erro ao tentar atualizar o status do pedido.");
                }
            }
        };
    } else if (
        statusClass === 'recusado' ||
        statusClass === 'cancelado' ||
        statusClass === 'finalizado'
    ) {
        // ==========================================
        // BOTÃO EXCLUIR HISTÓRICO
        // ==========================================
        card.querySelector('.btn-delete').onclick = () => {
            deleteOrder(order.id);
        };
    }

    return card;
}

// ==========================================
// RENDERIZA PEDIDOS
// ==========================================

export async function renderOrders(
    listaExterna = null,
    tipoUsuarioParam = null
) {
    const grid = document.getElementById('orders-grid');
    if (!grid) {
        return;
    }

    limparGrid();

    const tipo_de_usuario =
        tipoUsuarioParam ||
        (
            window.location.href.includes('estabelecimento')
                ? 'estabelecimento'
                : 'produtor'
        );

    try {
        // ==========================================
        // BUSCA API / CACHE
        // ==========================================

        if (!cacheNegociacoes && !listaExterna) {
            cacheNegociacoes = await API.listarNegociacoes(tipo_de_usuario);
        }

        let lista = listaExterna || cacheNegociacoes || [];

        // ==========================================
        // NENHUM PEDIDO / NENHUM RESULTADO
        // ==========================================

        if (lista.length === 0) {
            if (listaExterna) {
                // Existe uma lista externa, portanto provavelmente houve filtro/busca.
                renderizarSemResultados(grid);
            } else {
                // Não existe lista externa. A API retornou zero pedidos.
                renderizarSemPedidos(grid);
            }
            return;
        }

        // ==========================================
        // LÓGICA DE AGRUPAMENTO / ORDENAÇÃO
        // ==========================================

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

            // Atribui peso alto (99) se o status não estiver no mapeamento
            const pesoA = ordemPrioridade[statusA] || 99;
            const pesoB = ordemPrioridade[statusB] || 99;

            return pesoA - pesoB;
        });

        // ==========================================
        // RENDERIZA CARDS
        // ==========================================

        listaOrdenada.forEach(order => {
            grid.appendChild(
                criarCardNegociacao(
                    order,
                    tipo_de_usuario
                )
            );
        });

    } catch (error) {
        console.error("Erro ao carregar negociações:", error);
        renderizarErro(grid);
    }
}