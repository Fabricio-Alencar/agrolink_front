const FOTO_GENERICA = "../static/assets/user.png";

let listaConversas = null;
let abrirConversaCallback = null;
let atualizarContadorArquivadasCallback = null;

export function inicializarListaConversas({
    elementoLista,
    abrirConversa,
    atualizarContadorArquivadas
}) {
    listaConversas = elementoLista;
    abrirConversaCallback = abrirConversa;
    atualizarContadorArquivadasCallback = atualizarContadorArquivadas;

    window.addEventListener("mensagemEnviadaChat", event => {
        const mensagem = event.detail;

        if (mensagem) {
            atualizarConversaNaLista(
                mensagem.negociacao_id,
                mensagem
            );
        }
    });

    window.addEventListener("novaMensagemChat", event => {
        const notificacao = event.detail;

        if (notificacao) {
            atualizarConversaNaLista(
                notificacao.negociacao_id,
                notificacao,
                true
            );
        }
    });
}

/**
 * Converte a data para um objeto Date.
 *
 * As datas sem indicação de fuso horário são consideradas UTC.
 * O JavaScript fará a conversão para o fuso horário local
 * ao formatar o horário para exibição.
 */
function obterDataValida(data) {
    if (!data) {
        return null;
    }

    const dataTexto = String(data).trim();

    const temFusoHorario =
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(dataTexto);

    let dataNormalizada = dataTexto;

    if (!temFusoHorario) {
        // Mantém no máximo 3 casas decimais nos milissegundos.
        dataNormalizada = dataTexto.replace(
            /(\.\d{3})\d+$/,
            "$1"
        );

        dataNormalizada += "Z";
    }

    const dataConvertida = new Date(dataNormalizada);

    if (Number.isNaN(dataConvertida.getTime())) {
        console.warn("Data inválida recebida:", data);
        return null;
    }

    return dataConvertida;
}

/**
 * Exibe:
 * - Hoje: horário (ex.: 14:35).
 * - Ontem: "Ontem".
 * - Dias anteriores: data (ex.: 09/10/2026).
 */
function formatarHorarioMensagem(data) {
    const dataConvertida = obterDataValida(data);

    if (!dataConvertida) {
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
        dataConvertida.getFullYear(),
        dataConvertida.getMonth(),
        dataConvertida.getDate()
    );

    if (dataMensagem.getTime() === hoje.getTime()) {
        return dataConvertida.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    }

    if (dataMensagem.getTime() === ontem.getTime()) {
        return "Ontem";
    }

    return dataConvertida.toLocaleDateString("pt-BR");
}

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

/**
 * A API retorna a data em data_ultima_mensagem.
 * Também aceita o formato em que ultima_mensagem é um objeto.
 */
function obterDataUltimaMensagem(conversa) {
    if (conversa?.data_ultima_mensagem) {
        return conversa.data_ultima_mensagem;
    }

    const ultimaMensagem = conversa?.ultima_mensagem;

    if (
        ultimaMensagem &&
        typeof ultimaMensagem === "object"
    ) {
        return ultimaMensagem.data_envio || null;
    }

    return null;
}

export function localizarItemConversa(negociacaoId) {
    if (!listaConversas) {
        return null;
    }

    const id = Number(negociacaoId);

    return Array.from(
        listaConversas.querySelectorAll(".conversa-item")
    ).find(
        item => Number(item.dataset.negociacaoId) === id
    ) || null;
}

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
        console.warn("ID de negociação inválido:", negociacaoId);
        return;
    }

    const item = localizarItemConversa(id);



    if (!item) {
        console.warn(
            "Item da conversa não encontrado na lista:",
            id
        );
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

    // Prioriza a data nova e preserva a anterior como alternativa.
    const dataMensagem =
        mensagem.data_envio ||
        mensagem.data_ultima_mensagem ||
        item.dataset.dataUltimaMensagem ||
        null;



    if (dataMensagem) {
        item.dataset.dataUltimaMensagem = dataMensagem;
    }

    if (hora && dataMensagem) {
        hora.textContent = formatarHorarioMensagem(dataMensagem);
    } else if (!hora) {
        console.warn(
            "Elemento .conversa-hora não encontrado:",
            id
        );
    }

    if (
        mensagemRecebida &&
        !item.classList.contains("ativa")
    ) {
        const naoLidas = Number(item.dataset.naoLidas || 0);

        atualizarContadorItem(item, naoLidas + 1);
    }

    // Move a conversa atualizada para o início da lista.
    const listaAtual = item.parentElement;

    if (listaAtual?.firstElementChild !== item) {
        listaAtual?.prepend(item);
    }
}

export function criarItemConversa(conversa) {


    const item = document.createElement("button");

    item.type = "button";
    item.className = "conversa-item";

    item.dataset.negociacaoId = conversa.negociacao_id;

    item.dataset.arquivada = String(
        conversa.arquivada === true ||
        String(conversa.arquivada).trim().toLowerCase() === "true"
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

    const dataUltimaMensagem = obterDataUltimaMensagem(conversa);

    if (dataUltimaMensagem) {
        item.dataset.dataUltimaMensagem = dataUltimaMensagem;
    }

    hora.textContent = formatarHorarioMensagem(dataUltimaMensagem);

    cabecalho.append(nome, hora);

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
