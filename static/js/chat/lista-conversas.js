
import { formatarHorarioMensagem, obterDataUltimaMensagem, conversaEstaArquivada} from "./utils.js";

const FOTO_GENERICA = "../static/assets/user.png";

let listaConversas = null;
let abrirConversaCallback = null;
let atualizarContadorArquivadasCallback = null;


/**
 * Inicializa a lista de conversas e registra os eventos
 * responsáveis por atualizar os itens quando mensagens são enviadas
 * ou recebidas.
 *
 * @param {Object} parametros - Configurações da lista.
 * @param {HTMLElement} parametros.elementoLista - Elemento que contém as conversas.
 * @param {Function} parametros.abrirConversa - Função para abrir uma conversa.
 * @param {Function} parametros.atualizarContadorArquivadas - Função para atualizar
 * o contador de conversas arquivadas.
 */
export function inicializarListaConversas({
    elementoLista,
    abrirConversa,
    atualizarContadorArquivadas
}) {
    // Guarda as referências recebidas para uso nas outras funções.
    listaConversas = elementoLista;
    abrirConversaCallback = abrirConversa;
    atualizarContadorArquivadasCallback = atualizarContadorArquivadas;

    // Atualiza a prévia e o horário quando o próprio usuário envia uma mensagem.
    window.addEventListener("mensagemEnviadaChat", event => {
        const mensagem = event.detail;

        if (mensagem) {
            atualizarConversaNaLista(
                mensagem.negociacao_id,
                mensagem
            );
        }
    });

    // Atualiza a conversa quando uma nova mensagem é recebida.
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


/* =========================================================
   OBTÉM O TEXTO DA ÚLTIMA MENSAGEM
========================================================= */
function obterTextoUltimaMensagem(conversa) {
    const ultimaMensagem = conversa?.ultima_mensagem;

    if (!ultimaMensagem) {
        return "Conversa iniciada";
    }

    // Se a última mensagem já for um texto, retorna diretamente.
    if (typeof ultimaMensagem === "string") {
        return ultimaMensagem;
    }

    // Se for um objeto, retorna seu texto ou o valor padrão.
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

    // Converte a quantidade para número e impede valores negativos.
    const total = Math.max(0, Number(quantidade) || 0);

    // Guarda a quantidade no próprio elemento HTML.
    item.dataset.naoLidas = String(total);

    let contador = item.querySelector(".conversa-nao-lidas");

    if (total > 0) {
        // Cria o contador somente se ele ainda não existir.
        if (!contador) {
            contador = document.createElement("span");
            contador.className = "conversa-nao-lidas";
            item.appendChild(contador);
        }

        // Atualiza o número exibido.
        contador.textContent = String(total);

        // Informa a quantidade aos leitores de tela.
        contador.setAttribute(
            "aria-label",
            `${total} mensagens não lidas`
        );
    } else {
        // Remove o contador quando não há mensagens não lidas.
        contador?.remove();
    }

    // Atualiza o contador de conversas arquivadas, se configurado.
    atualizarContadorArquivadasCallback?.();
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

    // Converte e valida o ID da negociação.
    const id = Number(negociacaoId);

    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    // Localiza o item da conversa na lista.
    const item = localizarItemConversa(id);

    if (!item) {
        return;
    }

    // Obtém os elementos da prévia da mensagem e do horário.
    const preview = item.querySelector(".conversa-preview");
    const hora = item.querySelector(".conversa-hora");

    // Atualiza o texto da última mensagem.
    if (preview) {
        preview.textContent =
            typeof mensagem.texto === "string"
                ? mensagem.texto
                : obterTextoUltimaMensagem({
                    ultima_mensagem: mensagem.ultima_mensagem
                });
    }

    // Obtém a data da mensagem utilizando a função compartilhada.
    // Se não estiver disponível, mantém a data já armazenada no item.
    const dataMensagem =
        obterDataUltimaMensagem(mensagem) ||
        item.dataset.dataUltimaMensagem ||
        null;

    if (dataMensagem) {
        item.dataset.dataUltimaMensagem = dataMensagem;
    }

    // Formata e atualiza o horário da conversa.
    if (hora && dataMensagem) {
        hora.textContent = formatarHorarioMensagem(dataMensagem);
    }

    // Incrementa o contador se a mensagem foi recebida
    // e a conversa não está ativa.
    if (mensagemRecebida && !item.classList.contains("ativa")) {
        const naoLidas = Number(item.dataset.naoLidas || 0);

        atualizarContadorItem(item, naoLidas + 1);
    }

    // Move a conversa atualizada para o início da lista.
    const listaAtual = item.parentElement;

    if (listaAtual?.firstElementChild !== item) {
        listaAtual?.prepend(item);
    }
}


/* =========================================================
   CRIA UM ITEM DE CONVERSA PARA A LISTA
========================================================= */
export function criarItemConversa(conversa) {
    // Cria o botão que representa o item da lista.
    const item = document.createElement("button");

    item.type = "button";
    item.className = "conversa-item";

    // Guarda o ID da negociação no elemento.
    item.dataset.negociacaoId = conversa.negociacao_id;

    // Registra se a conversa está arquivada.
    item.dataset.arquivada = String(
        conversaEstaArquivada(conversa)
    );

    /* ---------------------------------------------------------
       AVATAR
    --------------------------------------------------------- */
    const avatar = document.createElement("div");
    avatar.className = "conversa-avatar";

    const foto = document.createElement("img");

    foto.alt = "";
    foto.src = conversa.foto_perfil || FOTO_GENERICA;

    // Caso ocorra um erro ao carregar a foto, utiliza a imagem genérica.
    foto.onerror = () => {
        foto.onerror = null;
        foto.src = FOTO_GENERICA;
    };

    avatar.appendChild(foto);

    /* ---------------------------------------------------------
       INFORMAÇÕES DA CONVERSA
    --------------------------------------------------------- */
    const conteudo = document.createElement("div");
    conteudo.className = "conversa-info";

    // Cabeçalho com nome e horário da última mensagem.
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

    // Guarda a data para permitir futuras atualizações.
    if (dataUltimaMensagem) {
        item.dataset.dataUltimaMensagem = dataUltimaMensagem;
    }

    hora.textContent = formatarHorarioMensagem(
        dataUltimaMensagem
    );

    cabecalho.append(nome, hora);

    /* ---------------------------------------------------------
       PRODUTO E PRÉVIA DA MENSAGEM
    --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       CONTADOR DE MENSAGENS NÃO LIDAS
    --------------------------------------------------------- */
    atualizarContadorItem(
        item,
        Number(conversa.mensagens_nao_lidas || 0)
    );

    /* ---------------------------------------------------------
       EVENTO DE ABERTURA DA CONVERSA
    --------------------------------------------------------- */
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
