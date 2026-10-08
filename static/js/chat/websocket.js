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

/*
   Local:
   ws://127.0.0.1:5500

   Produção:
   wss://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net
*/

const WEBSOCKET_URL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "ws://127.0.0.1:5500"
        : "wss://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net";


/* =========================================================
   WEBSOCKET GERAL DO USUÁRIO
========================================================= */

let socketGeral = null;


/* =========================================================
   CONTROLE DE RECONEXÃO DO WEBSOCKET GERAL
========================================================= */

let tentandoReconectarGeral = false;


/* =========================================================
   CONECTAR AO WEBSOCKET GERAL
========================================================= */

export function conectarWebSocketGeral() {

    console.log(
        "🔵 Tentando conectar ao WebSocket geral..."
    );


    /* ---------------------------------------------
       Evita criar outra conexão
    --------------------------------------------- */

    if (
        socketGeral &&
        (
            socketGeral.readyState ===
            WebSocket.OPEN
            ||
            socketGeral.readyState ===
            WebSocket.CONNECTING
        )
    ) {

        console.log(
            "🟢 WebSocket geral já está conectado ou conectando."
        );

        return;

    }


    /* ---------------------------------------------
       Cria nova conexão
    --------------------------------------------- */

    const url =
        `${WEBSOCKET_URL}/chat/ws`;


    console.log(
        "🔵 URL do WebSocket geral:",
        url
    );


    socketGeral =
        new WebSocket(url);


    /* ---------------------------------------------
       Quando conectar
    --------------------------------------------- */

    socketGeral.onopen = () => {

        console.log(
            "✅ WebSocket geral conectado!"
        );


        console.log(
            "✅ Estado:",
            socketGeral.readyState
        );


        /* ---------------------------------------------
           Informa que não está mais tentando reconectar
        --------------------------------------------- */

        tentandoReconectarGeral = false;

    };


    /* ---------------------------------------------
       Quando receber mensagem
    --------------------------------------------- */

    socketGeral.onmessage = event => {

        console.log(
            "🔔 NOTIFICAÇÃO RECEBIDA PELO WEBSOCKET GERAL:"
        );


        console.log(
            event.data
        );


        try {

            const notificacao =
                JSON.parse(event.data);


            console.log(
                "🔔 NOTIFICAÇÃO:",
                notificacao
            );


            /* ---------------------------------------------
            Nova mensagem recebida
            --------------------------------------------- */

            if (
                notificacao.tipo ===
                "nova_mensagem"
            ) {

                console.log(
                    "📩 NOVA MENSAGEM:"
                );


                console.log(
                    "Negociação:",
                    notificacao.negociacao_id
                );


                console.log(
                    "Remetente:",
                    notificacao.remetente_id
                );


                console.log(
                    "Texto:",
                    notificacao.texto
                );


                window.dispatchEvent(
                    new CustomEvent(
                        "novaMensagemChat",
                        {
                            detail: notificacao
                        }
                    )
                );

            }


            /* ---------------------------------------------
            Mensagens foram lidas
            --------------------------------------------- */

            if (
                notificacao.tipo ===
                "mensagens_lidas"
            ) {

                console.log(
                    "👀 MENSAGENS FORAM LIDAS:"
                );


                console.log(
                    "Negociação:",
                    notificacao.negociacao_id
                );


                console.log(
                    "Leitor:",
                    notificacao.leitor_id
                );


                console.log(
                    "Mensagens:",
                    notificacao.mensagem_ids
                );


                window.dispatchEvent(
                    new CustomEvent(
                        "mensagensLidasChat",
                        {
                            detail: notificacao
                        }
                    )
                );

            }

        } catch (error) {

            console.error(
                "❌ Erro ao interpretar notificação:",
                error
            );

        }

    };


    /* ---------------------------------------------
       Quando ocorrer erro
    --------------------------------------------- */

    socketGeral.onerror = error => {

        console.error(
            "❌ ERRO NO WEBSOCKET GERAL:"
        );


        console.error(
            error
        );

    };


    /* ---------------------------------------------
       Quando desconectar
    --------------------------------------------- */

    socketGeral.onclose = event => {

        console.log(
            "🔌 WebSocket geral desconectado."
        );


        console.log(
            "Código:",
            event.code
        );


        console.log(
            "Motivo:",
            event.reason
        );


        socketGeral = null;


        /* ---------------------------------------------
           Tenta reconectar
        --------------------------------------------- */

        reconectarWebSocketGeral();

    };

}


/* =========================================================
   RECONEXÃO DO WEBSOCKET GERAL
========================================================= */

