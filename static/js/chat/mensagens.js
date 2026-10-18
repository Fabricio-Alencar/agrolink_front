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
   CONVERSÃO E FORMATAÇÃO DE DATAS
========================================================= */

/*
 * O backend salva as datas sem fuso horário, mas em UTC.
 * Para esses valores, adicionamos Z antes de converter.
 *
 * Se a data já possuir fuso horário, ele é preservado.
 */

function converterDataMensagem(dataEnvio) {
    if (!dataEnvio) {
        return null;
    }

    let dataTexto = String(dataEnvio).trim();

    const temFusoHorario =
        /(?:Z|[+-]\d{2}:?\d{2})$/i.test(dataTexto);

    dataTexto = dataTexto.replace(" ", "T");

    if (!temFusoHorario) {
        // JavaScript trabalha com milissegundos.
        dataTexto = dataTexto.replace(
            /(\.\d{3})\d+$/,
            "$1"
        );

        dataTexto += "Z";
    }

    const data = new Date(dataTexto);

    if (Number.isNaN(data.getTime())) {
        console.warn("Data de mensagem inválida:", dataEnvio);
        return null;
    }

    return data;
}


/* =========================================================
   IDENTIFICAR O DIA DA MENSAGEM
========================================================= */

function obterChaveData(data) {
    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0")
    ].join("-");
}


/* =========================================================
   TEXTO DA DIVISÓRIA
========================================================= */

function formatarDataDivisoria(dataEnvio) {
    const data = converterDataMensagem(dataEnvio);

    if (!data) {
        return "";
    }

    const agora = new Date();

    const hoje = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
    );

    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const dataMensagem = new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
    );

    if (dataMensagem.getTime() === hoje.getTime()) {
        return "Hoje";
    }

    if (dataMensagem.getTime() === ontem.getTime()) {
        return "Ontem";
    }

    return data.toLocaleDateString("pt-BR");
}


/* =========================================================
   CRIAR DIVISÓRIA DE DATA
========================================================= */

function criarDivisoriaData(dataEnvio) {
    const textoData = formatarDataDivisoria(dataEnvio);

    if (!textoData) {
        return null;
    }

    const divisoria = document.createElement("div");

    divisoria.className = "mensagem-divisoria-data";
    divisoria.dataset.data = obterChaveData(
        converterDataMensagem(dataEnvio)
    );

    const etiqueta = document.createElement("span");

    etiqueta.className = "mensagem-divisoria-data-texto";
    etiqueta.textContent = textoData;

    divisoria.appendChild(etiqueta);

    return divisoria;
}


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
   ADICIONAR DIVISÓRIA QUANDO O DIA MUDAR
========================================================= */

function adicionarDivisoriaSeNecessario(dataEnvio) {
    const data = converterDataMensagem(dataEnvio);

    if (!data) {
        return;
    }

    const chaveData = obterChaveData(data);

    /*
     * Procura a última mensagem real do histórico.
     * As divisórias não são consideradas mensagens.
     */

    const mensagensExistentes =
        mensagensContainer.querySelectorAll(".mensagem");

    const ultimaMensagem =
        mensagensExistentes[mensagensExistentes.length - 1];

    let chaveUltimaMensagem = null;

    if (ultimaMensagem?.dataset.dataMensagem) {
        chaveUltimaMensagem =
            ultimaMensagem.dataset.dataMensagem;
    }

    /*
     * Se o dia for diferente, adiciona uma divisória.
     * Não cria outra divisória para o mesmo dia.
     */

    if (chaveUltimaMensagem !== chaveData) {
        const divisoria = criarDivisoriaData(dataEnvio);

        if (divisoria) {
            mensagensContainer.appendChild(divisoria);
        }
    }
}


/* =========================================================
   CRIAR ELEMENTO DE MENSAGEM
========================================================= */

