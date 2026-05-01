import { renderOrders, getCacheNegociacoes } from "./renderizacao.js";
import { API } from "./api.js"; 

export async function deleteOrder(id) {
    if (confirm("Tem certeza que deseja remover esse item?")) {
        try {
            await API.deletarNegociacao(id);
            alert("Item removido.");
            location.reload(); 
        } catch (error) {
            alert("Erro ao tentar remover item.");
        }
    }
}

export function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusTerm = document.getElementById('statusFilter').value;
    
    const data = getCacheNegociacoes() || [];

    const filtered = data.filter(order => {
        const product = (order.produto_nome || "").toLowerCase();
        const producer = (order.negociante_nome || "").toLowerCase();
        const orderStatus = (order.status || "").toLowerCase();
        
        const matchesSearch = product.includes(searchTerm) || producer.includes(searchTerm);
        
        // --- NOVA LÓGICA DE FILTRO DE STATUS ---
        let matchesStatus = false;

        if (statusTerm === 'Todos') {
            matchesStatus = true;
        } else if (statusTerm === 'Cancelado') {
            // Se filtrar por Cancelado, mostra Cancelados E Recusados
            matchesStatus = (orderStatus === 'cancelado' || orderStatus === 'recusado');
        } else {
            // Filtro normal para os outros status (Pendente, Aceito, etc)
            matchesStatus = (orderStatus === statusTerm.toLowerCase());
        }
        // ---------------------------------------

        return matchesSearch && matchesStatus;
    });

    renderOrders(filtered);
}


export function initFilters() {
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
}