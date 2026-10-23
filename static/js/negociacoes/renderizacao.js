import { showDetails } from "./navegacao.js";
import { deleteOrder } from "./filtros_botao_excluir.js";
import { API } from './api.js';
import { criarPaginacao } from "../paginacao.js";
import { prepararConfirmacaoNegociacao } from "./confirmacao.js";
import {
    proximaAcaoHTML,
    acaoPrincipal,
    executarConfirmacao,
    dataDoPedido,
    nomeNegocianteHTML,
    abrirAvaliacao
} from "./acompanhamento.js";

let cacheNegociacoes = null;

const ITENS_POR_PAGINA = 12;

let paginacaoNegociacoes = null;
let containerPaginacao = null;
let gridPaginado = null;

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
// LOADING
// ==========================================

function renderizarCarregando(container) {
    container.innerHTML = `
        <div class="carregando-produtos">
            <div class="spinner-produtos"></div>
            <p>Carregando pedidos...</p>
        </div>
    `;
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
    const statusClass = order.status
        ? order.status.toLowerCase()
        : 'pendente';

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
                <button class="btn-acao-secundaria" type="button">
                    Recusar
                </button>
            `;

            novoStatus = 'Recusado';
            acaoSecundaria = 'recusar';
        } else {
            // Estabelecimento cancela proposta pendente
            botaoSecundario = `
                <button class="btn-acao-secundaria" type="button">
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
            <button class="btn-acao-secundaria" type="button">
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
        // Mostra a lixeira apenas para limpar a tela
        botaoSecundario = `
            <button
                class="btn-delete"
                type="button"
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

    // Se o status for 'entregue', não mostra ação secundária.

    // ==========================================
    // HTML DO CARD
    // ==========================================

    const principal = acaoPrincipal(order, tipo_de_usuario);

    const botaoPrincipal = principal
        ? `<button class="${principal.acao === 'avaliar' ? 'btn-avaliar-card' : 'btn-acao-principal'}" type="button" data-acao="${principal.acao}">${principal.texto}</button>`
        : '';

    card.innerHTML = `
        ${proximaAcaoHTML(order, tipo_de_usuario)}

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
                    ${nomeNegocianteHTML(order, tipo_de_usuario)}
                </div>

                <div class="data-pedido">
                    ${dataDoPedido(order)}
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
                            c-.16-.12-.36-.18-.57-.18s-.41-.06-.57-.18
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
            ${
                botaoPrincipal
                    ? `
                        <div class="linha-acoes">
                            <button class="btn-details" type="button">Detalhes</button>
                        </div>

                        <div class="linha-acoes">
                            ${botaoPrincipal}
                            ${botaoSecundario}
                        </div>
                    `
                    : `
                        <div class="linha-acoes">
                            <button class="btn-details" type="button">Detalhes</button>
                            ${botaoSecundario}
                        </div>
                    `
            }
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
    // BOTÃO PRINCIPAL
    // ==========================================

    const btnPrincipal = card.querySelector('[data-acao]');

    if (btnPrincipal) {
        btnPrincipal.onclick = () => {
            if (principal.acao === 'aceitar') {
                prepararConfirmacaoNegociacao('aceitar', order, 'Aceito');
            } else if (principal.acao === 'avaliar') {
                abrirAvaliacao(order);
            } else {
                // Confirmar entrega / confirmar recebimento
                btnPrincipal.disabled = true;
                executarConfirmacao(order, tipo_de_usuario);
            }
        };
    }

    // ==========================================
    // AÇÃO SECUNDÁRIA
    // ==========================================

    if (acaoSecundaria) {
        card.querySelector('.btn-acao-secundaria').onclick = () => {
            prepararConfirmacaoNegociacao(
                acaoSecundaria,
                order,
                novoStatus
            );
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
// PAGINAÇÃO DOS PEDIDOS
// ==========================================

function obterContainerPaginacao(grid) {
    if (
        containerPaginacao &&
        containerPaginacao.isConnected &&
        gridPaginado === grid
    ) {
        return containerPaginacao;
    }

    const host = document.createElement('div');
    host.className = 'area-controles-paginacao';
    host.hidden = true;

    grid.insertAdjacentElement('afterend', host);

    containerPaginacao = host;
    gridPaginado = grid;

    return host;
}

function inicializarPaginacao(grid, tipo_de_usuario) {
    const host = obterContainerPaginacao(grid);

    if (!paginacaoNegociacoes) {
        paginacaoNegociacoes = criarPaginacao({
            container: host,
            itensPorPagina: ITENS_POR_PAGINA,
            aoMudarPagina({ itens }) {
                renderizarCardsNegociacoes(
                    itens,
                    grid,
                    tipo_de_usuario
                );
            }
        });
    }

    return host;
}

function renderizarCardsNegociacoes(lista, grid, tipo_de_usuario) {
    grid.innerHTML = '';

    lista.forEach(order => {
        grid.appendChild(
            criarCardNegociacao(
                order,
                tipo_de_usuario
            )
        );
    });

    atualizarIcones();
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
            renderizarCarregando(grid);

            cacheNegociacoes = await API.listarNegociacoes(
                tipo_de_usuario
            );
        }

        const lista = listaExterna || cacheNegociacoes || [];

        // ==========================================
        // NENHUM PEDIDO / NENHUM RESULTADO
        // ==========================================

        if (lista.length === 0) {
            const hostPaginacao = obterContainerPaginacao(grid);
            hostPaginacao.hidden = true;

            if (paginacaoNegociacoes) {
                paginacaoNegociacoes.atualizar([]);
            }

            if (listaExterna) {
                renderizarSemResultados(grid);
            } else {
                renderizarSemPedidos(grid);
            }

            return;
        }

        // ==========================================
        // ORDENAÇÃO: ÚLTIMA ATUALIZAÇÃO PRIMEIRO
        // ==========================================

        const listaOrdenada = [...lista].sort((a, b) =>
            String(b.data_atualizacao || b.data_criacao || "")
                .localeCompare(String(a.data_atualizacao || a.data_criacao || "")) ||
            Number(b.id) - Number(a.id)
        );

        // ==========================================
        // RENDERIZAÇÃO COM PAGINAÇÃO
        // ==========================================

        const hostPaginacao = inicializarPaginacao(
            grid,
            tipo_de_usuario
        );

        hostPaginacao.hidden = false;
        paginacaoNegociacoes.atualizar(listaOrdenada);

    } catch (error) {
        console.error(
            "Erro ao carregar negociações:",
            error
        );

        if (containerPaginacao) {
            containerPaginacao.hidden = true;
        }

        renderizarErro(grid);
    }
}