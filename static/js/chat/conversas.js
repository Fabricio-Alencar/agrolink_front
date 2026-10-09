
import { API } from "./api.js";

import {
    setNegociacaoAtual,
    setNegociacaoInfo
} from "./estado.js";

import { conectarWebSocket } from "./websocket.js";
import { renderizarMensagens } from "./mensagens.js";


/* =========================================================
   ELEMENTOS DA TELA
========================================================= */

const chatContainer = document.querySelector(".chat-container");

const listaConversas = document.getElementById("listaConversas");
const chatArea = document.getElementById("chatArea");
const chatSemSelecao = document.getElementById("chatSemSelecao");
const chatNome = document.getElementById("chatNome");
const chatProduto = document.getElementById("chatProduto");
const chatFoto = document.getElementById("chatFoto");
const mensagens = document.getElementById("mensagens");

const btnVoltarChat = document.getElementById("btnVoltarChat");


/* =========================================================
   ELEMENTOS DO MODAL DE INFORMAÇÕES
========================================================= */

const btnInfoChat = document.getElementById("btnInfoChat");
const modalInfoNegociacao = document.getElementById("modalInfoNegociacao");
const btnFecharInfo = document.getElementById("btnFecharInfo");

const infoProduto = document.getElementById("infoProduto");
const infoQuantidade = document.getElementById("infoQuantidade");
const infoPreco = document.getElementById("infoPreco");
const infoUnidade = document.getElementById("infoUnidade");
const infoDataEntrega = document.getElementById("infoDataEntrega");
const infoStatus = document.getElementById("infoStatus");
const infoDescricao = document.getElementById("infoDescricao");
const infoNegociante = document.getElementById("infoNegociante");


/* =========================================================
   ESTADO DOS DETALHES DA NEGOCIAÇÃO
========================================================= */

let negociacaoDetalhesAtual = null;


/* =========================================================
   FOTO PADRÃO
========================================================= */

const FOTO_GENERICA = "../static/assets/user.png";


/* =========================================================
   FORMATAR VALORES
========================================================= */

