import { getNegociacaoAtual, getSocket } from "./estado.js";
import { obterHoraAtual, formatarHora, obterDataValida } from "./utils.js";
import { atualizarConversaEnviada } from "./lista-conversas.js";

/* =========================================================
   ELEMENTOS DO DOM E VARIÁVEIS
========================================================= */

const mensagensContainer = document.getElementById("mensagens");
const mensagemInput = document.getElementById("mensagemInput");
const chatForm = document.getElementById("chatForm");
const usuarioLogadoId = Number(Auth.getId());

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
   TEXTO DA DIVISÓRIA DE DATA
========================================================= */

function formatarDataDivisoria(dataEnvio) {
    const data = obterDataValida(dataEnvio);

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
    divisoria.dataset.data = obterChaveData(obterDataValida(dataEnvio));

    const etiqueta = document.createElement("span");

    etiqueta.className = "mensagem-divisoria-data-texto";
    etiqueta.textContent = textoData;

    divisoria.appendChild(etiqueta);

    return divisoria;
}

/* =========================================================
   ÍCONES E STATUS DE LEITURA
========================================================= */

function criarIconeStatus(lida = false) {
    const status = document.createElement("span");

    status.classList.add(
        "mensagem-status",
        lida ? "visualizado" : "enviada"
    );

    status.setAttribute(
        "aria-label",
        lida ? "Mensagem visualizada" : "Mensagem enviada"
    );

    status.title = lida ? "Visualizada" : "Enviada";

    const icone = document.createElement("i");
    icone.setAttribute("data-lucide", lida ? "check-check" : "check");
    icone.setAttribute("aria-hidden", "true");

    status.appendChild(icone);

    if (window.lucide) {
        window.lucide.createIcons({ root: status });
    }

    return status;
}

function atualizarStatusMensagem(elementoStatus, lida = false) {
    if (!elementoStatus) return;
    const novoStatus = criarIconeStatus(lida);
    elementoStatus.replaceWith(novoStatus);
}

/* =========================================================
   ADICIONAR DIVISÓRIA SE NECESSÁRIO
========================================================= */

function adicionarDivisoriaSeNecessario(dataEnvio) {
    const data = obterDataValida(dataEnvio);

    if (!data) return;

    const chaveData = obterChaveData(data);
    const mensagensExistentes = mensagensContainer?.querySelectorAll(".mensagem") || [];
    const ultimaMensagem = mensagensExistentes[mensagensExistentes.length - 1];

    let chaveUltimaMensagem = null;

    if (ultimaMensagem?.dataset.dataMensagem) {
        chaveUltimaMensagem = ultimaMensagem.dataset.dataMensagem;
    }

    if (chaveUltimaMensagem !== chaveData) {
        const divisoria = criarDivisoriaData(dataEnvio);
        if (divisoria && mensagensContainer) {
            mensagensContainer.appendChild(divisoria);
        }
    }
}

/* =========================================================
   CRIAR ELEMENTO DE MENSAGEM
========================================================= */

function criarElementoMensagem(mensagem, enviada = true) {
    const texto = typeof mensagem === "object" ? mensagem.texto : mensagem;
    const dataEnvio = typeof mensagem === "object" ? mensagem.data_envio : null;
    const dataConvertida = obterDataValida(dataEnvio);

    const elementoMensagem = document.createElement("div");
    elementoMensagem.classList.add("mensagem");

    if (enviada) {
        elementoMensagem.classList.add("mensagem-enviada");
    } else {
        elementoMensagem.classList.add("mensagem-recebida");
    }

    if (typeof mensagem === "object" && mensagem.id) {
        elementoMensagem.dataset.mensagemId = mensagem.id;
    }

    if (dataConvertida) {
        elementoMensagem.dataset.dataMensagem = obterChaveData(dataConvertida);
    }

    const hora = dataEnvio ? formatarHora(dataEnvio) : obterHoraAtual();

    const elementoConteudo = document.createElement("div");
    elementoConteudo.classList.add("mensagem-conteudo");

    const elementoTexto = document.createElement("p");
    elementoTexto.textContent = texto ?? "";

    const elementoHora = document.createElement("span");
    elementoHora.classList.add("mensagem-hora");
    elementoHora.appendChild(document.createTextNode(hora));

    if (enviada) {
        const elementoStatus = criarIconeStatus(
            typeof mensagem === "object" ? Boolean(mensagem.lida) : false
        );
        elementoHora.appendChild(elementoStatus);
    }

    elementoConteudo.appendChild(elementoTexto);
    elementoConteudo.appendChild(elementoHora);
    elementoMensagem.appendChild(elementoConteudo);

    return elementoMensagem;
}

/* =========================================================
   EXPOSIÇÃO DE FUNÇÕES DE RENDERIZAÇÃO E ATUALIZAÇÃO
========================================================= */

