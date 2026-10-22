import {
    formatarHorarioMensagem,
    obterDataUltimaMensagem,
    conversaEstaArquivada
} from "./utils.js";

const FOTO_GENERICA = "../static/assets/user.png";

let listaConversas = null;
let abrirConversaCallback = null;
let atualizarContadorArquivadasCallback = null;

/**
 * Inicializa a lista de conversas e guarda referências de callbacks.
 */
export function inicializarListaConversas({
    elementoLista,
    abrirConversa,
    atualizarContadorArquivadas
}) {
    listaConversas = elementoLista;
    abrirConversaCallback = abrirConversa;
    atualizarContadorArquivadasCallback = atualizarContadorArquivadas;
}

/**
 * Atualiza a lista quando uma mensagem é enviada pelo próprio usuário.
 */
export function atualizarConversaEnviada(mensagem) {
    if (mensagem) {
        atualizarConversaNaLista(
            mensagem.negociacao_id,
            mensagem,
            false
        );
    }
}

/**
 * Atualiza a lista quando uma nova mensagem é recebida de outro usuário.
 */
export function atualizarConversaRecebida(notificacao) {
    if (notificacao) {
        atualizarConversaNaLista(
            notificacao.negociacao_id,
            notificacao,
            true
        );
    }
}

/* =========================================================
   OBTÉM O TEXTO DA ÚLTIMA MENSAGEM
========================================================= */
function obterTextoUltimaMensagem(conversa) {
    const ultimaMensagem = conversa?.ultima_mensagem;

    if (!ultimaMensagem) {
        return "Conversa iniciada";
    }

    if (typeof ultimaMensagem === "string") {
        return ultimaMensagem;
    }

    return ultimaMensagem.texto || "Conversa iniciada";
}

/* =========================================================
   LOCALIZA ITEM DE CONVERSA NA LISTA
========================================================= */
export function localizarItemConversa(negociacaoId) {
    if (!listaConversas) {
        return null;
    }

    const id = Number(negociacaoId);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return Array.from(
        listaConversas.querySelectorAll(".conversa-item")
    ).find(
        item => Number(item.dataset.negociacaoId) === id
    ) || null;
}

/* =========================================================
   ATUALIZA O CONTADOR DE MENSAGENS NÃO LIDAS
========================================================= */
export function atualizarContadorItem(item, quantidade) {
    if (!item) {
        return;
    }

    const total = Math.max(0, Number(quantidade) || 0);

    item.dataset.naoLidas = String(total);

    let contador = item.querySelector(".conversa-nao-lidas");

    if (total > 0) {
        if (!contador) {
            contador = document.createElement("span");
            contador.className = "conversa-nao-lidas";
            item.appendChild(contador);
        }

        contador.textContent = String(total);

        contador.setAttribute(
            "aria-label",
            `${total} mensagens não lidas`
        );
    } else {
        contador?.remove();
    }

    atualizarContadorArquivadasCallback?.();
}

/* =========================================================
   ZERA O CONTADOR DE MENSAGENS NÃO LIDAS DE UMA CONVERSA
========================================================= */
export function zerarContadorConversa(negociacaoId) {
    const item = localizarItemConversa(negociacaoId);

    if (!item) {
        return;
    }

    atualizarContadorItem(item, 0);
}

/* =========================================================
   ATUALIZA AS INFORMAÇÕES DE UMA CONVERSA NA LISTA
========================================================= */
function atualizarConversaNaLista(
    negociacaoId,
    mensagem,
    mensagemRecebida = false
) {
    if (!listaConversas || !mensagem) {
        return;
    }

    const id = Number(negociacaoId);

    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    const item = localizarItemConversa(id);

    if (!item) {
        return;
    }

    const preview = item.querySelector(".conversa-preview");
    const hora = item.querySelector(".conversa-hora");

    if (preview) {
        preview.textContent =
            typeof mensagem.texto === "string"
                ? mensagem.texto
                : obterTextoUltimaMensagem({
                    ultima_mensagem: mensagem.ultima_mensagem
                });
    }

    const dataMensagem =
        obterDataUltimaMensagem(mensagem) ||
        item.dataset.dataUltimaMensagem ||
        null;

    if (dataMensagem) {
        item.dataset.dataUltimaMensagem = dataMensagem;
    }

    if (hora && dataMensagem) {
        hora.textContent = formatarHorarioMensagem(dataMensagem);
    }

    if (
        mensagemRecebida &&
        !item.classList.contains("ativa")
    ) {
        const naoLidas = Number(item.dataset.naoLidas || 0);

        atualizarContadorItem(item, naoLidas + 1);
    }

    const listaAtual = item.parentElement;

    if (listaAtual?.firstElementChild !== item) {
        listaAtual?.prepend(item);
    }
}

/* =========================================================
   CRIA UM ITEM DE CONVERSA PARA A LISTA
========================================================= */
export function criarItemConversa(conversa) {
    const item = document.createElement("button");

    item.type = "button";
    item.className = "conversa-item";
    item.dataset.negociacaoId = conversa.negociacao_id;
    item.dataset.arquivada = String(
        conversaEstaArquivada(conversa)
    );

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

    const dataUltimaMensagem =
        obterDataUltimaMensagem(conversa);

    if (dataUltimaMensagem) {
        item.dataset.dataUltimaMensagem = dataUltimaMensagem;
    }

    hora.textContent = formatarHorarioMensagem(
        dataUltimaMensagem
    );

    cabecalho.append(nome, hora);

    const baixo = document.createElement("div");
    baixo.className = "conversa-baixo";

    const produto = document.createElement("span");
    produto.className = "conversa-produto";
    produto.textContent =
        conversa.produto_nome ||
        conversa.produto ||
        "Pedido";

    const preview = document.createElement("span");
    preview.className = "conversa-preview";
    preview.textContent = obterTextoUltimaMensagem(conversa);

    baixo.append(produto, preview);
    conteudo.append(cabecalho, baixo);
    item.append(avatar, conteudo);

    atualizarContadorItem(
        item,
        Number(conversa.mensagens_nao_lidas || 0)
    );

    item.addEventListener("click", async () => {
        try {
            if (abrirConversaCallback) {
                await abrirConversaCallback(
                    conversa.negociacao_id
                );
            }
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
