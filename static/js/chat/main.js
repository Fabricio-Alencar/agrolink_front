
import {
    carregarConversas,
    abrirConversa,
    mostrarEstadoSemSelecao
} from "./conversas.js";

import { API } from "./api.js";
import { conectarWebSocketGeral } from "./websocket.js";

const campoPesquisa = document.getElementById("chatSearch");
let estadoAcordeaoAntesDaPesquisa = null;

function aplicarPesquisa() {
    const termo = campoPesquisa?.value.toLowerCase().trim() || "";
    const pesquisaAtiva = termo !== "";

    const itens = document.querySelectorAll(".conversa-item");
    const secaoArquivadas = document.querySelector(".conversas-arquivadas");
    const listaAtivas = document.querySelector(".conversas-ativas-lista");
    const conteudoArquivadas = document.querySelector(
        ".conversas-arquivadas-conteudo"
    );
    const botaoArquivadas = document.querySelector(
        ".conversas-arquivadas-toggle"
    );

    if (!secaoArquivadas || !listaAtivas || !conteudoArquivadas) {
        return;
    }

    // Guarda o estado original somente no início da pesquisa.
    if (pesquisaAtiva && estadoAcordeaoAntesDaPesquisa === null) {
        estadoAcordeaoAntesDaPesquisa = {
            expandida:
                botaoArquivadas?.getAttribute("aria-expanded") === "true",
            secaoOculta: secaoArquivadas.hidden,
            listaAtivasOculta: listaAtivas.hidden
        };
    }

    // Filtra todas as conversas, tanto ativas quanto arquivadas.
    itens.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(termo) ? "flex" : "none";
    });

    const arquivadasVisiveis = Array.from(
        secaoArquivadas.querySelectorAll(".conversa-item")
    ).some(item => item.style.display !== "none");

    const ativasVisiveis = Array.from(
        listaAtivas.querySelectorAll(".conversa-item")
    ).some(item => item.style.display !== "none");

    const avisoAtivas = listaAtivas.querySelector(".chat-sem-conversas");

    if (pesquisaAtiva) {
        // Durante a pesquisa, mostra somente os grupos que têm resultados.
        listaAtivas.hidden = !ativasVisiveis;
        secaoArquivadas.hidden = !arquivadasVisiveis;

        // Se houver resultados arquivados, expande o acordeão.
        if (arquivadasVisiveis) {
            conteudoArquivadas.hidden = false;
            secaoArquivadas.classList.add("expandida");
            botaoArquivadas?.setAttribute("aria-expanded", "true");
        } else {
            conteudoArquivadas.hidden = true;
            secaoArquivadas.classList.remove("expandida");
            botaoArquivadas?.setAttribute("aria-expanded", "false");
        }

        // Esconde o botão de arquivadas durante a pesquisa.
        if (botaoArquivadas) {
            botaoArquivadas.hidden = true;
        }

        if (avisoAtivas) {
            avisoAtivas.hidden = true;
        }

        return;
    }

    // Pesquisa limpa: restaura a exibição normal de todas as conversas.
    itens.forEach(item => {
        item.style.display = "flex";
    });

    // Mostra novamente o botão de arquivadas.
    if (botaoArquivadas) {
        botaoArquivadas.hidden = false;
    }

    if (estadoAcordeaoAntesDaPesquisa !== null) {
        const estado = estadoAcordeaoAntesDaPesquisa;

        listaAtivas.hidden = estado.listaAtivasOculta;
        secaoArquivadas.hidden = estado.secaoOculta;
        conteudoArquivadas.hidden = !estado.expandida;

        secaoArquivadas.classList.toggle(
            "expandida",
            estado.expandida
        );

        botaoArquivadas?.setAttribute(
            "aria-expanded",
            String(estado.expandida)
        );

        estadoAcordeaoAntesDaPesquisa = null;
    } else {
        // Mantém o comportamento normal do acordeão.
        const expandida =
            botaoArquivadas?.getAttribute("aria-expanded") === "true";

        listaAtivas.hidden = expandida;
        conteudoArquivadas.hidden = !expandida;
        secaoArquivadas.classList.toggle("expandida", expandida);
    }

    if (avisoAtivas) {
        avisoAtivas.hidden = true;
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
