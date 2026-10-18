import {
    getSocket,
    setSocket
} from "./estado.js";

import {
    adicionarMensagemNaTela
} from "./mensagens.js";

/* =========================================================
   CONFIGURAÇÃO DO WEBSOCKET
========================================================= */

// Mantém o backend definido em config.js.
// http  -> ws
// https -> wss

const WEBSOCKET_URL = CONFIG.API_URL
    .replace(/^http/, "ws")
    .replace(/\/+$/, "");

// Intervalos de reconexão.
const TEMPO_RECONEXAO_INICIAL = 2000;
const TEMPO_RECONEXAO_MAXIMO = 15000;

/**
 * Função utilitária para capturar o token de acesso e isolar sessões
 * no mesmo navegador (suporta localStorage ou cookies de leitura em JS).
 */
function obterTokenAutenticacao() {
    // 1. Tenta pegar do localStorage (se o seu projeto salvar lá)
    let token = localStorage.getItem("access_token");

    if (token) return token;

    // 2. Fallback: Tenta ler direto dos cookies caso estejam disponíveis para o JS
    const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
    if (match) return match[2];

    return "";
}

/* =========================================================
   WEBSOCKET GERAL DO USUÁRIO
========================================================= */

let socketGeral = null;
let timerReconexaoGeral = null;
let tentativasReconexaoGeral = 0;

/* =========================================================
   CONECTAR AO WEBSOCKET GERAL
========================================================= */

export function conectarWebSocketGeral() {
    console.log("🔵 Tentando conectar ao WebSocket geral...");

    // Não cria outra conexão se já houver uma ativa
    // ou em processo de conexão.
    if (
        socketGeral &&
        (
            socketGeral.readyState === WebSocket.OPEN ||
            socketGeral.readyState === WebSocket.CONNECTING
        )
    ) {
        console.log(
            "🟢 WebSocket geral já está conectado ou conectando."
        );
        return;
    }

    // Impede que um temporizador antigo abra outra conexão.
    if (timerReconexaoGeral !== null) {
        clearTimeout(timerReconexaoGeral);
        timerReconexaoGeral = null;
    }

    const token = obterTokenAutenticacao();
    const url = `${WEBSOCKET_URL}/chat/ws?token=${encodeURIComponent(token)}`;

    console.log("🔵 URL do WebSocket geral:", url);

    let socket;

    try {
        socket = new WebSocket(url);
    } catch (error) {
        console.error(
            "❌ Não foi possível criar o WebSocket geral:",
            error
        );

        agendarReconexaoGeral();
        return;
    }

    socketGeral = socket;

    /* -----------------------------------------------------
       CONEXÃO ESTABELECIDA
    ----------------------------------------------------- */

    socket.onopen = () => {
        // Ignora eventos de conexões antigas.
        if (socketGeral !== socket) {
            return;
        }

        console.log("✅ WebSocket geral conectado!");

        tentativasReconexaoGeral = 0;

        if (timerReconexaoGeral !== null) {
            clearTimeout(timerReconexaoGeral);
            timerReconexaoGeral = null;
        }
    };

    /* -----------------------------------------------------
       MENSAGENS RECEBIDAS
    ----------------------------------------------------- */

    socket.onmessage = event => {
        if (socketGeral !== socket) {
            return;
        }

        console.log(
            "🔔 NOTIFICAÇÃO RECEBIDA PELO WEBSOCKET GERAL:",
            event.data
        );

        let notificacao;

        try {
            notificacao = JSON.parse(event.data);
        } catch (error) {
            console.error(
                "❌ Erro ao interpretar notificação:",
                error
            );
            return;
        }

        // Nova mensagem recebida.
        if (notificacao.tipo === "nova_mensagem") {
            console.log(
                "📩 Nova mensagem na negociação:",
                notificacao.negociacao_id
            );

            window.dispatchEvent(
                new CustomEvent("novaMensagemChat", {
                    detail: notificacao
                })
            );
        }

        // Mensagens marcadas como lidas.
        if (notificacao.tipo === "mensagens_lidas") {
            console.log(
                "👀 Mensagens lidas na negociação:",
                notificacao.negociacao_id
            );

            window.dispatchEvent(
                new CustomEvent("mensagensLidasChat", {
                    detail: notificacao
                })
            );
        }
    };

    /* -----------------------------------------------------
       ERRO
    ----------------------------------------------------- */

    socket.onerror = error => {
        if (socketGeral !== socket) {
            return;
        }

        console.error("❌ ERRO NO WEBSOCKET GERAL:", error);
    };

    /* -----------------------------------------------------
       DESCONEXÃO
    ----------------------------------------------------- */

    socket.onclose = event => {
        console.warn(
            "🔌 WebSocket geral desconectado.",
            "Código:",
            event.code,
            "Motivo:",
            event.reason || "(não informado)"
        );

        // Uma conexão antiga não pode modificar
        // o estado da conexão atual.
        if (socketGeral !== socket) {
            return;
        }

        socketGeral = null;

        agendarReconexaoGeral();
    };
}

