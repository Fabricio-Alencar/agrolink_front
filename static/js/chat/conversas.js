import { API } from "./api.js";

import {
    setNegociacaoAtual,
    getNegociacaoAtual,
    setNegociacaoInfo,
    getNegociacaoInfo
} from "./estado.js";

import {
    conectarWebSocket
} from "./websocket.js";

import {
    renderizarMensagens
} from "./mensagens.js";


/* =========================================================
   ELEMENTOS
========================================================= */

const containerChat =
    document.querySelector(".chat-container");

const listaConversas =
    document.getElementById("listaConversas");

const mensagensContainer =
    document.getElementById("mensagens");

const chatNome =
    document.getElementById("chatNome");

const chatProduto =
    document.getElementById("chatProduto");

const chatFoto =
    document.getElementById("chatFoto");

const mensagemInput =
    document.getElementById("mensagemInput");

const chatArea =
    document.getElementById("chatArea");

const chatSemSelecao =
    document.getElementById("chatSemSelecao");

const btnInfoChat =
    document.getElementById("btnInfoChat");


/* =========================================================
   ELEMENTOS DO MODAL DE INFORMAÇÕES
========================================================= */

const modalInfoNegociacao =
    document.getElementById("modalInfoNegociacao");

const btnFecharInfo =
    document.getElementById("btnFecharInfo");

const infoProduto =
    document.getElementById("infoProduto");

const infoQuantidade =
    document.getElementById("infoQuantidade");

const infoPreco =
    document.getElementById("infoPreco");

const infoUnidade =
    document.getElementById("infoUnidade");

const infoDataEntrega =
    document.getElementById("infoDataEntrega");

const infoStatus =
    document.getElementById("infoStatus");

const infoDescricao =
    document.getElementById("infoDescricao");

const infoNegociante =
    document.getElementById("infoNegociante");


/* =========================================================
   ESTADO SEM SELEÇÃO
========================================================= */

export function mostrarEstadoSemSelecao() {

    if (chatArea) {

        chatArea.style.display =
            "none";

    }


    if (chatSemSelecao) {

        chatSemSelecao.style.display =
            "flex";

    }


    if (containerChat) {

        containerChat.classList.remove(
            "chat-aberto"
        );

    }

}


/* =========================================================
   MOSTRAR CONVERSA
========================================================= */

export function mostrarConversa() {

    if (chatArea) {

        chatArea.style.display =
            "flex";

    }


    if (chatSemSelecao) {

        chatSemSelecao.style.display =
            "none";

    }


    if (containerChat) {

        containerChat.classList.add(
            "chat-aberto"
        );

    }

}


/* =========================================================
   BOTÃO DE INFORMAÇÕES DA NEGOCIAÇÃO
========================================================= */

if (btnInfoChat) {

    btnInfoChat.addEventListener(
        "click",
        () => {

            const negociacao =
                getNegociacaoInfo();


            console.log(
                "ℹ️ INFORMAÇÕES DA NEGOCIAÇÃO:",
                negociacao
            );


            /* ---------------------------------------------
               Verifica se existem informações
            --------------------------------------------- */

            if (!negociacao) {

                console.warn(
                    "⚠️ Nenhuma informação de negociação disponível."
                );

                return;

            }


            /* ---------------------------------------------
               Preenche as informações
            --------------------------------------------- */

            if (infoProduto) {

                infoProduto.textContent =
                    negociacao.produto_nome ||
                    "-";

            }


            if (infoQuantidade) {

                infoQuantidade.textContent =
                    negociacao.quantidade != null
                        ? negociacao.quantidade
                        : "-";

            }


            if (infoPreco) {

                infoPreco.textContent =
                    negociacao.produto_preco != null
                        ? `R$ ${Number(
                            negociacao.produto_preco
                        ).toFixed(2).replace(".", ",")}`
                        : "-";

            }


            if (infoUnidade) {

                infoUnidade.textContent =
                    negociacao.produto_unidade ||
                    "-";

            }


            if (infoDataEntrega) {

                infoDataEntrega.textContent =
                    negociacao.data_entrega ||
                    "-";

            }


            if (infoStatus) {

                infoStatus.textContent =
                    negociacao.status ||
                    "-";

            }


            if (infoDescricao) {

                infoDescricao.textContent =
                    negociacao.descricao ||
                    "Nenhuma descrição informada.";

            }


            if (infoNegociante) {

                infoNegociante.textContent =
                    negociacao.negociante_nome ||
                    "-";

            }


            /* ---------------------------------------------
               Mostra o modal
            --------------------------------------------- */

            if (modalInfoNegociacao) {

                modalInfoNegociacao.style.display =
                    "flex";

            }


            /* ---------------------------------------------
               Atualiza os ícones
            --------------------------------------------- */

            if (window.lucide) {

                lucide.createIcons();

            }

        }
    );

}


