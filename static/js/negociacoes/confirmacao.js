/**
 * ARQUIVO: confirmacao.js
 * OBJETIVO: Gerenciar o modal de confirmação das negociações
 */

import { API } from "./api.js";


// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================

let acaoGlobal = null;
let orderGlobal = null;
let novoStatusGlobal = null;


// ============================================================
// PREPARA CONFIRMAÇÃO
// ============================================================

export function prepararConfirmacaoNegociacao(
    acao,
    order,
    novoStatus = null
) {

    acaoGlobal = acao;
    orderGlobal = order;
    novoStatusGlobal = novoStatus;

    const modal =
        document.getElementById("modalExcluir");

    const mensagem =
        document.getElementById("mensagemExcluir");

    const titulo =
        document.getElementById("tituloModalConfirmacao");

    const botao =
        document.getElementById("btnConfirmarExclusao");

    if (!modal || !mensagem) {

        console.error(
            "❌ Modal de confirmação não encontrado."
        );

        return;
    }


    // ========================================================
    // RECUSAR
    // ========================================================

    if (acao === "recusar") {

        if (titulo) {
            titulo.textContent = "Recusar Pedido";
        }

        mensagem.innerHTML =
            `Deseja realmente recusar o pedido de <strong>${order.produto_nome || "produto"}</strong>?`;

        if (botao) {
            botao.textContent = "Recusar";
        }

    }


    // ========================================================
    // CANCELAR
    // ========================================================

    else if (acao === "cancelar") {

        if (titulo) {
            titulo.textContent = "Cancelar Pedido";
        }

        mensagem.innerHTML =
            `Deseja realmente cancelar o pedido de <strong>${order.produto_nome || "produto"}</strong>?`;

        if (botao) {
            botao.textContent = "Cancelar";
        }

    }


    // ========================================================
    // EXCLUIR
    // ========================================================

    else if (acao === "excluir") {

        if (titulo) {
            titulo.textContent = "Remover Pedido";
        }

        mensagem.innerHTML =
            `Deseja realmente remover o pedido de <strong>${order.produto_nome || "produto"}</strong>?`;

        if (botao) {
            botao.textContent = "Remover";
        }

    }


    // ========================================================
    // OUTRA AÇÃO
    // ========================================================

    else {

        if (titulo) {
            titulo.textContent = "Confirmar Ação";
        }

        mensagem.innerHTML =
            "Deseja realmente realizar esta ação?";

        if (botao) {
            botao.textContent = "Confirmar";
        }
    }


    // ========================================================
    // ABRIR MODAL
    // ========================================================

    modal.classList.add("active");
}


// ============================================================
// FECHAR MODAL
// ============================================================

export function fecharModalConfirmacao() {

    const modal =
        document.getElementById("modalExcluir");

    if (modal) {
        modal.classList.remove("active");
    }

    acaoGlobal = null;
    orderGlobal = null;
    novoStatusGlobal = null;
}


// ============================================================
// BOTÃO CONFIRMAR
// ============================================================

const btnConfirmar =
    document.getElementById(
        "btnConfirmarExclusao"
    );


if (!btnConfirmar) {

    console.error(
        "❌ Botão de confirmação não encontrado."
    );

} else {

    btnConfirmar.onclick =
        async (event) => {

            if (event) {
                event.preventDefault();
            }

            if (
                !acaoGlobal ||
                !orderGlobal
            ) {

                fecharModalConfirmacao();

                return;
            }


            try {

                // ==================================================
                // EXCLUIR NEGOCIAÇÃO
                // ==================================================

                if (acaoGlobal === "excluir") {

                    await API.deletarNegociacao(
                        orderGlobal.id
                    );

                    agendarNotificacao(
                        "exclusao",
                        "Pedido removido com sucesso!"
                    );

                    fecharModalConfirmacao();

                    location.reload();

                    return;
                }


                // ==================================================
                // ATUALIZAR STATUS
                // ==================================================

                await API.atualizarStatus(
                    orderGlobal.id,
                    novoStatusGlobal
                );


                let mensagem = "";

                if (acaoGlobal === "recusar") {

                    mensagem =
                        "Pedido recusado.";

                } else if (acaoGlobal === "cancelar") {

                    mensagem =
                        "Pedido cancelado.";

                } else {

                    mensagem =
                        "Pedido atualizado.";
                }


                agendarNotificacao(
                    "exclusao",
                    mensagem
                );

                fecharModalConfirmacao();

                location.reload();

            } catch (error) {

                console.error(
                    "❌ Erro ao atualizar pedido:",
                    error
                );

                fecharModalConfirmacao();

                exibirNotificacao(
                    "erro",
                    "Erro ao tentar atualizar o pedido."
                );
            }
        };
}


// ============================================================
// DISPONIBILIZA PARA O HTML
// ============================================================

window.fecharModalConfirmacao =
    fecharModalConfirmacao;