export function adicionarMensagemNaTela(mensagem, enviada = true) {
    if (!mensagensContainer) return;

    const mensagemVazia = mensagensContainer.querySelector(".chat-vazio");
    if (mensagemVazia) {
        mensagemVazia.remove();
    }

    const elementoMensagem = criarElementoMensagem(mensagem, enviada);
    const dataEnvio = typeof mensagem === "object" ? mensagem.data_envio : null;

    if (dataEnvio) {
        adicionarDivisoriaSeNecessario(dataEnvio);
    }

    mensagensContainer.appendChild(elementoMensagem);
    mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
}

export function renderizarMensagens(listaMensagens) {
    if (!mensagensContainer) return;

    mensagensContainer.replaceChildren();

    if (!listaMensagens || listaMensagens.length === 0) {
        mensagensContainer.innerHTML = `
            <div class="chat-vazio">
                <div class="chat-vazio-conteudo">
                    <div class="chat-vazio-icone">
                        <i data-lucide="message-circle"></i>
                    </div>
                    <h3>Nenhuma mensagem ainda</h3>
                    <p>Envie uma mensagem para iniciar esta conversa.</p>
                </div>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }
        return;
    }

    listaMensagens.forEach(mensagem => {
        const enviada = Number(mensagem.remetente_id) === usuarioLogadoId;
        const dataEnvio = mensagem.data_envio;

        if (dataEnvio) {
            adicionarDivisoriaSeNecessario(dataEnvio);
        }

        const elementoMensagem = criarElementoMensagem(mensagem, enviada);
        mensagensContainer.appendChild(elementoMensagem);
    });

    mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
}

/**
 * Atualiza mensagem provisória quando o servidor confirma seu envio.
 */
export function confirmarMensagemEnviada(mensagem) {
    if (!mensagensContainer || !mensagem) return;

    const mensagensProvisorias = mensagensContainer.querySelectorAll(
        ".mensagem-enviada:not([data-mensagem-id])"
    );

    const mensagemProvisoria = Array.from(mensagensProvisorias).find(elemento => {
        const textoElemento = elemento.querySelector(".mensagem-conteudo p")?.textContent;
        return textoElemento === mensagem.texto;
    });

    if (!mensagemProvisoria) return;

    if (mensagem.id) {
        mensagemProvisoria.dataset.mensagemId = mensagem.id;
    }

    if (mensagem.data_envio) {
        const dataConvertida = obterDataValida(mensagem.data_envio);
        if (dataConvertida) {
            mensagemProvisoria.dataset.dataMensagem = obterChaveData(dataConvertida);
        }

        const chaveData = mensagemProvisoria.dataset.dataMensagem;
        const divisorias = mensagensContainer.querySelectorAll(".mensagem-divisoria-data");
        const ultimaDivisoria = divisorias[divisorias.length - 1];

        if (chaveData && ultimaDivisoria?.dataset.data !== chaveData) {
            const divisoria = criarDivisoriaData(mensagem.data_envio);
            if (divisoria) {
                mensagensContainer.insertBefore(divisoria, mensagemProvisoria);
            }
        }
    }

    const elementoHora = mensagemProvisoria.querySelector(".mensagem-hora");
    if (elementoHora) {
        elementoHora.replaceChildren();
        elementoHora.appendChild(
            document.createTextNode(
                mensagem.data_envio ? formatarHora(mensagem.data_envio) : obterHoraAtual()
            )
        );
        elementoHora.appendChild(criarIconeStatus(Boolean(mensagem.lida)));
    }
}

/**
 * Atualiza o status visual das mensagens que foram lidas pelo destinatário.
 */
export function atualizarMensagensLidas(notificacao) {
    const negociacaoAtual = getNegociacaoAtual();

    if (Number(negociacaoAtual) !== Number(notificacao.negociacao_id)) {
        return;
    }

    const mensagensLidas = notificacao.mensagem_ids || [];

    mensagensLidas.forEach(mensagemId => {
        const mensagem = mensagensContainer?.querySelector(
            `[data-mensagem-id="${mensagemId}"]`
        );

        if (!mensagem || !mensagem.classList.contains("mensagem-enviada")) {
            return;
        }

        const status = mensagem.querySelector(".mensagem-status");
        if (status) {
            atualizarStatusMensagem(status, true);
        }
    });
}

/* =========================================================
   ENVIAR MENSAGEM (EVENTO DE FORMULÁRIO)
========================================================= */

chatForm?.addEventListener("submit", event => {
    event.preventDefault();

    const texto = mensagemInput?.value.trim();
    if (!texto) return;

    const negociacaoAtual = getNegociacaoAtual();
    if (!negociacaoAtual) return;

    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(texto);

    // Adiciona a mensagem provisória na tela
    adicionarMensagemNaTela(texto, true);

    // Atualiza a prévia diretamente chamando a função do módulo da lista
    atualizarConversaEnviada({
        negociacao_id: negociacaoAtual,
        texto
    });

    if (mensagemInput) {
        mensagemInput.value = "";
        mensagemInput.focus();
    }
});