/* =========================================================
   FECHAR MODAL
========================================================= */

if (btnFecharInfo) {

    btnFecharInfo.addEventListener(
        "click",
        () => {

            if (modalInfoNegociacao) {

                modalInfoNegociacao.style.display =
                    "none";

            }

        }
    );

}


/* =========================================================
   FECHAR CLICANDO FORA DO MODAL
========================================================= */

if (modalInfoNegociacao) {

    modalInfoNegociacao.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modalInfoNegociacao
            ) {

                modalInfoNegociacao.style.display =
                    "none";

            }

        }
    );

}


/* =========================================================
   ATUALIZAR CONVERSA COM NOVA MENSAGEM
========================================================= */

function atualizarConversaComNovaMensagem(
    notificacao
) {

    console.log(
        "🔄 ATUALIZANDO LISTA DE CONVERSAS:"
    );

    console.log(
        notificacao
    );


    const negociacaoId =
        Number(
            notificacao.negociacao_id
        );


    /* ---------------------------------------------
       Procura a conversa na lista
    --------------------------------------------- */

    const conversa =
        document.querySelector(
            `[data-negociacao="${negociacaoId}"]`
        );


    /* ---------------------------------------------
       Se a conversa não estiver na lista
    --------------------------------------------- */

    if (!conversa) {

        console.warn(
            "⚠️ Conversa não encontrada na lista:",
            negociacaoId
        );

        return;

    }


    /* ---------------------------------------------
       Atualiza última mensagem
    --------------------------------------------- */

    const ultimaMensagem =
        conversa.querySelector(
            ".conversa-ultima-mensagem"
        );


    if (ultimaMensagem) {

        ultimaMensagem.textContent =
            notificacao.texto;

    }


    /* ---------------------------------------------
       Verifica se essa conversa está aberta
    --------------------------------------------- */

    const negociacaoAtual =
        getNegociacaoAtual();


    const conversaEstaAberta =
        Number(negociacaoAtual) ===
        negociacaoId;


    /* ---------------------------------------------
       Se a conversa NÃO estiver aberta
    --------------------------------------------- */

    if (!conversaEstaAberta) {

        let indicadorNaoLidas =
            conversa.querySelector(
                ".conversa-nao-lidas"
            );


        /* -----------------------------------------
           Cria o indicador caso não exista
        ----------------------------------------- */

        if (!indicadorNaoLidas) {

            indicadorNaoLidas =
                document.createElement(
                    "span"
                );

            indicadorNaoLidas.classList.add(
                "conversa-nao-lidas"
            );

            indicadorNaoLidas.textContent =
                "1";


            conversa.appendChild(
                indicadorNaoLidas
            );

        } else {

            /* -------------------------------------
               Aumenta o contador
            ------------------------------------- */

            const quantidadeAtual =
                Number(
                    indicadorNaoLidas.textContent
                ) || 0;


            indicadorNaoLidas.textContent =
                quantidadeAtual + 1;

        }

    }


    /* ---------------------------------------------
       Move a conversa para o topo
    --------------------------------------------- */

    listaConversas.prepend(
        conversa
    );

}


/* =========================================================
   ESCUTAR NOVAS MENSAGENS
========================================================= */

window.addEventListener(
    "novaMensagemChat",
    event => {

        const notificacao =
            event.detail;


        console.log(
            "🔔 NOVA MENSAGEM RECEBIDA PELA LISTA DE CONVERSAS:"
        );


        console.log(
            notificacao
        );


        atualizarConversaComNovaMensagem(
            notificacao
        );

    }
);


/* =========================================================
   ESCUTAR MENSAGEM ENVIADA PELO USUÁRIO
========================================================= */