/* =========================================================
   AGENDAR RECONEXÃO DO WEBSOCKET GERAL
========================================================= */

function agendarReconexaoGeral() {
    // Impede múltiplos temporizadores simultâneos.
    if (timerReconexaoGeral !== null) {
        return;
    }

    const atraso = Math.min(
        TEMPO_RECONEXAO_INICIAL *
            (2 ** tentativasReconexaoGeral),
        TEMPO_RECONEXAO_MAXIMO
    );

    tentativasReconexaoGeral++;

    console.log(
        `⏳ WebSocket geral: nova tentativa em ${atraso / 1000}s.`
    );

    timerReconexaoGeral = setTimeout(() => {
        timerReconexaoGeral = null;

        // Se outra conexão já estiver ativa, não abre outra.
        if (
            socketGeral &&
            (
                socketGeral.readyState === WebSocket.OPEN ||
                socketGeral.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        console.log(
            "🔄 Tentando reconectar o WebSocket geral..."
        );

        conectarWebSocketGeral();
    }, atraso);
}

/* =========================================================
   WEBSOCKET DA CONVERSA
========================================================= */

let negociacaoAtiva = null;
let timerReconexaoChat = null;
let tentativasReconexaoChat = 0;

/* =========================================================
   CONECTAR AO WEBSOCKET DA CONVERSA
========================================================= */

export function conectarWebSocket(negociacaoId) {
    if (
        negociacaoId === null ||
        negociacaoId === undefined ||
        String(negociacaoId).trim() === ""
    ) {
        console.error(
            "❌ ID da negociação inválido:",
            negociacaoId
        );
        return;
    }

    const id = String(negociacaoId);

    console.log(
        "🔵 Tentando conectar ao WebSocket da negociação:",
        id
    );

    const socketAnterior = getSocket();

    // Se já estamos conectados ou conectando à mesma
    // negociação, não cria uma conexão duplicada.
    if (
        socketAnterior &&
        negociacaoAtiva === id &&
        (
            socketAnterior.readyState === WebSocket.OPEN ||
            socketAnterior.readyState === WebSocket.CONNECTING
        )
    ) {
        console.log(
            "🟢 WebSocket desta negociação já está conectado ou conectando."
        );
        return;
    }

    // A negociação solicitada passa a ser a atual.
    negociacaoAtiva = id;

    // Cancela a tentativa de reconexão da conversa anterior.
    if (timerReconexaoChat !== null) {
        clearTimeout(timerReconexaoChat);
        timerReconexaoChat = null;
    }

    // Retira a conexão anterior do estado ANTES de fechá-la.
    // Assim, o evento onclose antigo não inicia uma reconexão
    // para a negociação que acabou de ser abandonada.
    if (socketAnterior) {
        setSocket(null);

        console.log(
            "🟡 Fechando WebSocket da conversa anterior."
        );

        socketAnterior.close();
    }

    const token = obterTokenAutenticacao();
    const url = `${WEBSOCKET_URL}/chat/ws/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`;

    console.log("🔵 URL do WebSocket:", url);

    let socket;

    try {
        socket = new WebSocket(url);
    } catch (error) {
        console.error(
            "❌ Não foi possível criar o WebSocket da conversa:",
            error
        );

        agendarReconexaoChat(id);
        return;
    }

    setSocket(socket);

    /* -----------------------------------------------------
       CONEXÃO ESTABELECIDA
    ----------------------------------------------------- */

    socket.onopen = () => {
        // Ignora conexões que já não representam a conversa atual.
        if (
            getSocket() !== socket ||
            negociacaoAtiva !== id
        ) {
            socket.close();
            return;
        }

        console.log(
            "✅ WebSocket da conversa conectado!",
            "Negociação:",
            id
        );

        tentativasReconexaoChat = 0;

        if (timerReconexaoChat !== null) {
            clearTimeout(timerReconexaoChat);
            timerReconexaoChat = null;
        }
    };

    /* -----------------------------------------------------
       MENSAGENS RECEBIDAS
    ----------------------------------------------------- */

    socket.onmessage = event => {
        if (
            getSocket() !== socket ||
            negociacaoAtiva !== id
        ) {
            return;
        }

        console.log(
            "📩 Mensagem recebida pelo WebSocket:",
            event.data
        );

        let mensagem;

        try {
            mensagem = JSON.parse(event.data);
        } catch (error) {
            console.error(
                "❌ Erro ao interpretar mensagem:",
                error
            );
            return;
        }

        // Confirmação de mensagem enviada.
        if (mensagem.tipo === "confirmacao_mensagem") {
            window.dispatchEvent(
                new CustomEvent("mensagemConfirmadaChat", {
                    detail: mensagem
                })
            );

            return;
        }

        // Mensagem recebida do outro participante.
        adicionarMensagemNaTela(mensagem, false);
    };

    /* -----------------------------------------------------
       ERRO
    ----------------------------------------------------- */

    socket.onerror = error => {
        if (getSocket() !== socket) {
            return;
        }

        console.error(
            "❌ ERRO NO WEBSOCKET DA CONVERSA:",
            error
        );
    };

    /* -----------------------------------------------------
       DESCONEXÃO
    ----------------------------------------------------- */

    socket.onclose = event => {
        console.warn(
            "🔌 WebSocket da conversa desconectado.",
            "Negociação:",
            id,
            "Código:",
            event.code,
            "Motivo:",
            event.reason || "(não informado)"
        );

        // Não permite que uma conexão antiga altere
        // o estado ou reconecte uma conversa anterior.
        if (
            getSocket() !== socket ||
            negociacaoAtiva !== id
        ) {
            return;
        }

        setSocket(null);

        agendarReconexaoChat(id);
    };
}

/* =========================================================
   AGENDAR RECONEXÃO DO WEBSOCKET DA CONVERSA
========================================================= */

function agendarReconexaoChat(negociacaoId) {
    // Não reconecta conversas que deixaram de ser a atual.
    if (negociacaoAtiva !== String(negociacaoId)) {
        return;
    }

    // Mantém no máximo um temporizador ativo.
    if (timerReconexaoChat !== null) {
        return;
    }

    const atraso = Math.min(
        TEMPO_RECONEXAO_INICIAL *
            (2 ** tentativasReconexaoChat),
        TEMPO_RECONEXAO_MAXIMO
    );

    tentativasReconexaoChat++;

    console.log(
        `⏳ WebSocket da conversa: nova tentativa em ${atraso / 1000}s.`,
        "Negociação:",
        negociacaoId
    );

    timerReconexaoChat = setTimeout(() => {
        timerReconexaoChat = null;

        // O usuário pode ter aberto outra conversa durante a espera.
        if (
            negociacaoAtiva !== String(negociacaoId)
        ) {
            return;
        }

        const socketAtual = getSocket();

        // Não cria outra conexão se já houver uma válida
        // ou uma tentativa de conexão em andamento.
        if (
            socketAtual &&
            (
                socketAtual.readyState === WebSocket.OPEN ||
                socketAtual.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        console.log(
            "🔄 Tentando reconectar a conversa:",
            negociacaoId
        );

        conectarWebSocket(negociacaoId);
    }, atraso);
}