function criarElementoMensagem(
    mensagem,
    enviada = true
) {
    const texto =
        typeof mensagem === "object"
            ? mensagem.texto
            : mensagem;

    const dataEnvio =
        typeof mensagem === "object"
            ? mensagem.data_envio
            : null;

    const dataConvertida =
        converterDataMensagem(dataEnvio);

    const elementoMensagem =
        document.createElement("div");

    elementoMensagem.classList.add("mensagem");

    if (enviada) {
        elementoMensagem.classList.add(
            "mensagem-enviada"
        );
    } else {
        elementoMensagem.classList.add(
            "mensagem-recebida"
        );
    }

    if (
        typeof mensagem === "object" &&
        mensagem.id
    ) {
        elementoMensagem.dataset.mensagemId =
            mensagem.id;
    }

    /*
     * Guarda o dia da mensagem para comparar
     * com o dia da próxima mensagem.
     */

    if (dataConvertida) {
        elementoMensagem.dataset.dataMensagem =
            obterChaveData(dataConvertida);
    }

    const hora = dataEnvio
        ? formatarHora(dataEnvio)
        : obterHoraAtual();

    /* Conteúdo da mensagem */

    const elementoConteudo =
        document.createElement("div");

    elementoConteudo.classList.add(
        "mensagem-conteudo"
    );

    /* Texto */

    const elementoTexto =
        document.createElement("p");

    elementoTexto.textContent = texto ?? "";

    /* Horário */

    const elementoHora =
        document.createElement("span");

    elementoHora.classList.add("mensagem-hora");

    elementoHora.appendChild(
        document.createTextNode(hora)
    );

    /* Indicador de leitura para mensagens enviadas */

    if (enviada) {
        const elementoStatus =
            criarIconeStatus(
                typeof mensagem === "object"
                    ? Boolean(mensagem.lida)
                    : false
            );

        elementoHora.appendChild(elementoStatus);
    }

    elementoConteudo.appendChild(elementoTexto);
    elementoConteudo.appendChild(elementoHora);
    elementoMensagem.appendChild(elementoConteudo);

    return elementoMensagem;
}


/* =========================================================
   ADICIONAR MENSAGEM NA TELA
========================================================= */

export function adicionarMensagemNaTela(
    mensagem,
    enviada = true
) {
    if (!mensagensContainer) {
        return;
    }

    const mensagemVazia =
        mensagensContainer.querySelector(".chat-vazio");

    if (mensagemVazia) {
        mensagemVazia.remove();
    }

    const elementoMensagem =
        criarElementoMensagem(mensagem, enviada);

    /*
     * Para mensagens sem data, não adicionamos divisória.
     * Isso ocorre com a mensagem provisória enviada antes
     * de o servidor confirmar sua data real.
     */

    const dataEnvio =
        typeof mensagem === "object"
            ? mensagem.data_envio
            : null;

    if (dataEnvio) {
        adicionarDivisoriaSeNecessario(dataEnvio);
    }

    mensagensContainer.appendChild(elementoMensagem);

    mensagensContainer.scrollTop =
        mensagensContainer.scrollHeight;
}


/* =========================================================
   RENDERIZAR MENSAGENS DO HISTÓRICO
========================================================= */