window.addEventListener(
    "mensagemEnviadaChat",
    event => {

        const notificacao =
            event.detail;


        console.log(
            "📤 MENSAGEM ENVIADA PELO USUÁRIO:"
        );


        console.log(
            notificacao
        );


        const negociacaoId =
            Number(
                notificacao.negociacao_id
            );


        /* ---------------------------------------------
           Procura a conversa na lista
        --------------------------------------------- */

        const conversa =
            document.querySelector(
                `[data-negociacao="${negociacaoId}"]`
            );


        if (!conversa) {

            console.warn(
                "⚠️ Conversa não encontrada na lista:",
                negociacaoId
            );

            return;

        }


        /* ---------------------------------------------
           Atualiza última mensagem
        --------------------------------------------- */

        const ultimaMensagem =
            conversa.querySelector(
                ".conversa-ultima-mensagem"
            );


        if (ultimaMensagem) {

            ultimaMensagem.textContent =
                notificacao.texto;

        }


        /* ---------------------------------------------
           Move a conversa para o topo
        --------------------------------------------- */

        listaConversas.prepend(
            conversa
        );

    }
);


/* =========================================================
   CARREGAR CONVERSAS
========================================================= */

export async function carregarConversas() {

    try {

        const conversas =
            await API.buscarConversas();


        console.log(
            "💬 CONVERSAS RECEBIDAS DA API:",
            conversas
        );


        listaConversas.innerHTML = "";


        if (
            !conversas ||
            conversas.length === 0
        ) {

            listaConversas.innerHTML = `

                <div class="chat-sem-conversas">

                    <p>
                        Nenhuma conversa ainda.
                    </p>

                </div>

            `;


            /*
               Se nenhuma conversa estiver selecionada,
               mostra a tela inicial.

               Caso contrário, significa que uma conversa
               já foi aberta pela URL ou por outro fluxo.
               Nesse caso, não devemos esconder a conversa.
            */

            if (!getNegociacaoAtual()) {

                mostrarEstadoSemSelecao();

            }


            return;

        }


        conversas.forEach(
            conversa => {

                console.log(
                    "🖼️ FOTO DO USUÁRIO:",
                    conversa.nome,
                    conversa.foto_perfil
                );


                const item =
                    document.createElement("div");


                item.classList.add(
                    "conversa-item"
                );


                item.dataset.negociacao =
                    conversa.negociacao_id;

                item.dataset.nome =
                    conversa.nome;

                item.dataset.produto =
                    conversa.produto;

                item.dataset.foto =
                    conversa.foto_perfil || "";


                /* ---------------------------------------------
                   Contador de mensagens não lidas
                --------------------------------------------- */

                const mensagensNaoLidas =
                    conversa.mensagens_nao_lidas || 0;


                const indicadorNaoLidas =
                    mensagensNaoLidas > 0
                        ? `
                            <span class="conversa-nao-lidas">
                                ${mensagensNaoLidas}
                            </span>
                          `
                        : "";


                item.innerHTML = `

                    <div class="conversa-avatar">

                        ${
                            conversa.foto_perfil
                                ? `
                                    <img
                                        src="${conversa.foto_perfil}"
                                        alt="Foto de ${conversa.nome}"
                                        onerror="this.onerror=null; this.src='../static/assets/login/user.png';"
                                    >
                                  `
                                : `
                                    <img
                                        src="../static/assets/login/user.png"
                                        alt="Foto de ${conversa.nome}"
                                    >
                                  `
                        }

                    </div>


                    <div class="conversa-info">

                        <strong class="conversa-nome">
                            ${conversa.nome}
                        </strong>

                        <span class="conversa-produto">
                            ${conversa.produto}
                        </span>

                        <p class="conversa-ultima-mensagem">
                            ${conversa.ultima_mensagem}
                        </p>

                    </div>


                    ${indicadorNaoLidas}

                `;


                /* ---------------------------------------------
                   Clique na conversa
                --------------------------------------------- */

                item.addEventListener(
                    "click",
                    () => {

                        abrirConversa(
                            conversa.negociacao_id
                        );

                    }
                );


                listaConversas.appendChild(
                    item
                );

            }
        );


        /* ---------------------------------------------
           Atualiza ícones Lucide
        --------------------------------------------- */

        if (window.lucide) {

            lucide.createIcons();

        }

    } catch (error) {

        console.error(
            "❌ Erro ao carregar conversas:",
            error
        );


        listaConversas.innerHTML = `

            <div class="chat-erro">

                <p>
                    Não foi possível carregar as conversas.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   ABRIR CONVERSA
========================================================= */

export async function abrirConversa(
    negociacaoId
) {

    negociacaoId =
        Number(negociacaoId);


    /* ---------------------------------------------
       Verifica se o usuário possui acesso
       à negociação
    --------------------------------------------- */

    try {

        const acesso =
            await API.verificarAcessoNegociacao(
                negociacaoId
            );


        console.log(
            "🔐 ACESSO À NEGOCIAÇÃO:",
            negociacaoId,
            acesso
        );


        if (!acesso.permitido) {

            console.warn(
                "⚠️ Usuário não possui acesso à negociação:",
                negociacaoId
            );


            setNegociacaoAtual(null);

            setNegociacaoInfo(null);


            mostrarEstadoSemSelecao();


            return;

        }

    } catch (error) {

        console.error(
            "❌ Erro ao verificar acesso à negociação:",
            error
        );


        setNegociacaoAtual(null);

        setNegociacaoInfo(null);


        mostrarEstadoSemSelecao();


        return;

    }


    /* ---------------------------------------------
       Usuário possui acesso
    --------------------------------------------- */

    setNegociacaoAtual(
        negociacaoId
    );


    /* ---------------------------------------------
       Busca informações da negociação
    --------------------------------------------- */

    try {

        const negociacao =
            await API.buscarNegociacao(
                negociacaoId
            );


        setNegociacaoInfo(
            negociacao
        );


        console.log(
            "📋 INFORMAÇÕES DA NEGOCIAÇÃO:",
            negociacao
        );

    } catch (error) {

        console.error(
            "❌ Erro ao carregar informações da negociação:",
            error
        );


        setNegociacaoInfo(
            null
        );

    }


    /* ---------------------------------------------
       Procura a conversa na lista lateral
    --------------------------------------------- */

    const conversaSelecionada =
        document.querySelector(
            `[data-negociacao="${negociacaoId}"]`
        );


    /* ---------------------------------------------
       Atualiza o cabeçalho
    --------------------------------------------- */

    if (conversaSelecionada) {

        const nome =
            conversaSelecionada.dataset.nome ||
            conversaSelecionada.querySelector(
                ".conversa-nome"
            )?.textContent.trim() ||
            "Conversa";


        const produto =
            conversaSelecionada.dataset.produto ||
            conversaSelecionada.querySelector(
                ".conversa-produto"
            )?.textContent.trim() ||
            "Negociação";


        const foto =
            conversaSelecionada.dataset.foto ||
            "";


        chatNome.textContent =
            nome;

        chatProduto.textContent =
            produto;


        /* ---------------------------------------------
           Atualiza foto do cabeçalho
        --------------------------------------------- */

        if (chatFoto) {

            chatFoto.src =
                foto ||
                "../static/assets/login/user.png";

            chatFoto.alt =
                `Foto de ${nome}`;

        }

    }


    /* ---------------------------------------------
       Atualiza item selecionado
    --------------------------------------------- */

    document
        .querySelectorAll(".conversa-item")
        .forEach(item => {

            item.classList.remove("ativa");

        });


    if (conversaSelecionada) {

        conversaSelecionada
            .classList.add("ativa");

    }


    /* ---------------------------------------------
       Carrega mensagens da API
    --------------------------------------------- */

    try {

        const mensagens =
            await API.buscarMensagens(
                negociacaoId
            );


        /* ---------------------------------------------
           Mostra a área da conversa
        --------------------------------------------- */

        mostrarConversa();


        /* ---------------------------------------------
           Remove indicador de mensagens não lidas
        --------------------------------------------- */

        const indicadorNaoLidas =
            conversaSelecionada?.querySelector(
                ".conversa-nao-lidas"
            );

        if (indicadorNaoLidas) {

            indicadorNaoLidas.remove();

        }


        /* ---------------------------------------------
           Renderiza as mensagens
        --------------------------------------------- */

        renderizarMensagens(
            mensagens
        );

    } catch (error) {

        console.error(
            "❌ Erro ao carregar mensagens:",
            error
        );


        mensagensContainer.innerHTML = `

            <div class="chat-erro">

                <p>
                    Não foi possível carregar as mensagens.
                </p>

            </div>

        `;

    }


    /* ---------------------------------------------
       Conecta ao WebSocket
    --------------------------------------------- */

    conectarWebSocket(
        negociacaoId
    );


    mensagemInput.focus();

}


