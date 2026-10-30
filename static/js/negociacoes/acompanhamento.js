/**
 * ARQUIVO: acompanhamento.js
 * OBJETIVO: Mostrar em que pé está cada pedido e cuidar da avaliação do produtor
 * - selo de "próxima ação" nos cards
 * - linha do tempo nos detalhes (Pedido feito → Aceito → Entregue → Recebido → Avaliado)
 * - bloco da avaliação nos detalhes e abertura do modal "Avalie este pedido"
 */

import { API } from "./api.js";

const { escaparHTML, formatarNota, formatarData, estrelas } = window.Avaliacoes;


// ============================================================
// AUXILIARES
// ============================================================

export function statusDe(order) {
    return String(order?.status || "pendente").trim().toLowerCase();
}

export function precisaAvaliar(order, tipoUsuario) {
    return tipoUsuario === "estabelecimento"
        && statusDe(order) === "finalizado"
        && !order.avaliacao;
}

export function dataDoPedido(order) {
    const data = formatarData(order?.data_criacao);
    return data ? `Pedido em ${data}` : "";
}

/**
 * Nome do produtor que leva ao perfil público dele.
 * Para o produtor, o "negociante" é o estabelecimento: aí mostra só o texto.
 */
export function nomeNegocianteHTML(order, tipoUsuario, { comEtiqueta = true } = {}) {
    const nome = escaparHTML(order.negociante_nome || "Não informado");

    // Conta excluída: mantém o nome e mostra uma etiqueta embaixo
    // (no card a etiqueta fica ao lado do status: comEtiqueta = false)
    const etiqueta = comEtiqueta ? etiquetaContaExcluidaHTML(order) : "";

    if (tipoUsuario !== "estabelecimento" || !order.produtor_id) {
        return `<span class="nome-negociante" title="${nome}">${nome}</span>${etiqueta}`;
    }

    return `<a class="link-produtor" href="/produtor/${Number(order.produtor_id)}" title="${nome} · ver perfil e avaliações">${nome}</a>${etiqueta}`;
}

/** Etiqueta "Conta excluída" (vazia quando a conta está ativa). */
export function etiquetaContaExcluidaHTML(order) {
    return order.negociante_conta_excluida
        ? `<span class="etiqueta-conta-excluida">Conta excluída</span>`
        : "";
}


// ============================================================
// PRÓXIMA AÇÃO (SELO DO CARD)
// ============================================================

export function proximaAcao(order, tipoUsuario) {
    const status = statusDe(order);
    const souProdutor = tipoUsuario === "produtor";

    const minhaVez = (texto) => ({ texto, classe: "minha-vez", icone: "bell-ring" });
    const aguardando = (texto) => ({ texto, classe: "aguardando", icone: "hourglass" });
    const concluido = (texto) => ({ texto, classe: "concluido", icone: "circle-check" });

    switch (status) {
        case "pendente":
            return souProdutor ? minhaVez("Responda o pedido") : aguardando("Aguardando o produtor aceitar");

        case "aceito":
            if (souProdutor) {
                return order.entrega_confirmada ? aguardando("Aguardando o recebimento") : minhaVez("Confirme a entrega");
            }
            return minhaVez("Confirme quando receber");

        case "entregue":
            return souProdutor ? aguardando("Aguardando o recebimento") : minhaVez("Confirme o recebimento");

        case "finalizado":
            if (order.avaliacao) {
                return concluido(`Avaliado com ${formatarNota(order.avaliacao.nota)} ★`);
            }
            return souProdutor ? aguardando("Aguardando avaliação") : minhaVez("Avalie o produtor");

        case "recusado":
            return { texto: "Pedido recusado", classe: "encerrado", icone: "circle-x" };

        case "cancelado":
            return { texto: "Pedido cancelado", classe: "encerrado", icone: "circle-x" };

        default:
            return null;
    }
}

export function proximaAcaoHTML(order, tipoUsuario) {
    // Conta excluída: a faixa avisa isso no lugar do status
    // (o status do pedido continua nos Detalhes)
    const acao = order.negociante_conta_excluida
        ? { texto: "Conta excluída", classe: "conta-excluida", icone: "user-x" }
        : proximaAcao(order, tipoUsuario);

    if (!acao) return "";

    return `
        <span class="proxima-acao ${acao.classe}">
            <i data-lucide="${acao.icone}"></i>
            <span>${acao.texto}</span>
        </span>`;
}


// ============================================================
// LINHA DO TEMPO (DETALHES)
// ============================================================

