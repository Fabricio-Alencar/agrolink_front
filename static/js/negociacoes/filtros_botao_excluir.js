import { renderOrders, getCacheNegociacoes } from "./renderizacao.js";
import { prepararConfirmacaoNegociacao } from "./confirmacao.js";


// ============================================================
// EXCLUIR NEGOCIAÇÃO
// ============================================================

export function deleteOrder(id) {

    const data = getCacheNegociacoes() || [];

    const order = data.find(
        item => Number(item.id) === Number(id)
    );

    if (!order) {
        console.error(
            "❌ Negociação não encontrada:",
            id
        );

        exibirNotificacao(
            "erro",
            "Não foi possível encontrar o pedido."
        );

        return;
    }

    prepararConfirmacaoNegociacao(
        "excluir",
        order
    );
}


// ============================================================
// APLICAR FILTROS
// ============================================================

export function applyFilters() {

    const searchTerm =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase();

    const statusTerm =
        document
            .getElementById("statusFilter")
            .value;

    const data =
        getCacheNegociacoes() || [];

    const filtered = data.filter(order => {

        const product =
            (order.produto_nome || "")
                .toLowerCase();

        const producer =
            (order.negociante_nome || "")
                .toLowerCase();

        const orderStatus =
            (order.status || "")
                .toLowerCase();

        const matchesSearch =
            product.includes(searchTerm) ||
            producer.includes(searchTerm);

        // ====================================================
        // FILTRO DE STATUS
        // ====================================================

        let matchesStatus = false;

        if (statusTerm === "Todos") {

            matchesStatus = true;

        } else if (statusTerm === "Cancelado") {

            // Cancelado também inclui Recusado
            matchesStatus =
                orderStatus === "cancelado" ||
                orderStatus === "recusado";

        } else {

            matchesStatus =
                orderStatus ===
                statusTerm.toLowerCase();
        }

        return (
            matchesSearch &&
            matchesStatus
        );
    });

    renderOrders(filtered);
}


// ============================================================
// INICIALIZAR FILTROS
// ============================================================

export function initFilters() {

    document
        .getElementById("searchInput")
        ?.addEventListener(
            "input",
            applyFilters
        );

    document
        .getElementById("statusFilter")
        ?.addEventListener(
            "change",
            applyFilters
        );
}