export function renderizarMensagens(listaMensagens) {
    if (!mensagensContainer) {
        return;
    }

    mensagensContainer.replaceChildren();

    /* Conversa sem mensagens */

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

                    <h3>Nenhuma mensagem ainda</h3>

                    <p>
                        Envie uma mensagem para iniciar
                        esta conversa.
                    </p>
                </div>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        return;
    }

    /*
     * As mensagens devem chegar ordenadas da mais antiga
     * para a mais recente para as divisórias aparecerem
     * corretamente entre os dias.
     */

    listaMensagens.forEach(mensagem => {
        const enviada =
            Number(mensagem.remetente_id) === usuarioLogadoId;

        const dataEnvio = mensagem.data_envio;

        if (dataEnvio) {
            adicionarDivisoriaSeNecessario(dataEnvio);
        }

        const elementoMensagem =
            criarElementoMensagem(mensagem, enviada);

        mensagensContainer.appendChild(elementoMensagem);
    });

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

        if (!mensagensContainer || !mensagem) {
            return;
        }

        /*
         * Procura somente mensagens provisórias:
         * mensagens enviadas que ainda não possuem ID do banco.
         */
        const mensagensProvisorias =
            mensagensContainer.querySelectorAll(
                ".mensagem-enviada:not([data-mensagem-id])"
            );

        /*
         * Identifica a mensagem pelo texto confirmado
         * pelo servidor, em vez de pegar sempre a última.
         */
        const mensagemProvisoria =
            Array.from(mensagensProvisorias).find(
                elemento => {
                    const textoElemento =
                        elemento.querySelector(
                            ".mensagem-conteudo p"
                        )?.textContent;

                    return textoElemento === mensagem.texto;
                }
            );

        if (!mensagemProvisoria) {
            console.warn(
                "Não foi encontrada uma mensagem provisória correspondente:",
                mensagem
            );

            return;
        }

        console.log(
            "Atualizando mensagem provisória:",
            mensagem
        );

        /* Adiciona o ID real do banco */

        if (mensagem.id) {
            mensagemProvisoria.dataset.mensagemId =
                mensagem.id;
        }

        /* Atualiza a data da mensagem */

        if (mensagem.data_envio) {
            const dataConvertida =
                converterDataMensagem(mensagem.data_envio);

            if (dataConvertida) {
                mensagemProvisoria.dataset.dataMensagem =
                    obterChaveData(dataConvertida);
            }

            const chaveData =
                mensagemProvisoria.dataset.dataMensagem;

            /*
             * Mantém a divisória de data antes da mensagem
             * quando necessário.
             */

            const divisorias =
                mensagensContainer.querySelectorAll(
                    ".mensagem-divisoria-data"
                );

            const ultimaDivisoria =
                divisorias[divisorias.length - 1];

            if (
                chaveData &&
                ultimaDivisoria?.dataset.data !== chaveData
            ) {
                const divisoria =
                    criarDivisoriaData(mensagem.data_envio);

                if (divisoria) {
                    mensagensContainer.insertBefore(
                        divisoria,
                        mensagemProvisoria
                    );
                }
            }
        }

        /* Atualiza horário e status */

        const elementoHora =
            mensagemProvisoria.querySelector(
                ".mensagem-hora"
            );

        if (elementoHora) {
            elementoHora.replaceChildren();

            elementoHora.appendChild(
                document.createTextNode(
                    mensagem.data_envio
                        ? formatarHora(mensagem.data_envio)
                        : obterHoraAtual()
                )
            );

            elementoHora.appendChild(
                criarIconeStatus(Boolean(mensagem.lida))
            );
        }

        console.log(
            "Mensagem confirmada e atualizada:",
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

        if (
            Number(negociacaoAtual) !==
            Number(notificacao.negociacao_id)
        ) {
            return;
        }

        const mensagensLidas =
            notificacao.mensagem_ids || [];

        mensagensLidas.forEach(mensagemId => {
            const mensagem =
                mensagensContainer.querySelector(
                    `[data-mensagem-id="${mensagemId}"]`
                );

            if (!mensagem) {
                return;
            }

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
                atualizarStatusMensagem(status, true);
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

        const socket = getSocket();

        console.log("🟣 Tentando enviar mensagem...");
        console.log("🟣 Mensagem:", texto);
        console.log("🟣 Negociação:", negociacaoAtual);
        console.log("🟣 Socket:", socket);
        console.log(
            "🟣 Estado do socket:",
            socket ? socket.readyState : "null"
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

        /*
         * Adiciona a mensagem provisória.
         * O horário real será definido após a confirmação
         * do servidor.
         */

        adicionarMensagemNaTela(texto, true);

        /*
         * Atualiza a prévia da conversa na lista.
         */

        window.dispatchEvent(
            new CustomEvent("mensagemEnviadaChat", {
                detail: {
                    negociacao_id: negociacaoAtual,
                    texto
                }
            })
        );

        mensagemInput.value = "";
        mensagemInput.focus();
    }
);
