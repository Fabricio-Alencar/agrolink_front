import { getCacheNegociacoes } from "./renderizacao.js";
import { API } from "./api.js";

// ============================================================
// CONFIGURAÇÃO
// ============================================================
const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net";

// ============================================================
// NORMALIZAR STATUS
// ============================================================
function normalizarStatus(status) {
    return String(status || "pendente")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// ============================================================
// RESOLVER CAMINHO DA FOTO
// ============================================================
function resolverCaminhoFoto(order) {
    console.log("🖼️ Foto original:", order.produto_foto);

    const fallback = `${API_URL}/static/uploads/produtos/foto_generica.png`;

    if (!order.produto_foto) {
        console.warn("⚠️ Sem foto, usando fallback");
        return fallback;
    }

    let caminho = String(order.produto_foto).trim().replace(/^\/+/, "");

    if (caminho.startsWith("static/")) {
        return `${API_URL}/${caminho}`;
    }

    return `${API_URL}/static/${caminho}`;
}

// ============================================================
// MOSTRAR DETALHES
// ============================================================
export function showDetails(id, tipoUsuario) {
    console.log("🔎 Abrindo negociação:", id);
    console.log("👤 Tipo de usuário:", tipoUsuario);

    // BUSCAR PEDIDO NO CACHE
    const data = getCacheNegociacoes() || [];
    const order = data.find(o => Number(o.id) === Number(id));

    if (!order) {
        console.error("❌ Negociação não encontrada no cache.", id);
        return;
    }

    console.log("📋 Abrindo detalhes do pedido:", order);

    // ELEMENTOS DAS VIEWS
    const viewLista = document.getElementById("view-lista");
    const viewCalendario = document.getElementById("view-calendario");
    const viewDetalhes = document.getElementById("view-detalhes");
    const container = document.getElementById("details-content");

    // VERIFICAR ELEMENTOS
    if (!container) {
        console.error("❌ Elemento #details-content não encontrado.");
        return;
    }

    if (!viewDetalhes) {
        console.error("❌ Elemento #view-detalhes não encontrado.");
        return;
    }

    // STATUS
    const statusOriginal = order.status || "Pendente";
    const statusClass = normalizarStatus(statusOriginal);

    // BOTÕES DE AÇÃO
    let botoesHTML = "";

    // PEDIDO PENDENTE
    if (statusClass === "pendente") {
        if (tipoUsuario === "produtor") {
            botoesHTML = `
                <button class="btn-action btn-finalize" id="btnAceitar">
                    Aceitar Pedido
                </button>
                <button class="btn-action btn-cancel" id="btnRecusar">
                    Recusar Pedido
                </button>
            `;
        } else {
            botoesHTML = `
                <p style="text-align: center; color: #888; width: 100%; margin-bottom: 10px;">
                    Aguardando resposta do produtor...
                </p>
                <button class="btn-action btn-cancel" id="btnCancelar">
                    Cancelar Pedido
                </button>
            `;
        }
    }
    // PEDIDO ACEITO / ENTREGUE
    else if (statusClass === "aceito" || statusClass === "entregue") {
        if (tipoUsuario === "produtor") {
            const desabilitado = order.entrega_confirmada
                ? 'disabled style="background-color:#ccc;cursor:not-allowed;"'
                : "";
            const texto = order.entrega_confirmada
                ? "Entrega Confirmada"
                : "Confirmar Entrega";

            botoesHTML = `
                <button class="btn-action btn-finalize" id="btnConfirmarAcao" ${desabilitado}>
                    ${texto}
                </button>
            `;
        } else if (tipoUsuario === "estabelecimento") {
            const desabilitado = order.recebimento_confirmado
                ? 'disabled style="background-color:#ccc;cursor:not-allowed;"'
                : "";
            const texto = order.recebimento_confirmado
                ? "Recebimento Confirmado"
                : "Confirmar Recebimento";

            botoesHTML = `
                <button class="btn-action btn-finalize" id="btnConfirmarAcao" ${desabilitado}>
                    ${texto}
                </button>
            `;
        }
    }
    // OUTROS STATUS
    else {
        botoesHTML = `
            <p style="text-align:center; font-weight:bold; width:100%;">
                Este pedido está ${statusOriginal}.
            </p>
        `;
    }

    // FOTO
    const urlImagem = resolverCaminhoFoto(order);
    const fallbackImagem = `${API_URL}/static/uploads/produtos/foto_generica.png`;

    // HTML DOS DETALHES
    container.innerHTML = `
        <div class="details-header">
            <h2>Detalhes do Pedido</h2>
            <span class="badge ${statusClass}" style="font-size:14px; padding:6px 16px;">
                ${statusOriginal}
            </span>
        </div>

        <div class="details-grid">
            <!-- COLUNA ESQUERDA -->
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

                <div style="display:flex; gap:40px; margin-bottom:24px;">
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
                    <textarea class="desc-box" readonly>${order.descricao || "Descrição adicional."}</textarea>
                </div>
            </div>

            <!-- COLUNA DIREITA -->
            <div class="col-right">
                <img
                    src="${urlImagem}"
                    alt="${order.produto_nome || "Produto"}"
                    class="product-img"
                    onerror="
                        if (!this.dataset.fallback) {
                            this.dataset.fallback = 'true';
                            this.src='${fallbackImagem}';
                        }
                    "
                >

                <div class="info-group">
                    <span class="info-label">
                        <i data-lucide="handshake"></i>
                        Negociante:
                    </span>
                    <span class="info-value" style="font-size:18px;">
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

        <!-- BOTÕES -->
        <div class="action-buttons" style="display:flex; justify-content:center; gap:15px; margin-top:20px;">
            ${botoesHTML}
        </div>
    `;

    // LUCIDE
    if (window.lucide) {
        try {
            window.lucide.createIcons();
        } catch (erro) {
            console.error("❌ Erro ao criar ícones:", erro);
        }
    }

    // MOSTRAR DETALHES E OCULTAR DEMAIS VIEWS
    if (viewLista) {
        viewLista.style.display = "none";
    }
    if (viewCalendario) {
        viewCalendario.style.display = "none";
    }
    if (viewDetalhes) {
        viewDetalhes.style.display = "block";
    }

    // HANDLERS DOS BOTÕES
    const btnAceitar = document.getElementById("btnAceitar");
    const btnRecusar = document.getElementById("btnRecusar");
    const btnConfirmarAcao = document.getElementById("btnConfirmarAcao");
    const btnCancelar = document.getElementById("btnCancelar");

    // ACEITAR
    if (btnAceitar) {
        btnAceitar.onclick = async () => {
            try {
                await API.atualizarStatus(order.id, "Aceito");
                alert("Pedido aceito!");
                location.reload();
            } catch (error) {
                console.error("❌ Erro ao aceitar pedido:", error);
                alert("Erro ao aceitar o pedido.");
            }
        };
    }

    // RECUSAR
    if (btnRecusar) {
        btnRecusar.onclick = async () => {
            if (!confirm("Deseja realmente recusar este pedido?")) {
                return;
            }

            try {
                await API.atualizarStatus(order.id, "Recusado");
                alert("Pedido recusado.");
                location.reload();
            } catch (error) {
                console.error("❌ Erro ao recusar pedido:", error);
                alert("Erro ao recusar o pedido.");
            }
        };
    }

    // CANCELAR
    if (btnCancelar) {
        btnCancelar.onclick = async () => {
            if (!confirm("Deseja realmente cancelar este pedido?")) {
                return;
            }

            try {
                await API.atualizarStatus(order.id, "Cancelado");
                alert("Pedido cancelado.");
                location.reload();
            } catch (error) {
                console.error("❌ Erro ao cancelar pedido:", error);
                alert("Erro ao cancelar o pedido.");
            }
        };
    }

    // CONFIRMAR ENTREGA / RECEBIMENTO
    if (btnConfirmarAcao && !btnConfirmarAcao.disabled) {
        btnConfirmarAcao.onclick = async () => {
            try {
                const acao = tipoUsuario === "produtor"
                    ? "confirmar_entrega"
                    : "confirmar_recebimento";

                await API.registrarConfirmacao(order.id, acao);
                alert("Confirmação registrada com sucesso!");
                location.reload();
            } catch (error) {
                console.error("❌ Erro ao registrar confirmação:", error);
                alert("Erro ao registrar confirmação.");
            }
        };
    }

    // VOLTAR PARA O TOPO
    window.scrollTo(0, 0);
}

// ============================================================
// ESCONDER DETALHES
// ============================================================
export function hideDetails() {
    const viewDetalhes = document.getElementById("view-detalhes");
    const viewLista = document.getElementById("view-lista");
    const viewCalendario = document.getElementById("view-calendario");

    if (viewDetalhes) {
        viewDetalhes.style.display = "none";
    }

    // VOLTAR PARA O CALENDÁRIO SE VEIO DELE
    if (window.veioDoCalendario === true) {
        console.log("📅 Voltando para o calendário...");

        if (viewCalendario) {
            viewCalendario.style.display = "block";
        }
        if (viewLista) {
            viewLista.style.display = "none";
        }

        if (typeof window.renderizarCalendario === "function") {
            window.renderizarCalendario();
        }

        window.veioDoCalendario = false;
        return;
    }

    // VOLTAR PARA A LISTA
    console.log("📋 Voltando para a lista...");

    if (viewLista) {
        viewLista.style.display = "block";
    }
    if (viewCalendario) {
        viewCalendario.style.display = "none";
    }
}

// ============================================================
// ESCOPO GLOBAL
// ============================================================
window.hideDetails = hideDetails;