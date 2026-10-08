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
       Remove o estado de conversa vazia
       quando uma mensagem é adicionada.
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


    elementoMensagem.classList.add(
        "mensagem"
    );


    /*
       Guarda o ID da mensagem no elemento.

       Isso permite encontrar posteriormente
       exatamente qual mensagem foi lida.
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
            ? formatarHora(
                mensagem.data_envio
            )
            : obterHoraAtual();


    /* ---------------------------------------------
       Cria o conteúdo da mensagem
    --------------------------------------------- */

    const elementoConteudo =
        document.createElement("div");


    elementoConteudo.classList.add(
        "mensagem-conteudo"
    );


    /* ---------------------------------------------
       Texto da mensagem
    --------------------------------------------- */

    const elementoTexto =
        document.createElement("p");


    /*
       textContent trata o conteúdo como texto.

       Dessa forma, caso o usuário envie HTML
       ou JavaScript, ele não será executado.
    */

    elementoTexto.textContent =
        texto;


    /* ---------------------------------------------
       Horário da mensagem
    --------------------------------------------- */

    const elementoHora =
        document.createElement("span");


    elementoHora.classList.add(
        "mensagem-hora"
    );


    elementoHora.appendChild(
        document.createTextNode(
            hora
        )
    );


    /* ---------------------------------------------
       Indicador da mensagem enviada
    --------------------------------------------- */

    if (enviada) {

        const elementoStatus =
            document.createElement("span");


        elementoStatus.classList.add(
            "mensagem-status"
        );


        elementoStatus.textContent =
            "✓";


        elementoHora.appendChild(
            elementoStatus
        );

    }


    /* ---------------------------------------------
       Monta a mensagem
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
       Limpa completamente o conteúdo anterior.
    */

    mensagensContainer.innerHTML = "";


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
           Atualiza os ícones Lucide,
           caso estejam disponíveis.
        */

        if (window.lucide) {

            lucide.createIcons();

        }


        return;

    }


    /* ---------------------------------------------
       EXISTEM MENSAGENS
    --------------------------------------------- */

    listaMensagens.forEach(
        mensagem => {

            const elementoMensagem =
                document.createElement("div");


            elementoMensagem.classList.add(
                "mensagem"
            );


            /*
               Guarda o ID da mensagem no elemento.

               Isso permite encontrar posteriormente
               exatamente quais mensagens foram lidas.
            */

            elementoMensagem.dataset.mensagemId =
                mensagem.id;


            if (
                mensagem.remetente_id ===
                usuarioLogadoId
            ) {

                elementoMensagem.classList.add(
                    "mensagem-enviada"
                );

            } else {

                elementoMensagem.classList.add(
                    "mensagem-recebida"
                );

            }


            const hora =
                formatarHora(
                    mensagem.data_envio
                );


            let indicadorLeitura = "";


            if (
                mensagem.remetente_id ===
                usuarioLogadoId
            ) {

                indicadorLeitura =
                    mensagem.lida
                        ? "✓✓"
                        : "✓";

            }


            /* ---------------------------------------------
               Cria conteúdo da mensagem
            --------------------------------------------- */

            const elementoConteudo =
                document.createElement("div");


            elementoConteudo.classList.add(
                "mensagem-conteudo"
            );


            /* ---------------------------------------------
               Texto da mensagem
            --------------------------------------------- */

            const elementoTexto =
                document.createElement("p");


            /*
               textContent impede que o conteúdo
               da mensagem seja interpretado como HTML.
            */

            elementoTexto.textContent =
                mensagem.texto;


            /* ---------------------------------------------
               Horário da mensagem
            --------------------------------------------- */

            const elementoHora =
                document.createElement("span");


            elementoHora.classList.add(
                "mensagem-hora"
            );


            elementoHora.appendChild(
                document.createTextNode(
                    hora
                )
            );


            /* ---------------------------------------------
               Indicador de leitura
            --------------------------------------------- */

            if (indicadorLeitura) {

                const elementoStatus =
                    document.createElement("span");


                elementoStatus.classList.add(
                    "mensagem-status"
                );


                elementoStatus.textContent =
                    indicadorLeitura;


                elementoHora.appendChild(
                    elementoStatus
                );

            }


            /* ---------------------------------------------
               Monta a mensagem
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

        }
    );


    /*
       Mantém a rolagem no final da conversa.
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

        const mensagem =
            event.detail;


        console.log(
            "🔄 ATUALIZANDO MENSAGEM PROVISÓRIA:"
        );


        console.log(
            mensagem
        );


        /*
           Busca as mensagens enviadas.

           Como a mensagem provisória ainda não possui
           o ID do banco, pegamos a última mensagem
           enviada pelo usuário.
        */

        const mensagensEnviadas =
            mensagensContainer.querySelectorAll(
                ".mensagem-enviada"
            );


        if (
            mensagensEnviadas.length === 0
        ) {

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
           Adiciona o ID real do banco
        --------------------------------------------- */

        mensagemProvisoria.dataset.mensagemId =
            mensagem.id;


        /* ---------------------------------------------
           Atualiza o horário
        --------------------------------------------- */

        const elementoHora =
            mensagemProvisoria.querySelector(
                ".mensagem-hora"
            );


        if (elementoHora) {

            /*
               Remove o conteúdo atual do horário.
            */

            elementoHora.textContent =
                formatarHora(
                    mensagem.data_envio
                );


            /* ---------------------------------------------
               Recria o indicador de leitura
            --------------------------------------------- */

            const elementoStatus =
                document.createElement("span");


            elementoStatus.classList.add(
                "mensagem-status"
            );


            elementoStatus.textContent =
                mensagem.lida
                    ? "✓✓"
                    : "✓";


            elementoHora.appendChild(
                elementoStatus
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

        const notificacao =
            event.detail;


        const negociacaoAtual =
            getNegociacaoAtual();


        /* ---------------------------------------------
           Verifica se é a conversa atualmente aberta
        --------------------------------------------- */

        if (
            Number(negociacaoAtual) !==
            Number(notificacao.negociacao_id)
        ) {

            return;

        }


        /* ---------------------------------------------
           Busca os IDs das mensagens que foram lidas
        --------------------------------------------- */

        const mensagensLidas =
            notificacao.mensagem_ids || [];


        /* ---------------------------------------------
           Atualiza somente as mensagens lidas
        --------------------------------------------- */

        mensagensLidas.forEach(
            mensagemId => {

                const mensagem =
                    mensagensContainer.querySelector(
                        `[data-mensagem-id="${mensagemId}"]`
                    );


                if (!mensagem) {

                    return;

                }


                const status =
                    mensagem.querySelector(
                        ".mensagem-status"
                    );


                if (status) {

                    status.textContent =
                        "✓✓";

                }

            }
        );


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


        socket.send(
            texto
        );


        console.log(
            "✅ Mensagem enviada para o WebSocket."
        );


        /* ---------------------------------------------
           Adiciona a mensagem enviada ao chat
        --------------------------------------------- */

        adicionarMensagemNaTela(
            texto,
            true
        );


        /* ---------------------------------------------
           Atualiza a última mensagem na lista
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