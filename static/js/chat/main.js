import {
    carregarConversas,
    abrirConversa,
    mostrarEstadoSemSelecao
} from "./conversas.js";

import {
    conectarWebSocketGeral
} from "./websocket.js";


/* =========================================================
   PESQUISA DE CONVERSAS
========================================================= */

const campoPesquisa =
    document.getElementById("chatSearch");


if (campoPesquisa) {

    campoPesquisa.addEventListener(
        "input",
        () => {

            const termo =
                campoPesquisa.value
                    .toLowerCase()
                    .trim();


            document
                .querySelectorAll(".conversa-item")
                .forEach(item => {

                    const texto =
                        item.textContent
                            .toLowerCase();


                    if (
                        texto.includes(termo)
                    ) {

                        item.style.display =
                            "flex";

                    } else {

                        item.style.display =
                            "none";

                    }

                });

        }
    );

}


/* =========================================================
   ABRIR CONVERSA PELA URL
========================================================= */

const parametros =
    new URLSearchParams(
        window.location.search
    );


const negociacaoUrl =
    parametros.get(
        "negociacao"
    );


/* =========================================================
   ESTADO INICIAL
========================================================= */

/*
   Enquanto as conversas ainda estão sendo carregadas,
   não abrimos nenhuma conversa automaticamente.
*/


/* =========================================================
   CONECTAR AO WEBSOCKET GERAL
========================================================= */

conectarWebSocketGeral();


/* =========================================================
   CARREGAR CONVERSAS
========================================================= */

async function iniciarChat() {

    try {

        /*
           Primeiro carrega as conversas.

           Isso é importante porque o banco novo
           pode não possuir nenhuma mensagem ainda.
        */

        const conversas =
            await carregarConversas();


        console.log(
            "💬 RESULTADO INICIAL DAS CONVERSAS:",
            conversas
        );


        /* ---------------------------------------------
           NENHUMA CONVERSA
        --------------------------------------------- */

        if (
            !conversas ||
            conversas.length === 0
        ) {

            /*
               Não importa se existe uma negociação
               na URL.

               Se ainda não existe mensagem no banco,
               essa negociação ainda não é uma conversa.

               Portanto NÃO abrimos o chat vazio.
            */

            mostrarEstadoSemSelecao();

            return;

        }


        /* ---------------------------------------------
           EXISTEM CONVERSAS
        --------------------------------------------- */

        if (negociacaoUrl) {

            const negociacaoExiste =
                conversas.some(
                    conversa =>
                        Number(
                            conversa.negociacao_id
                        ) ===
                        Number(
                            negociacaoUrl
                        )
                );


            /*
               Só abre a conversa se ela realmente
               existir na lista de conversas.
            */

            if (negociacaoExiste) {

                await abrirConversa(
                    negociacaoUrl
                );

            } else {

                mostrarEstadoSemSelecao();

            }

        } else {

            mostrarEstadoSemSelecao();

        }

    } catch (error) {

        console.error(
            "❌ Erro ao iniciar o chat:",
            error
        );


        mostrarEstadoSemSelecao();

    }

}


/* =========================================================
   INICIAR CHAT
========================================================= */

iniciarChat();


/* =========================================================
   LUCIDE
========================================================= */

if (window.lucide) {

    lucide.createIcons();

}