function formatarPreco(valor) {

    if (valor === null || valor === undefined || valor === "") {
        return "-";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "-";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


function formatarData(data) {

    if (!data) {
        return "-";
    }

    const correspondencia = String(data).match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (correspondencia) {
        return `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`;
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
        return String(data);
    }

    return dataConvertida.toLocaleDateString("pt-BR");
}


/* =========================================================
   DATA DA ÚLTIMA MENSAGEM
========================================================= */

function obterDataUltimaMensagem(conversa) {

    const ultimaMensagem = conversa?.ultima_mensagem;

    if (
        !ultimaMensagem ||
        typeof ultimaMensagem !== "object" ||
        !ultimaMensagem.data_envio
    ) {
        return 0;
    }

    const data = new Date(
        ultimaMensagem.data_envio
    ).getTime();

    return Number.isFinite(data) ? data : 0;
}


/* =========================================================
   FORMATAR HORÁRIO DA CONVERSA
========================================================= */

function formatarHorarioMensagem(data) {

    if (!data) {
        return "";
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
        return "";
    }

    return dataConvertida.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* =========================================================
   PREENCHER DETALHES DA NEGOCIAÇÃO
========================================================= */

function preencherDetalhesNegociacao(detalhes) {

    if (!detalhes) {
        return;
    }

    if (infoProduto) {
        infoProduto.textContent =
            detalhes.produto_nome ||
            detalhes.nome_produto ||
            detalhes.produto ||
            "-";
    }

    if (infoQuantidade) {

        const quantidade = detalhes.quantidade;

        infoQuantidade.textContent =
            quantidade !== null && quantidade !== undefined
                ? String(quantidade)
                : "-";
    }

    if (infoPreco) {
        infoPreco.textContent = formatarPreco(
            detalhes.produto_preco ??
            detalhes.preco
        );
    }

    if (infoUnidade) {
        infoUnidade.textContent =
            detalhes.produto_unidade ||
            detalhes.unidade ||
            "-";
    }

    if (infoDataEntrega) {
        infoDataEntrega.textContent = formatarData(
            detalhes.data_entrega
        );
    }

    if (infoStatus) {
        infoStatus.textContent =
            detalhes.status || "-";
    }

    if (infoDescricao) {
        infoDescricao.textContent =
            detalhes.descricao || "-";
    }

    if (infoNegociante) {
        infoNegociante.textContent =
            detalhes.negociante_nome ||
            detalhes.nome_outro_usuario ||
            detalhes.nome_usuario ||
            detalhes.nome ||
            "-";
    }
}


/* =========================================================
   ABRIR E FECHAR MODAL
========================================================= */

function abrirModalInfo() {

    if (!negociacaoDetalhesAtual || !modalInfoNegociacao) {
        return;
    }

    preencherDetalhesNegociacao(negociacaoDetalhesAtual);

    modalInfoNegociacao.style.display = "flex";
    modalInfoNegociacao.setAttribute("aria-hidden", "false");
}


function fecharModalInfo() {

    if (!modalInfoNegociacao) {
        return;
    }

    modalInfoNegociacao.style.display = "none";
    modalInfoNegociacao.setAttribute("aria-hidden", "true");
}


/* =========================================================
   EVENTOS DO MODAL
========================================================= */

if (btnInfoChat) {
    btnInfoChat.addEventListener("click", abrirModalInfo);
}

if (btnFecharInfo) {
    btnFecharInfo.addEventListener("click", fecharModalInfo);
}


if (modalInfoNegociacao) {

    modalInfoNegociacao.addEventListener("click", event => {

        if (event.target === modalInfoNegociacao) {
            fecharModalInfo();
        }

    });
}


document.addEventListener("keydown", event => {

    if (
        event.key === "Escape" &&
        modalInfoNegociacao &&
        modalInfoNegociacao.style.display !== "none"
    ) {
        fecharModalInfo();
    }

});


/* =========================================================
   VOLTAR PARA A LISTA DE CONVERSAS
========================================================= */

function voltarParaLista() {

    fecharModalInfo();

    if (chatContainer) {
        chatContainer.classList.remove("chat-aberto");
    }

    if (chatArea) {
        chatArea.style.display = "none";
    }

}


if (btnVoltarChat) {
    btnVoltarChat.addEventListener("click", voltarParaLista);
}


/* =========================================================
   ESTADO SEM CONVERSA SELECIONADA
========================================================= */

export function mostrarEstadoSemSelecao() {

    setNegociacaoAtual(null);
    setNegociacaoInfo(null);

    negociacaoDetalhesAtual = null;

    fecharModalInfo();

    if (chatArea) {
        chatArea.style.display = "none";
    }

    if (chatSemSelecao) {
        chatSemSelecao.style.display = "flex";
    }

    if (chatContainer) {
        chatContainer.classList.remove("chat-aberto");
    }

    if (mensagens) {
        mensagens.replaceChildren();
    }

    document.querySelectorAll(".conversa-item").forEach(item => {
        item.classList.remove("ativa");
    });
}


/* =========================================================
   FORMATAR ÚLTIMA MENSAGEM
========================================================= */

function obterTextoUltimaMensagem(conversa) {

    const ultimaMensagem = conversa.ultima_mensagem;

    if (!ultimaMensagem) {
        return "Conversa iniciada";
    }

    if (typeof ultimaMensagem === "string") {
        return ultimaMensagem;
    }

    return ultimaMensagem.texto || "Conversa iniciada";
}


/* =========================================================
   ATUALIZAR UMA CONVERSA NA LISTA
========================================================= */

/*
 * Atualiza a prévia e o horário da conversa.
 * Em seguida, move o item para o topo da lista.
 *
 * A conversa não é recriada: isso preserva seus
 * elementos, eventos e estado visual.
 */

function atualizarConversaNaLista(
    negociacaoId,
    mensagem
) {

    if (!listaConversas || !mensagem) {
        return;
    }

    const id = Number(negociacaoId);

    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    const item = Array.from(
        listaConversas.querySelectorAll(".conversa-item")
    ).find(conversa => {
        return Number(conversa.dataset.negociacaoId) === id;
    });

    /*
     * Atualiza somente conversas que já existem
     * na lista carregada pela API.
     */

    if (!item) {
        return;
    }

    const preview = item.querySelector(".conversa-preview");
    const hora = item.querySelector(".conversa-hora");

    if (preview) {
        preview.textContent =
            typeof mensagem.texto === "string"
                ? mensagem.texto
                : "Conversa iniciada";
    }

    /*
     * Usa a data fornecida pelo servidor quando disponível.
     * Para mensagens provisórias, utiliza o horário atual.
     */

    const dataMensagem = mensagem.data_envio || new Date();

    if (hora) {
        hora.textContent = formatarHorarioMensagem(
            dataMensagem
        );
    }

    /*
     * Move a conversa para a primeira posição.
     */

    if (listaConversas.firstElementChild !== item) {
        listaConversas.prepend(item);
    }
}


/* =========================================================
   ATUALIZAR LISTA AO ENVIAR UMA MENSAGEM
========================================================= */

window.addEventListener("mensagemEnviadaChat", event => {

    const mensagem = event.detail;

    if (!mensagem) {
        return;
    }

    atualizarConversaNaLista(
        mensagem.negociacao_id,
        mensagem
    );

});


/* =========================================================
   ATUALIZAR LISTA AO RECEBER UMA MENSAGEM
========================================================= */

window.addEventListener("novaMensagemChat", event => {

    const notificacao = event.detail;

    if (!notificacao) {
        return;
    }

    atualizarConversaNaLista(
        notificacao.negociacao_id,
        notificacao
    );

});


/* =========================================================
   ATUALIZAR CONTADOR DE NÃO LIDAS
========================================================= */

function zerarContadorNaoLidas(negociacaoId) {

    const conversaSelecionada = document.querySelector(
        `.conversa-item[data-negociacao-id="${negociacaoId}"]`
    );

    if (!conversaSelecionada) {
        return;
    }

    const contador = conversaSelecionada.querySelector(
        ".conversa-nao-lidas"
    );

    if (contador) {
        contador.remove();
    }
}


/* =========================================================
   CRIAR ITEM DA CONVERSA
========================================================= */

function criarItemConversa(conversa) {

    const item = document.createElement("button");

    item.type = "button";
    item.className = "conversa-item";
    item.dataset.negociacaoId = conversa.negociacao_id;


    /* AVATAR */

    const avatar = document.createElement("div");
    avatar.className = "conversa-avatar";

    const foto = document.createElement("img");

    foto.alt = "";
    foto.src = conversa.foto_perfil || FOTO_GENERICA;

    foto.onerror = () => {
        foto.onerror = null;
        foto.src = FOTO_GENERICA;
    };

    avatar.appendChild(foto);


    /* INFORMAÇÕES */

    const conteudo = document.createElement("div");
    conteudo.className = "conversa-info";

    const cabecalho = document.createElement("div");
    cabecalho.className = "conversa-topo";

    const nome = document.createElement("span");
    nome.className = "conversa-nome";
    nome.textContent =
        conversa.negociante_nome ||
        conversa.nome ||
        "Usuário";

    const hora = document.createElement("span");
    hora.className = "conversa-hora";

    const ultimaMensagem = conversa.ultima_mensagem;

    if (
        ultimaMensagem &&
        typeof ultimaMensagem === "object" &&
        ultimaMensagem.data_envio
    ) {
        hora.textContent = formatarHorarioMensagem(
            ultimaMensagem.data_envio
        );
    }

    cabecalho.appendChild(nome);
    cabecalho.appendChild(hora);


    /* PRODUTO E ÚLTIMA MENSAGEM */

    const baixo = document.createElement("div");
    baixo.className = "conversa-baixo";

    const produto = document.createElement("span");
    produto.className = "conversa-produto";
    produto.textContent =
        conversa.produto_nome ||
        conversa.produto ||
        "Negociação";

    const preview = document.createElement("span");
    preview.className = "conversa-preview";
    preview.textContent = obterTextoUltimaMensagem(conversa);

    baixo.appendChild(produto);
    baixo.appendChild(preview);

    conteudo.appendChild(cabecalho);
    conteudo.appendChild(baixo);


    /* MONTAR ITEM */

    item.appendChild(avatar);
    item.appendChild(conteudo);


    /* CONTADOR */

    const naoLidas = Number(conversa.mensagens_nao_lidas || 0);

    if (naoLidas > 0) {

        const contador = document.createElement("span");

        contador.className = "conversa-nao-lidas";
        contador.textContent = String(naoLidas);

        contador.setAttribute(
            "aria-label",
            `${naoLidas} mensagens não lidas`
        );

        item.appendChild(contador);
    }


    /* ABRIR CONVERSA */

    item.addEventListener("click", async () => {

        try {

            await abrirConversa(conversa.negociacao_id);

        } catch (error) {

            console.error("Erro ao abrir conversa:", error);

            alert(
                error.message ||
                "Não foi possível abrir a conversa."
            );
        }
    });

    return item;
}


/* =========================================================
   CARREGAR CONVERSAS
========================================================= */

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

        return [];
    }

    /*
     * Ordena da mensagem mais recente para a mais antiga.
     *
     * Conversas sem mensagem ficam depois das que possuem
     * mensagens com data registrada.
     */

    conversas.sort((a, b) => {
        return obterDataUltimaMensagem(b) -
               obterDataUltimaMensagem(a);
    });

    conversas.forEach(conversa => {
        listaConversas.appendChild(criarItemConversa(conversa));
    });

    return conversas;
}


/* =========================================================
   ABRIR CONVERSA
========================================================= */

export async function abrirConversa(negociacaoId) {

    const id = Number(negociacaoId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Identificador de negociação inválido.");
    }

    // Confirma o acesso à negociação.
    await API.verificarAcessoNegociacao(id);

    setNegociacaoAtual(id);

    const detalhes = await API.buscarNegociacao(id);

    console.log("Detalhes da negociação:", detalhes);

    negociacaoDetalhesAtual = detalhes;

    setNegociacaoInfo(detalhes);


    /* ALTERNAR PARA A CONVERSA */

    if (chatSemSelecao) {
        chatSemSelecao.style.display = "none";
    }

    if (chatArea) {
        chatArea.style.display = "flex";
    }

    if (chatContainer) {
        chatContainer.classList.add("chat-aberto");
    }


    /* NOME E PRODUTO */

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


    /* FOTO DO PARTICIPANTE */

    if (chatFoto) {

        const conversaSelecionada = document.querySelector(
            `.conversa-item[data-negociacao-id="${id}"]`
        );

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


    /* CARREGAR MENSAGENS */

    if (mensagens) {
        mensagens.replaceChildren();
    }

    const listaMensagens = await API.buscarMensagens(id);

    if (Array.isArray(listaMensagens)) {
        renderizarMensagens(listaMensagens);
    }


    /* ZERAR CONTADOR VISUAL */

    zerarContadorNaoLidas(id);


    /* WEBSOCKET */

    conectarWebSocket(id);


    /* DESTACAR CONVERSA */

    document.querySelectorAll(".conversa-item").forEach(item => {

        const selecionada =
            Number(item.dataset.negociacaoId) === id;

        item.classList.toggle("ativa", selecionada);
    });

}