export function linhaDoTempoHTML(order) {
    const status = statusDe(order);

    if (status === "recusado" || status === "cancelado") {
        return `<p class="aviso-encerrado">Este pedido foi ${status}.</p>`;
    }

    const etapas = ["Pedido feito", "Aceito", "Entregue", "Recebido", "Avaliado"];
    const concluidas = { pendente: 1, aceito: 2, entregue: 3, finalizado: 4 }[status] || 1;
    const feitas = concluidas + (order.avaliacao ? 1 : 0);

    const itens = etapas.map((nome, indice) => {
        const classe = indice < feitas ? "feita" : indice === feitas ? "atual" : "";
        const marca = indice < feitas ? "✓" : indice + 1;
        const data = indice === 0 ? formatarData(order.data_criacao) : "";

        return `
            <li class="etapa ${classe}">
                <span class="etapa-bolinha">${marca}</span>
                <span class="etapa-nome">${nome}</span>
                ${data ? `<span class="data-pedido">${data}</span>` : ""}
            </li>`;
    }).join("");

    return `<ol class="linha-do-tempo" aria-label="Andamento do pedido">${itens}</ol>`;
}


// ============================================================
// BLOCO DE AVALIAÇÃO (DETALHES)
// ============================================================

export function avaliacaoHTML(order, tipoUsuario) {
    if (statusDe(order) !== "finalizado") return "";

    if (order.avaliacao) {
        const titulo = tipoUsuario === "produtor"
            ? "Avaliação que você recebeu"
            : "Sua avaliação do produtor";

        const comentario = order.avaliacao.comentario
            ? `<p class="comentario">“${escaparHTML(order.avaliacao.comentario)}”</p>`
            : "";

        return `
            <div class="avaliacao-pedido">
                <h3>${titulo}</h3>
                ${estrelas(order.avaliacao.nota, 24)}
                <strong style="margin-left:6px;">${formatarNota(order.avaliacao.nota)}</strong>
                ${comentario}
            </div>`;
    }

    if (tipoUsuario === "estabelecimento") {
        return `
            <div class="avaliacao-pedido">
                <h3>Como foi este pedido?</h3>
                <p style="margin:0 0 12px;">Sua avaliação ajuda outros estabelecimentos a escolher produtores.</p>
                <button class="btn-avaliar-card" id="btnAbrirAvaliacao" type="button">
                    Avaliar produtor
                </button>
            </div>`;
    }

    return `
        <div class="avaliacao-pedido">
            <h3>Aguardando avaliação</h3>
            <p style="margin:0;">O estabelecimento ainda não avaliou este pedido.</p>
        </div>`;
}


// ============================================================
// BOTÃO PRINCIPAL DO CARD (= PRÓXIMA AÇÃO)
// ============================================================

/**
 * O botão principal do card é sempre a próxima ação de quem está vendo,
 * a mesma indicada no selo. null = não há ação (só Detalhes).
 */
export function acaoPrincipal(order, tipoUsuario) {
    const status = statusDe(order);
    const souProdutor = tipoUsuario === "produtor";

    if (status === "pendente" && souProdutor) {
        return { acao: "aceitar", texto: "Aceitar" };
    }

    if (status === "aceito" && souProdutor && !order.entrega_confirmada) {
        return { acao: "confirmar_entrega", texto: "Confirmar entrega" };
    }

    if ((status === "aceito" || status === "entregue") && !souProdutor) {
        return { acao: "confirmar_recebimento", texto: "Confirmar recebimento" };
    }

    if (precisaAvaliar(order, tipoUsuario)) {
        return { acao: "avaliar", texto: "★ Avaliar" };
    }

    return null;
}


// ============================================================
// CONFIRMAR ENTREGA / RECEBIMENTO
// ============================================================

/**
 * Usado no card e nos detalhes. Quando o estabelecimento confirma o recebimento,
 * o pedido finaliza e o modal de avaliação abre na hora.
 */
export async function executarConfirmacao(order, tipoUsuario) {
    const acao = tipoUsuario === "produtor"
        ? "confirmar_entrega"
        : "confirmar_recebimento";

    try {
        const resultado = await API.registrarConfirmacao(order.id, acao);

        if (
            acao === "confirmar_recebimento" &&
            String(resultado?.status_atual || "").toLowerCase() === "finalizado"
        ) {
            exibirNotificacao("cadastro", "Recebimento confirmado!");

            abrirAvaliacao(
                { ...order, status: "Finalizado" },
                () => location.reload()
            );
            return;
        }

        agendarNotificacao("cadastro", "Confirmação registrada com sucesso!");
        location.reload();

    } catch (error) {
        console.error("❌ Erro ao registrar confirmação:", error);
        exibirNotificacao("erro", "Erro ao registrar confirmação.");
    }
}


// ============================================================
// MODAL "AVALIE ESTE PEDIDO"
// ============================================================

/**
 * Abre o modal de avaliação. Depois de enviar, recarrega a página com aviso de sucesso.
 * @param {Function} aoFechar - chamado quando a pessoa escolhe "Avaliar depois"
 */
export function abrirAvaliacao(order, aoFechar = null) {
    window.Avaliacoes.abrirModal({
        subtitulo: `${order.produto_nome || "Pedido"} · ${order.negociante_nome || "Produtor"}`,

        onEnviar: async (nota, comentario) => {
            await API.avaliarProdutor(order.id, nota, comentario);

            agendarNotificacao("cadastro", "Avaliação enviada. Obrigado!");
            location.reload();
        },

        onFechar: aoFechar
    });
}
