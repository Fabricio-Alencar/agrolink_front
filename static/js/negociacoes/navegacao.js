import { getCacheNegociacoes } from "./renderizacao.js";
import { API } from "./api.js";
import { prepararConfirmacaoNegociacao } from "./confirmacao.js";

// ============================================================
// CONFIGURAÇÃO E ESTADO GLOBAL
// ============================================================
const API_URL = CONFIG.API_URL;
const FOTO_GENERICA = "../static/assets/produto_generico.png";

// ============================================================
// AUXILIARES: NORMALIZAR STATUS E FOTO
// ============================================================
function normalizarStatus(status) {
    return String(status || "pendente")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function resolverCaminhoFoto(order) {
    if (!order || !order.produto_foto) {
        return FOTO_GENERICA;
    }

    let foto = String(order.produto_foto).trim();

    if (
        foto.startsWith("http://") ||
        foto.startsWith("https://")
    ) {
        return foto;
    }

    foto = foto
        .replace(/^\/+/, "")
        .replace(/^static\//, "")
        .replace(/^uploads\/produtos\//, "");

    if (
        foto === "foto_generica.png" ||
        foto === "produto_generico.png"
    ) {
        return FOTO_GENERICA;
    }

    const baseApi = (
        typeof API_URL !== "undefined"
            ? API_URL
            : ""
    ).replace(/\/$/, "");

    return `${baseApi}/static/uploads/produtos/${foto}`;
}


// ============================================================
// EXIBIÇÃO DOS DETALHES
// ============================================================
export function showDetails(id, tipoUsuario) {

    console.log(
        "🔎 Abrindo negociação:",
        id,
        "| Tipo:",
        tipoUsuario
    );

    const data = getCacheNegociacoes() || [];

    const order = data.find(
        o => Number(o.id) === Number(id)
    );

    if (!order) {
        console.error(
            "❌ Negociação não encontrada no cache.",
            id
        );

        return;
    }


    const viewLista =
        document.getElementById("view-lista");

    const viewCalendario =
        document.getElementById("view-calendario");

    const viewDetalhes =
        document.getElementById("view-detalhes");

    const container =
        document.getElementById("details-content");


    if (!container || !viewDetalhes) {

        console.error(
            "❌ Elementos de view não encontrados."
        );

        return;
    }


    const statusOriginal =
        order.status || "Pendente";

    const statusClass =
        normalizarStatus(statusOriginal);

    let botoesHTML = "";


    // ========================================================
    // CONSTRUÇÃO DOS BOTÕES
    // ========================================================

    if (statusClass === "pendente") {

        // ----------------------------------------------------
        // PRODUTOR
        // ----------------------------------------------------

        if (tipoUsuario === "produtor") {

            botoesHTML = `
                <button
                    class="btn-action btn-finalize"
                    id="btnAceitar"
                >
                    Aceitar Pedido
                </button>

                <button
                    class="btn-action btn-cancel"
                    id="btnRecusar"
                >
                    Recusar Pedido
                </button>
            `;

        }

        // ----------------------------------------------------
        // ESTABELECIMENTO
        // ----------------------------------------------------

        else {

            botoesHTML = `
                <p
                    style="
                        text-align: center;
                        color: #888;
                        width: 100%;
                        margin-bottom: 10px;
                    "
                >
                    Aguardando resposta do produtor...
                </p>

                <button
                    class="btn-action btn-cancel"
                    id="btnCancelar"
                >
                    Cancelar Pedido
                </button>
            `;
        }

    }

    // ========================================================
    // ACEITO / ENTREGUE
    // ========================================================

    else if (
        statusClass === "aceito" ||
        statusClass === "entregue"
    ) {

        // ----------------------------------------------------
        // PRODUTOR
        // ----------------------------------------------------

        if (tipoUsuario === "produtor") {

            const desabilitado =
                order.entrega_confirmada
                    ? 'disabled style="background-color:#ccc;cursor:not-allowed;"'
                    : "";

            const texto =
                order.entrega_confirmada
                    ? "Entrega Confirmada"
                    : "Confirmar Entrega";

            botoesHTML = `
                <button
                    class="btn-action btn-finalize"
                    id="btnConfirmarAcao"
                    ${desabilitado}
                >
                    ${texto}
                </button>
            `;
        }

        // ----------------------------------------------------
        // ESTABELECIMENTO
        // ----------------------------------------------------

        else if (tipoUsuario === "estabelecimento") {

            const desabilitado =
                order.recebimento_confirmado
                    ? 'disabled style="background-color:#ccc;cursor:not-allowed;"'
                    : "";

            const texto =
                order.recebimento_confirmado
                    ? "Recebimento Confirmado"
                    : "Confirmar Recebimento";

            botoesHTML = `
                <button
                    class="btn-action btn-finalize"
                    id="btnConfirmarAcao"
                    ${desabilitado}
                >
                    ${texto}
                </button>
            `;
        }

    }

    // ========================================================
    // OUTROS STATUS
    // ========================================================

    else {

        botoesHTML = `
            <p
                style="
                    text-align:center;
                    font-weight:bold;
                    width:100%;
                "
            >
                Este pedido está ${statusOriginal}.
            </p>
        `;
    }


    // ========================================================
    // FOTO DO PRODUTO
    // ========================================================

    const urlImagem =
        resolverCaminhoFoto(order);


    // ========================================================
    // RENDERIZAÇÃO DO HTML
    // ========================================================

    container.innerHTML = `

        <div class="details-header">

            <h2>
                Detalhes do Pedido
            </h2>

            <span
                class="badge ${statusClass}"
                style="
                    font-size:14px;
                    padding:6px 16px;
                "
            >
                ${statusOriginal}
            </span>

        </div>


        <div class="details-grid">

            <!-- =================================================
                 COLUNA ESQUERDA
            ================================================== -->

            <div class="col-left">

                <div class="info-group">

                    <span class="info-label">
                        <i data-lucide="package"></i>
                        Produto:
                    </span>

                    <span class="info-value">
                        ${order.produto_nome || "Produto"}
                    </span>

                </div>


                <div
                    style="
                        display:flex;
                        gap:40px;
                        margin-bottom:24px;
                    "
                >

                    <div>

                        <span class="info-label">
                            <i data-lucide="boxes"></i>
                            Quantidade:
                        </span>

                        <span class="info-text">
                            ${order.quantidade ?? "-"}
                        </span>

                    </div>


                    <div>

                        <span class="info-label">
                            <i data-lucide="badge-dollar-sign"></i>
                            Preço Unitário:
                        </span>

                        <span class="info-text">
                            R$ ${order.produto_preco ?? "0,00"}
                        </span>

                    </div>

                </div>


                <div class="info-group">

                    <span class="info-label">
                        <i data-lucide="calendar-days"></i>
                        Data de entrega:
                    </span>

                    <span class="info-text">
                        ${order.data_entrega || "A combinar"}
                    </span>

                </div>


                <div class="info-group">

                    <span class="info-label">
                        <i data-lucide="file-text"></i>
                        Descrição do Pedido:
                    </span>

                    <textarea
                        class="desc-box"
                        readonly
                    >${order.descricao || "Descrição adicional."}</textarea>

                </div>

            </div>


            <!-- =================================================
                 COLUNA DIREITA
            ================================================== -->

            <div class="col-right">

                <img
                    src="${urlImagem}"
                    alt="${order.produto_nome || "Produto"}"
                    class="product-img"
                    onerror="
                        if (this.dataset.fallback === 'true') return;
                        this.dataset.fallback = 'true';
                        this.src='${FOTO_GENERICA}';
                    "
                >


                <div class="info-group">

                    <span class="info-label">
                        <i data-lucide="handshake"></i>
                        Negociante:
                    </span>

                    <span
                        class="info-value"
                        style="font-size:18px;"
                    >
                        ${order.negociante_nome || "Não informado"}
                    </span>

                </div>


                <div class="info-group">

                    <span class="info-label">
                        <i data-lucide="phone"></i>
                        Telefone:
                    </span>

                    <span class="info-text">
                        ${order.negociante_telefone || "Não informado"}
                    </span>

                </div>


                <div class="info-group">

                    <span class="info-label">
                        <i data-lucide="mail"></i>
                        Email:
                    </span>

                    <span class="info-text">
                        ${order.negociante_email || "Não informado"}
                    </span>

                </div>

            </div>

        </div>


        <!-- =====================================================
             BOTÕES DE AÇÃO
        ====================================================== -->

        <div
            class="action-buttons"
            style="
                display:flex;
                justify-content:center;
                gap:15px;
                margin-top:20px;
            "
        >
            ${botoesHTML}
        </div>
    `;


    // ============================================================
    // RENDERIZAÇÃO DOS ÍCONES LUCIDE
    // ============================================================

    if (window.lucide) {

        try {

            window.lucide.createIcons();

        } catch (e) {

            console.error(
                "❌ Erro ao criar ícones:",
                e
            );
        }
    }


    // ============================================================
    // ALTERNAR VISIBILIDADE DAS VIEWS
    // ============================================================

    if (viewLista) {
        viewLista.style.display = "none";
    }

    if (viewCalendario) {
        viewCalendario.style.display = "none";
    }

    if (viewDetalhes) {
        viewDetalhes.style.display = "block";
    }


    // ============================================================
    // EVENT LISTENERS DOS BOTÕES
    // ============================================================

    const btnAceitar =
        document.getElementById("btnAceitar");

    const btnRecusar =
        document.getElementById("btnRecusar");

    const btnCancelar =
        document.getElementById("btnCancelar");

    const btnConfirmarAcao =
        document.getElementById("btnConfirmarAcao");


    // ========================================================
    // ACEITAR PEDIDO
    // ========================================================

    if (btnAceitar) {

        btnAceitar.onclick = async () => {

            try {

                await API.atualizarStatus(
                    order.id,
                    "Aceito"
                );

                agendarNotificacao(
                    "cadastro",
                    "Pedido aceito!"
                );

                location.reload();

            } catch (error) {

                console.error(
                    "❌ Erro ao aceitar pedido:",
                    error
                );

                exibirNotificacao(
                    "erro",
                    "Erro ao aceitar o pedido."
                );
            }
        };
    }


    // ========================================================
    // RECUSAR PEDIDO
    // ========================================================

    if (btnRecusar) {

        btnRecusar.onclick = () => {

            prepararConfirmacaoNegociacao(
                "recusar",
                order,
                "Recusado"
            );

        };
    }


    // ========================================================
    // CANCELAR PEDIDO
    // ========================================================

    if (btnCancelar) {

        btnCancelar.onclick = () => {

            prepararConfirmacaoNegociacao(
                "cancelar",
                order,
                "Cancelado"
            );

        };
    }


    // ========================================================
    // CONFIRMAR ENTREGA / RECEBIMENTO
    // ========================================================

    if (
        btnConfirmarAcao &&
        !btnConfirmarAcao.disabled
    ) {

        btnConfirmarAcao.onclick = async () => {

            try {

                const acao =
                    tipoUsuario === "produtor"
                        ? "confirmar_entrega"
                        : "confirmar_recebimento";


                await API.registrarConfirmacao(
                    order.id,
                    acao
                );


                agendarNotificacao(
                    "cadastro",
                    "Confirmação registrada com sucesso!"
                );

                location.reload();

            } catch (error) {

                console.error(
                    "❌ Erro ao registrar confirmação:",
                    error
                );

                exibirNotificacao(
                    "erro",
                    "Erro ao registrar confirmação."
                );
            }
        };
    }


    // ============================================================
    // VOLTA PARA O TOPO
    // ============================================================

    window.scrollTo(0, 0);
}


// ============================================================
// OCULTAR DETALHES
// ============================================================
export function hideDetails() {

    const viewDetalhes =
        document.getElementById("view-detalhes");

    const viewLista =
        document.getElementById("view-lista");

    const viewCalendario =
        document.getElementById("view-calendario");


    if (viewDetalhes) {
        viewDetalhes.style.display = "none";
    }


    // ========================================================
    // VOLTANDO DO CALENDÁRIO
    // ========================================================

    if (window.veioDoCalendario === true) {

        console.log(
            "📅 Voltando para o calendário..."
        );

        if (viewCalendario) {
            viewCalendario.style.display = "block";
        }

        if (viewLista) {
            viewLista.style.display = "none";
        }


        if (
            typeof window.renderizarCalendario ===
            "function"
        ) {

            window.renderizarCalendario();
        }


        window.veioDoCalendario = false;

        return;
    }


    // ========================================================
    // VOLTANDO PARA A LISTA
    // ========================================================

    console.log(
        "📋 Voltando para a lista..."
    );

    if (viewLista) {
        viewLista.style.display = "block";
    }

    if (viewCalendario) {
        viewCalendario.style.display = "none";
    }
}


// ============================================================
// ESCopo GLOBAL
// ============================================================
window.hideDetails = hideDetails;
