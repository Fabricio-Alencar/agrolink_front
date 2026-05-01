import { renderOrders } from "./renderizacao.js";
import { initFilters } from "./filtros_botao_excluir.js";

window.addEventListener("DOMContentLoaded", async () => {
    // 2. Busca dados reais (passando null para forçar busca na API)
    // Altere 'produtor' para 'estabelecimento' conforme o contexto
    await renderOrders(null, 'estabelecimento');
    
    // 3. Ativa filtros após carregar os dados
    initFilters();
});