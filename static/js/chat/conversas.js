import { API } from "./api.js";
import { setNegociacaoAtual, setNegociacaoInfo } from "./estado.js";
import { conectarWebSocket } from "./websocket.js";
import {
    renderizarMensagens,
    confirmarMensagemEnviada
} from "./mensagens.js";
import {
    atualizarInfoNegociacao,
    fecharModalInfo
} from "./info-negociacao.js";
import {
    montarSecoesConversas,
    atualizarContadorArquivadas as atualizarContadorArquivadasModulo
} from "./conversas-arquivadas.js";
import {
    inicializarListaConversas,
    criarItemConversa,
    localizarItemConversa,
    atualizarContadorItem
} from "./lista-conversas.js";
import {
    obterDataUltimaMensagem,
    obterDataValida,
    conversaEstaArquivada
} from "./utils.js";

const chatContainer = document.querySelector(".chat-container");
const listaConversas = document.getElementById("listaConversas");
const chatArea = document.getElementById("chatArea");
const chatSemSelecao = document.getElementById("chatSemSelecao");
const chatNome = document.getElementById("chatNome");
const chatProduto = document.getElementById("chatProduto");
const chatFoto = document.getElementById("chatFoto");
const mensagens = document.getElementById("mensagens");
const btnVoltarChat = document.getElementById("btnVoltarChat");

const FOTO_GENERICA = "../static/assets/user.png";

let listaAtivas = null;
let listaArquivadas = null;
let secaoArquivadas = null;
let conteudoArquivadas = null;
let contadorArquivadas = null;

function voltarParaLista() {
    fecharModalInfo();

    chatContainer?.classList.remove("chat-aberto");

    if (chatArea) {
        chatArea.style.display = "none";
    }
}

btnVoltarChat?.addEventListener("click", voltarParaLista);

export function mostrarEstadoSemSelecao() {
    setNegociacaoAtual(null);
    setNegociacaoInfo(null);

    fecharModalInfo();

    if (chatArea) {
        chatArea.style.display = "none";
    }

    if (chatSemSelecao) {
        chatSemSelecao.style.display = "flex";
    }

    chatContainer?.classList.remove("chat-aberto");

    mensagens?.replaceChildren();

    document.querySelectorAll(".conversa-item").forEach(item => {
        item.classList.remove("ativa");
    });
}

function criarSecoesConversas() {
    const secoes = montarSecoesConversas(listaConversas);

    listaAtivas = secoes.listaAtivas;
    listaArquivadas = secoes.listaArquivadas;
    secaoArquivadas = secoes.secaoArquivadas;
    conteudoArquivadas = secoes.conteudoArquivadas;
    contadorArquivadas = secoes.contadorArquivadas;
}

function atualizarContadorArquivadas() {
    atualizarContadorArquivadasModulo({
        listaArquivadas,
        contadorArquivadas,
        secaoArquivadas
    });
}

inicializarListaConversas({
    elementoLista: listaConversas,
    abrirConversa,
    atualizarContadorArquivadas
});

function zerarContadorNaoLidas(negociacaoId) {
    const item = localizarItemConversa(negociacaoId);

    if (item) {
        atualizarContadorItem(item, 0);
    }
}

export async function carregarConversas() {
    if (!listaConversas) {
        throw new Error(
            "O elemento listaConversas não foi encontrado."
        );
    }

    const conversas = await API.buscarConversas();

    listaConversas.replaceChildren();

    if (!Array.isArray(conversas) || conversas.length === 0) {
        const aviso = document.createElement("p");
        aviso.className = "chat-sem-conversas";
        aviso.textContent = "Nenhuma conversa ainda.";

        listaConversas.appendChild(aviso);

        listaAtivas = null;
        listaArquivadas = null;
        secaoArquivadas = null;
        conteudoArquivadas = null;
        contadorArquivadas = null;

        return [];
    }

    // Ordena pela data mais recente da última mensagem.
    // Utiliza a mesma função de obtenção de data do restante do chat.
    conversas.sort((a, b) => {
        const dataA = obterDataValida(
            obterDataUltimaMensagem(a)
        );

        const dataB = obterDataValida(
            obterDataUltimaMensagem(b)
        );

        return (dataB?.getTime() ?? 0) -
            (dataA?.getTime() ?? 0);
    });

    criarSecoesConversas();

    conversas.forEach(conversa => {
        const item = criarItemConversa(conversa);

        if (conversaEstaArquivada(conversa)) {
            listaArquivadas.appendChild(item);
        } else {
            listaAtivas.appendChild(item);
        }
    });

    if (!listaAtivas.children.length) {
        const aviso = document.createElement("p");
        aviso.className = "chat-sem-conversas";
        aviso.textContent = "Nenhuma conversa ativa.";

        listaAtivas.appendChild(aviso);
    }

    atualizarContadorArquivadas();

    return conversas;
}

export async function abrirConversa(negociacaoId) {
    const id = Number(negociacaoId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Identificador de negociação inválido.");
    }

    await API.verificarAcessoNegociacao(id);

    // Garante que a conversa exista antes de buscar mensagens
    // e conectar o WebSocket.
    await API.iniciarConversa(id);

    setNegociacaoAtual(id);

    const detalhes = await API.buscarNegociacao(id);

    atualizarInfoNegociacao(detalhes);
    setNegociacaoInfo(detalhes);

    if (chatSemSelecao) {
        chatSemSelecao.style.display = "none";
    }

    if (chatArea) {
        chatArea.style.display = "flex";
    }

    chatContainer?.classList.add("chat-aberto");

    const nomeOutroUsuario =
        detalhes.negociante_nome ||
        detalhes.nome_outro_usuario ||
        detalhes.nome_usuario ||
        detalhes.nome ||
        "Conversa";

    const nomeProduto =
        detalhes.produto_nome ||
        detalhes.nome_produto ||
        detalhes.produto ||
        "Negociação";

    if (chatNome) {
        chatNome.textContent = nomeOutroUsuario;
    }

    if (chatProduto) {
        chatProduto.textContent = nomeProduto;
    }

    if (chatFoto) {
        const conversaSelecionada = localizarItemConversa(id);

        const fotoLista = conversaSelecionada?.querySelector(
            ".conversa-avatar img"
        );

        chatFoto.onerror = () => {
            chatFoto.onerror = null;
            chatFoto.src = FOTO_GENERICA;
        };

        chatFoto.src =
            detalhes.foto_perfil ||
            detalhes.foto_usuario ||
            fotoLista?.src ||
            FOTO_GENERICA;
    }

    mensagens?.replaceChildren();

    const listaMensagens = await API.buscarMensagens(id);

    if (Array.isArray(listaMensagens)) {
        renderizarMensagens(listaMensagens);
    }

    zerarContadorNaoLidas(id);

    conectarWebSocket(id, {
        onMensagemConfirmada: confirmarMensagemEnviada
    });

    document.querySelectorAll(".conversa-item").forEach(item => {
        item.classList.toggle(
            "ativa",
            Number(item.dataset.negociacaoId) === id
        );
    });
}
