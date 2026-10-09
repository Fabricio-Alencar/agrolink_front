import {
    getNegociacaoAtual,
    getSocket
} from "./estado.js";

import {
    obterHoraAtual,
    formatarHora
} from "./utils.js";


/* =========================================================
   ELEMENTOS
========================================================= */

const mensagensContainer =
    document.getElementById("mensagens");

const mensagemInput =
    document.getElementById("mensagemInput");

const chatForm =
    document.getElementById("chatForm");

const usuarioLogadoId =
    Number(Auth.getId());


/* =========================================================
   CRIAR ÍCONE LUCIDE DO STATUS
========================================================= */

function criarIconeStatus(lida = false) {

    const status = document.createElement("span");

    status.classList.add(
        "mensagem-status",
        lida ? "visualizado" : "enviada"
    );

    status.setAttribute(
        "aria-label",
        lida
            ? "Mensagem visualizada"
            : "Mensagem enviada"
    );

    status.title = lida
        ? "Visualizada"
        : "Enviada";

    const icone = document.createElement("i");

    icone.setAttribute(
        "data-lucide",
        lida ? "check-check" : "check"
    );

    icone.setAttribute("aria-hidden", "true");

    status.appendChild(icone);

    /*
     * Converte o ícone Lucide dentro do elemento.
     * O SVG gerado herda a cor definida no CSS.
     */

    if (window.lucide) {

        window.lucide.createIcons({
            root: status
        });

    }

    return status;
}


/* =========================================================
   ATUALIZAR ÍCONE DO STATUS
========================================================= */

function atualizarStatusMensagem(
    elementoStatus,
    lida = false
) {

    if (!elementoStatus) {
        return;
    }

    const novoStatus = criarIconeStatus(lida);

    elementoStatus.replaceWith(novoStatus);
}


/* =========================================================
   ADICIONAR MENSAGEM NA TELA
========================================================= */

export function adicionarMensagemNaTela(
    mensagem,
    enviada = true
) {

    const texto =
        typeof mensagem === "object"
            ? mensagem.texto
            : mensagem;


    /*
     * Remove o estado de conversa vazia
     * quando uma mensagem é adicionada.
     */

    const mensagemVazia =
        mensagensContainer.querySelector(
            ".chat-vazio"
        );

    if (mensagemVazia) {
        mensagemVazia.remove();
    }


    const elementoMensagem =
        document.createElement("div");

    elementoMensagem.classList.add("mensagem");


    /*
     * Guarda o ID da mensagem no elemento.
     */

    if (
        typeof mensagem === "object" &&
        mensagem.id
    ) {

        elementoMensagem.dataset.mensagemId =
            mensagem.id;

    }


    if (enviada) {

        elementoMensagem.classList.add(
            "mensagem-enviada"
        );

    } else {

        elementoMensagem.classList.add(
            "mensagem-recebida"
        );

    }


    const hora =
        typeof mensagem === "object" &&
        mensagem.data_envio
            ? formatarHora(mensagem.data_envio)
            : obterHoraAtual();


    /* ---------------------------------------------
       CONTEÚDO DA MENSAGEM
    --------------------------------------------- */

    const elementoConteudo =
        document.createElement("div");

    elementoConteudo.classList.add(
        "mensagem-conteudo"
    );


    /* ---------------------------------------------
       TEXTO DA MENSAGEM
    --------------------------------------------- */

    const elementoTexto =
        document.createElement("p");

    /*
     * O conteúdo é tratado como texto para impedir
     * que HTML ou JavaScript enviados pelo usuário
     * sejam executados.
     */

    elementoTexto.textContent = texto;


    /* ---------------------------------------------
       HORÁRIO DA MENSAGEM
    --------------------------------------------- */

    const elementoHora =
        document.createElement("span");

    elementoHora.classList.add("mensagem-hora");

    elementoHora.appendChild(
        document.createTextNode(hora)
    );


    /* ---------------------------------------------
       INDICADOR DA MENSAGEM ENVIADA
    --------------------------------------------- */

    if (enviada) {

        const elementoStatus =
            criarIconeStatus(false);

        elementoHora.appendChild(
            elementoStatus
        );

    }


    /* ---------------------------------------------
       MONTAR A MENSAGEM
    --------------------------------------------- */

    elementoConteudo.appendChild(
        elementoTexto
    );

    elementoConteudo.appendChild(
        elementoHora
    );

    elementoMensagem.appendChild(
        elementoConteudo
    );

    mensagensContainer.appendChild(
        elementoMensagem
    );

    mensagensContainer.scrollTop =
        mensagensContainer.scrollHeight;

}


