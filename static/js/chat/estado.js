/* =========================================================
   ESTADO DO CHAT
========================================================= */

let negociacaoAtual = null;

let negociacaoInfo = null;

let socket = null;


/* =========================================================
   NEGOCIAÇÃO ATUAL
========================================================= */

export function getNegociacaoAtual() {

    return negociacaoAtual;

}


export function setNegociacaoAtual(
    negociacaoId
) {

    negociacaoAtual =
        negociacaoId;

}


/* =========================================================
   INFORMAÇÕES DA NEGOCIAÇÃO
========================================================= */

export function getNegociacaoInfo() {

    return negociacaoInfo;

}


export function setNegociacaoInfo(
    dados
) {

    negociacaoInfo =
        dados;

}


/* =========================================================
   WEBSOCKET
========================================================= */

export function getSocket() {

    return socket;

}


export function setSocket(
    novoSocket
) {

    socket =
        novoSocket;

}
