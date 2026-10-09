import {
    carregarConversas,
    abrirConversa,
    mostrarEstadoSemSelecao
} from "./conversas.js";

import { API } from "./api.js";

import {
    conectarWebSocketGeral
} from "./websocket.js";


/* =========================================================
   PESQUISA DE CONVERSAS
========================================================= */

const campoPesquisa = document.getElementById("chatSearch");

if (campoPesquisa) {
    campoPesquisa.addEventListener("input", () => {
        const termo = campoPesquisa.value.toLowerCase().trim();

        document.querySelectorAll(".conversa-item").forEach(item => {
            const texto = item.textContent.toLowerCase();

            item.style.display = texto.includes(termo)
                ? "flex"
                : "none";
        });
    });
}


/* =========================================================
   OBTER NEGOCIAÇÃO DA URL
========================================================= */

const parametros = new URLSearchParams(window.location.search);
const negociacaoUrl = parametros.get("negociacao");


/* =========================================================
   INICIALIZAR CHAT
========================================================= */

async function iniciarChat() {
    try {
        // Conecta às notificações gerais.
        conectarWebSocketGeral();

        /*
         * Quando existe uma negociação na URL, inicia ou
         * reutiliza a conversa antes de carregar a lista.
         */
        if (negociacaoUrl) {
            const negociacaoId = Number(negociacaoUrl);

            if (!Number.isInteger(negociacaoId) || negociacaoId <= 0) {
                throw new Error("O identificador da negociação é inválido.");
            }

            await API.iniciarConversa(negociacaoId);
        }

        /*
         * Carrega as conversas depois da inicialização.
         * Conversas sem mensagens também devem aparecer.
         */
        const conversas = await carregarConversas();

        console.log("Conversas carregadas:", conversas);

        if (!Array.isArray(conversas) || conversas.length === 0) {
            mostrarEstadoSemSelecao();
            return;
        }

        /*
         * Se a URL contém uma negociação, abre-a somente
         * se ela estiver na lista retornada pelo servidor.
         */
        if (negociacaoUrl) {
            const negociacaoId = Number(negociacaoUrl);

            const conversaExiste = conversas.some(
                conversa =>
                    Number(conversa.negociacao_id) === negociacaoId
            );

            if (!conversaExiste) {
                mostrarEstadoSemSelecao();
                return;
            }

            await abrirConversa(negociacaoId);
            return;
        }

        // Sem negociação na URL, aguarda a escolha do usuário.
        mostrarEstadoSemSelecao();

    } catch (error) {
        console.error("Erro ao inicializar o chat:", error);

        mostrarEstadoSemSelecao();

        alert(
            error.message ||
            "Não foi possível abrir a conversa. Tente novamente."
        );
    }
}


/* =========================================================
   INICIAR PÁGINA
========================================================= */

iniciarChat();


/* =========================================================
   ÍCONES LUCIDE
========================================================= */

if (window.lucide) {
    window.lucide.createIcons();
}