/* =========================================================
   RENDERIZAR MENSAGENS
========================================================= */

export function renderizarMensagens(
    listaMensagens
) {

    /*
     * Limpa completamente o conteúdo anterior.
     */

    mensagensContainer.replaceChildren();


    /* ---------------------------------------------
       CONVERSA SEM MENSAGENS
    --------------------------------------------- */

    if (
        !listaMensagens ||
        listaMensagens.length === 0
    ) {

        mensagensContainer.innerHTML = `

            <div class="chat-vazio">

                <div class="chat-vazio-conteudo">

                    <div class="chat-vazio-icone">
                        <i data-lucide="message-circle"></i>
                    </div>

                    <h3>
                        Nenhuma mensagem ainda
                    </h3>

                    <p>
                        Envie uma mensagem para iniciar
                        esta conversa.
                    </p>

                </div>

            </div>

        `;

        /*
         * Atualiza o ícone da conversa vazia.
         */

        if (window.lucide) {

            window.lucide.createIcons();

        }

        return;

    }


    /* ---------------------------------------------
       EXISTEM MENSAGENS
    --------------------------------------------- */

    listaMensagens.forEach(mensagem => {

        const elementoMensagem =
            document.createElement("div");

        elementoMensagem.classList.add("mensagem");


        /*
         * Guarda o ID da mensagem.
         */

        elementoMensagem.dataset.mensagemId =
            mensagem.id;


        const enviada =
            Number(mensagem.remetente_id) ===
            usuarioLogadoId;


        if (enviada) {

            elementoMensagem.classList.add(
                "mensagem-enviada"
            );

        } else {

            elementoMensagem.classList.add(
                "mensagem-recebida"
            );

        }


        const hora =
            formatarHora(mensagem.data_envio);


        /* ---------------------------------------------
           CRIAR CONTEÚDO
        --------------------------------------------- */

        const elementoConteudo =
            document.createElement("div");

        elementoConteudo.classList.add(
            "mensagem-conteudo"
        );


        /* ---------------------------------------------
           TEXTO
        --------------------------------------------- */

        const elementoTexto =
            document.createElement("p");

        elementoTexto.textContent =
            mensagem.texto;


        /* ---------------------------------------------
           HORÁRIO
        --------------------------------------------- */

        const elementoHora =
            document.createElement("span");

        elementoHora.classList.add(
            "mensagem-hora"
        );

        elementoHora.appendChild(
            document.createTextNode(hora)
        );


        /* ---------------------------------------------
           INDICADOR DE LEITURA
        --------------------------------------------- */

        if (enviada) {

            const elementoStatus =
                criarIconeStatus(
                    Boolean(mensagem.lida)
                );

            elementoHora.appendChild(
                elementoStatus
            );

        }


        /* ---------------------------------------------
           MONTAR MENSAGEM
        --------------------------------------------- */

        elementoConteudo.appendChild(
            elementoTexto
        );

        elementoConteudo.appendChild(
            elementoHora
        );

        elementoMensagem.appendChild(
            elementoConteudo
        );

        mensagensContainer.appendChild(
            elementoMensagem
        );

    });


    /*
     * Mantém a rolagem no final da conversa.
     */

    mensagensContainer.scrollTop =
        mensagensContainer.scrollHeight;

}


/* =========================================================
   ATUALIZAR MENSAGEM ENVIADA COM DADOS REAIS
========================================================= */

