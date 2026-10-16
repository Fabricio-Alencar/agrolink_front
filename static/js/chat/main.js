
import {
    carregarConversas,
    abrirConversa,
    mostrarEstadoSemSelecao
} from "./conversas.js";

import { API } from "./api.js";
import { conectarWebSocketGeral } from "./websocket.js";

const campoPesquisa = document.getElementById("chatSearch");

function aplicarPesquisa() {
    const termo = campoPesquisa?.value.toLowerCase().trim() || "";

    const itens = document.querySelectorAll(".conversa-item");
    const secaoArquivadas = document.querySelector(".conversas-arquivadas");
    const listaAtivas = document.querySelector(".conversas-ativas-lista");
    const conteudoArquivadas = document.querySelector(
        ".conversas-arquivadas-conteudo"
    );
    const botaoArquivadas = document.querySelector(
        ".conversas-arquivadas-toggle"
    );

    itens.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(termo) ? "flex" : "none";
    });

    if (!secaoArquivadas || !conteudoArquivadas) {
        return;
    }

    const arquivadasVisiveis = Array.from(
        secaoArquivadas.querySelectorAll(".conversa-item")
    ).some(item => item.style.display !== "none");

    const ativasVisiveis = Array.from(
        listaAtivas?.querySelectorAll(".conversa-item") || []
    ).some(item => item.style.display !== "none");

    secaoArquivadas.hidden = !arquivadasVisiveis;

    if (termo && arquivadasVisiveis) {
        conteudoArquivadas.hidden = false;
        secaoArquivadas.classList.add("expandida");
        botaoArquivadas?.setAttribute("aria-expanded", "true");
    } else if (!termo) {
        const expandida =
            botaoArquivadas?.getAttribute("aria-expanded") === "true";

        conteudoArquivadas.hidden = !expandida;
        secaoArquivadas.classList.toggle("expandida", expandida);
    }

    const avisoAtivas = listaAtivas?.querySelector(".chat-sem-conversas");

    if (avisoAtivas) {
        avisoAtivas.hidden = termo !== "" || ativasVisiveis;
    }
}

campoPesquisa?.addEventListener("input", aplicarPesquisa);

const parametros = new URLSearchParams(window.location.search);
const negociacaoUrl = parametros.get("negociacao");

async function iniciarChat() {
    try {
        conectarWebSocketGeral();

        if (negociacaoUrl) {
            const negociacaoId = Number(negociacaoUrl);

            if (!Number.isInteger(negociacaoId) || negociacaoId <= 0) {
                throw new Error("O identificador da negociação é inválido.");
            }

            await API.iniciarConversa(negociacaoId);
        }

        const conversas = await carregarConversas();

        aplicarPesquisa();

        if (!Array.isArray(conversas) || conversas.length === 0) {
            mostrarEstadoSemSelecao();
            return;
        }

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

iniciarChat();

if (window.lucide) {
    window.lucide.createIcons();
}
