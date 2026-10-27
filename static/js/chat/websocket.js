import { getSocket, setSocket } from "./estado.js";
import { adicionarMensagemNaTela } from "./mensagens.js";

const WEBSOCKET_URL = CONFIG.API_URL
    .replace(/^http/, "ws")
    .replace(/\/+$/, "");

const TEMPO_RECONEXAO_INICIAL = 2000;
const TEMPO_RECONEXAO_MAXIMO = 15000;

function obterTokenAutenticacao() {
    let token = localStorage.getItem("access_token");
    if (token) return token;

    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
}

let socketGeral = null;
let timerReconexaoGeral = null;
let tentativasReconexaoGeral = 0;
let callbacksGerais = {};

export function conectarWebSocketGeral(callbacks = {}) {
    callbacksGerais = callbacks;

    if (
        socketGeral &&
        (socketGeral.readyState === WebSocket.OPEN ||
            socketGeral.readyState === WebSocket.CONNECTING)
    ) {
        return;
    }

    if (timerReconexaoGeral !== null) {
        clearTimeout(timerReconexaoGeral);
        timerReconexaoGeral = null;
    }

    const token = obterTokenAutenticacao();
    const url = `${WEBSOCKET_URL}/chat/ws?token=${encodeURIComponent(token)}`;

    let socket;

    try {
        socket = new WebSocket(url);
    } catch {
        agendarReconexaoGeral();
        return;
    }

    socketGeral = socket;

    socket.onopen = () => {
        if (socketGeral !== socket) return;

        tentativasReconexaoGeral = 0;

        if (timerReconexaoGeral !== null) {
            clearTimeout(timerReconexaoGeral);
            timerReconexaoGeral = null;
        }
    };

    socket.onmessage = event => {
        if (socketGeral !== socket) return;

        let notificacao;

        try {
            notificacao = JSON.parse(event.data);
        } catch {
            return;
        }

        if (notificacao.tipo === "nova_mensagem") {
            callbacksGerais.onNovaMensagem?.(notificacao);
        }

        if (notificacao.tipo === "mensagens_lidas") {
            callbacksGerais.onMensagensLidas?.(notificacao);
        }
    };

    socket.onerror = () => {};

    socket.onclose = () => {
        if (socketGeral !== socket) return;

        socketGeral = null;
        agendarReconexaoGeral();
    };
}

function agendarReconexaoGeral() {
    if (timerReconexaoGeral !== null) return;

    const atraso = Math.min(
        TEMPO_RECONEXAO_INICIAL * (2 ** tentativasReconexaoGeral),
        TEMPO_RECONEXAO_MAXIMO
    );

    tentativasReconexaoGeral++;

    timerReconexaoGeral = setTimeout(() => {
        timerReconexaoGeral = null;

        if (
            socketGeral &&
            (socketGeral.readyState === WebSocket.OPEN ||
                socketGeral.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        conectarWebSocketGeral(callbacksGerais);
    }, atraso);
}

let negociacaoAtiva = null;
let timerReconexaoChat = null;
let tentativasReconexaoChat = 0;
let callbacksChatAtivo = {};

export function conectarWebSocket(negociacaoId, callbacks = {}) {
    if (
        negociacaoId === null ||
        negociacaoId === undefined ||
        String(negociacaoId).trim() === ""
    ) {
        return;
    }

    callbacksChatAtivo = callbacks;
    const id = String(negociacaoId);
    const socketAnterior = getSocket();

    if (
        socketAnterior &&
        negociacaoAtiva === id &&
        (socketAnterior.readyState === WebSocket.OPEN ||
            socketAnterior.readyState === WebSocket.CONNECTING)
    ) {
        return;
    }

    negociacaoAtiva = id;

    if (timerReconexaoChat !== null) {
        clearTimeout(timerReconexaoChat);
        timerReconexaoChat = null;
    }

    if (socketAnterior) {
        setSocket(null);
        socketAnterior.close();
    }

    const token = obterTokenAutenticacao();
    const url = `${WEBSOCKET_URL}/chat/ws/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`;

    let socket;

    try {
        socket = new WebSocket(url);
    } catch {
        agendarReconexaoChat(id);
        return;
    }

    setSocket(socket);

    socket.onopen = () => {
        if (getSocket() !== socket || negociacaoAtiva !== id) {
            socket.close();
            return;
        }

        tentativasReconexaoChat = 0;

        if (timerReconexaoChat !== null) {
            clearTimeout(timerReconexaoChat);
            timerReconexaoChat = null;
        }
    };

    socket.onmessage = event => {
        if (getSocket() !== socket || negociacaoAtiva !== id) return;

        let mensagem;

        try {
            mensagem = JSON.parse(event.data);
        } catch {
            return;
        }

        if (mensagem.tipo === "confirmacao_mensagem") {
            callbacksChatAtivo.onMensagemConfirmada?.(mensagem);
            return;
        }

        adicionarMensagemNaTela(mensagem, false);
    };

    socket.onerror = () => {};

    socket.onclose = () => {
        if (getSocket() !== socket || negociacaoAtiva !== id) return;

        setSocket(null);
        agendarReconexaoChat(id);
    };
}

function agendarReconexaoChat(negociacaoId) {
    if (negociacaoAtiva !== String(negociacaoId)) return;
    if (timerReconexaoChat !== null) return;

    const atraso = Math.min(
        TEMPO_RECONEXAO_INICIAL * (2 ** tentativasReconexaoChat),
        TEMPO_RECONEXAO_MAXIMO
    );

    tentativasReconexaoChat++;

    timerReconexaoChat = setTimeout(() => {
        timerReconexaoChat = null;

        if (negociacaoAtiva !== String(negociacaoId)) return;

        const socketAtual = getSocket();

        if (
            socketAtual &&
            (socketAtual.readyState === WebSocket.OPEN ||
                socketAtual.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        conectarWebSocket(negociacaoId, callbacksChatAtivo);
    }, atraso);
}



export function desconectarWebSockets() {
    // Cancela a reconexão do WebSocket geral.
    if (timerReconexaoGeral !== null) {
        clearTimeout(timerReconexaoGeral);
        timerReconexaoGeral = null;
    }

    // Cancela a reconexão do chat da negociação.
    if (timerReconexaoChat !== null) {
        clearTimeout(timerReconexaoChat);
        timerReconexaoChat = null;
    }

    // Impede novas reconexões e descarta callbacks antigos.
    callbacksGerais = {};
    callbacksChatAtivo = {};
    negociacaoAtiva = null;

    tentativasReconexaoGeral = 0;
    tentativasReconexaoChat = 0;

    // Remove as referências antes de fechar os sockets.
    // Assim, os eventos onclose antigos não agendam reconexões.
    const socketGeralAnterior = socketGeral;
    const socketChatAnterior = getSocket();

    socketGeral = null;
    setSocket(null);

    // Encerra as conexões ativas.
    if (
        socketGeralAnterior &&
        socketGeralAnterior.readyState !== WebSocket.CLOSED
    ) {
        socketGeralAnterior.close(1000, "Logout");
    }

    if (
        socketChatAnterior &&
        socketChatAnterior.readyState !== WebSocket.CLOSED
    ) {
        socketChatAnterior.close(1000, "Logout");
    }
}


window.desconectarWebSockets = desconectarWebSockets;