window.addEventListener(
    "mensagemConfirmadaChat",
    event => {

        const mensagem = event.detail;

        console.log(
            "🔄 ATUALIZANDO MENSAGEM PROVISÓRIA:"
        );

        console.log(mensagem);


        /*
         * Busca as mensagens enviadas.
         * A mensagem provisória ainda não possui
         * o ID retornado pelo banco.
         */

        const mensagensEnviadas =
            mensagensContainer.querySelectorAll(
                ".mensagem-enviada"
            );


        if (mensagensEnviadas.length === 0) {

            console.warn(
                "⚠️ Nenhuma mensagem provisória encontrada."
            );

            return;

        }


        const mensagemProvisoria =
            mensagensEnviadas[
                mensagensEnviadas.length - 1
            ];


        /* ---------------------------------------------
           ADICIONAR ID REAL DO BANCO
        --------------------------------------------- */

        mensagemProvisoria.dataset.mensagemId =
            mensagem.id;


        /* ---------------------------------------------
           ATUALIZAR HORÁRIO E STATUS
        --------------------------------------------- */

        const elementoHora =
            mensagemProvisoria.querySelector(
                ".mensagem-hora"
            );

        if (elementoHora) {

            elementoHora.replaceChildren();

            elementoHora.appendChild(
                document.createTextNode(
                    formatarHora(mensagem.data_envio)
                )
            );

            elementoHora.appendChild(
                criarIconeStatus(
                    Boolean(mensagem.lida)
                )
            );

        }


        console.log(
            "✅ MENSAGEM ATUALIZADA COM DADOS DO BANCO:",
            mensagem.id
        );

    }
);


/* =========================================================
   ATUALIZAR STATUS DE LEITURA
========================================================= */

window.addEventListener(
    "mensagensLidasChat",
    event => {

        const notificacao = event.detail;

        const negociacaoAtual =
            getNegociacaoAtual();


        /* ---------------------------------------------
           VERIFICAR CONVERSA ATUAL
        --------------------------------------------- */

        if (
            Number(negociacaoAtual) !==
            Number(notificacao.negociacao_id)
        ) {

            return;

        }


        /* ---------------------------------------------
           IDs DAS MENSAGENS LIDAS
        --------------------------------------------- */

        const mensagensLidas =
            notificacao.mensagem_ids || [];


        /* ---------------------------------------------
           ATUALIZAR SOMENTE AS MENSAGENS LIDAS
        --------------------------------------------- */

        mensagensLidas.forEach(mensagemId => {

            const mensagem =
                mensagensContainer.querySelector(
                    `[data-mensagem-id="${mensagemId}"]`
                );


            if (!mensagem) {
                return;
            }


            /*
             * Atualiza somente mensagens enviadas
             * pelo usuário atual.
             */

            if (
                !mensagem.classList.contains(
                    "mensagem-enviada"
                )
            ) {

                return;

            }


            const status =
                mensagem.querySelector(
                    ".mensagem-status"
                );


            if (status) {

                atualizarStatusMensagem(
                    status,
                    true
                );

            }

        });


        console.log(
            "✅ Mensagens lidas atualizadas:",
            mensagensLidas
        );

    }
);


/* =========================================================
   ENVIAR MENSAGEM
========================================================= */

chatForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const texto =
            mensagemInput.value.trim();


        if (!texto) {
            return;
        }


        const negociacaoAtual =
            getNegociacaoAtual();


        if (!negociacaoAtual) {

            console.warn(
                "⚠️ Nenhuma negociação selecionada."
            );

            return;

        }


        const socket =
            getSocket();


        console.log(
            "🟣 Tentando enviar mensagem..."
        );

        console.log(
            "🟣 Mensagem:",
            texto
        );

        console.log(
            "🟣 Negociação:",
            negociacaoAtual
        );

        console.log(
            "🟣 Socket:",
            socket
        );

        console.log(
            "🟣 Estado do socket:",
            socket
                ? socket.readyState
                : "null"
        );


        if (
            !socket ||
            socket.readyState !== WebSocket.OPEN
        ) {

            console.warn(
                "⚠️ WebSocket ainda não está conectado."
            );

            return;

        }


        console.log(
            "📤 Enviando mensagem pelo WebSocket..."
        );


        socket.send(texto);


        console.log(
            "✅ Mensagem enviada para o WebSocket."
        );


        /* ---------------------------------------------
           ADICIONAR MENSAGEM ENVIADA AO CHAT
        --------------------------------------------- */

        adicionarMensagemNaTela(
            texto,
            true
        );


        /* ---------------------------------------------
           ATUALIZAR ÚLTIMA MENSAGEM NA LISTA
        --------------------------------------------- */

        window.dispatchEvent(
            new CustomEvent(
                "mensagemEnviadaChat",
                {
                    detail: {
                        negociacao_id:
                            negociacaoAtual,

                        texto:
                            texto
                    }
                }
            )
        );


        mensagemInput.value = "";

        mensagemInput.focus();

    }
);