function reconectarWebSocketGeral() {

    /* ---------------------------------------------
       Evita várias tentativas simultâneas
    --------------------------------------------- */

    if (tentandoReconectarGeral) {

        return;

    }


    tentandoReconectarGeral = true;


    console.log(
        "⏳ WebSocket geral será reconectado em 2 segundos..."
    );


    setTimeout(
        () => {

            tentandoReconectarGeral = false;


            console.log(
                "🔄 Tentando reconectar o WebSocket geral..."
            );


            conectarWebSocketGeral();

        },
        2000
    );

}


/* =========================================================
   CONECTAR AO WEBSOCKET DA CONVERSA
========================================================= */

export function conectarWebSocket(
    negociacaoId
) {

    console.log(
        "🔵 Tentando conectar ao WebSocket..."
    );


    console.log(
        "🔵 Negociação:",
        negociacaoId
    );


    /* ---------------------------------------------
       Fecha conexão anterior
    --------------------------------------------- */

    const socketAnterior =
        getSocket();


    if (socketAnterior) {

        console.log(
            "🟡 Fechando WebSocket anterior..."
        );


        socketAnterior.close();


        setSocket(null);

    }


    /* ---------------------------------------------
       Cria nova conexão
    --------------------------------------------- */

    const url =
        `${WEBSOCKET_URL}/chat/ws/${negociacaoId}`;


    console.log(
        "🔵 URL do WebSocket:",
        url
    );


    const socket =
        new WebSocket(url);


    setSocket(socket);


    /* ---------------------------------------------
       Quando conectar
    --------------------------------------------- */

    socket.onopen = () => {

        console.log(
            "✅ WebSocket conectado!"
        );


        console.log(
            "✅ Negociação:",
            negociacaoId
        );


        console.log(
            "✅ Estado:",
            socket.readyState
        );

    };


    /* ---------------------------------------------
       Quando receber mensagem
    --------------------------------------------- */

    socket.onmessage = event => {

        console.log(
            "📩 Mensagem recebida pelo WebSocket:"
        );


        console.log(
            event.data
        );


        try {

            const mensagem =
                JSON.parse(event.data);


            console.log(
                "📩 MENSAGEM RECEBIDA:",
                mensagem
            );


            /* ---------------------------------------------
               Confirmação da mensagem enviada
            --------------------------------------------- */

            if (
                mensagem.tipo ===
                "confirmacao_mensagem"
            ) {

                console.log(
                    "✅ CONFIRMAÇÃO DA MENSAGEM RECEBIDA:"
                );


                console.log(
                    mensagem
                );


                window.dispatchEvent(
                    new CustomEvent(
                        "mensagemConfirmadaChat",
                        {
                            detail: mensagem
                        }
                    )
                );


                return;

            }


            /* ---------------------------------------------
               Mensagem recebida do outro usuário
            --------------------------------------------- */

            adicionarMensagemNaTela(
                mensagem,
                false
            );


        } catch (error) {

            console.error(
                "❌ Erro ao interpretar mensagem:",
                error
            );

        }

    };


    /* ---------------------------------------------
       Quando ocorrer erro
    --------------------------------------------- */

    socket.onerror = error => {

        console.error(
            "❌ ERRO NO WEBSOCKET:"
        );


        console.error(
            error
        );

    };


    /* ---------------------------------------------
       Quando desconectar
    --------------------------------------------- */

    socket.onclose = event => {

        console.log(
            "🔌 WebSocket desconectado."
        );


        console.log(
            "Código:",
            event.code
        );


        console.log(
            "Motivo:",
            event.reason
        );


        /*
           Só reconecta se esta ainda for
           a conexão atualmente utilizada.
        */

        if (
            getSocket() === socket
        ) {

            setSocket(null);


            reconectarWebSocket(
                negociacaoId
            );

        }

    };

}


/* =========================================================
   CONTROLE DE RECONEXÃO DA CONVERSA
========================================================= */

let tentandoReconectarChat = false;

let negociacaoParaReconectar = null;


/* =========================================================
   RECONEXÃO DO WEBSOCKET DA CONVERSA
========================================================= */

function reconectarWebSocket(
    negociacaoId
) {

    /*
       Guarda a negociação que deverá
       ser reconectada.
    */

    negociacaoParaReconectar =
        negociacaoId;


    /* ---------------------------------------------
       Evita várias tentativas simultâneas
    --------------------------------------------- */

    if (tentandoReconectarChat) {

        return;

    }


    tentandoReconectarChat = true;


    console.log(
        "⏳ WebSocket da conversa será reconectado em 2 segundos..."
    );


    setTimeout(
        () => {

            tentandoReconectarChat = false;


            /*
               Verifica se ainda existe uma negociação
               para reconectar.
            */

            if (
                !negociacaoParaReconectar
            ) {

                return;

            }


            const negociacaoAtual =
                negociacaoParaReconectar;


            console.log(
                "🔄 Tentando reconectar o WebSocket da conversa..."
            );


            conectarWebSocket(
                negociacaoAtual
            );

        },
        2000
    );

}