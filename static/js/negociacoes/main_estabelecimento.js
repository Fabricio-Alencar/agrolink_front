import { renderOrders } from "./renderizacao.js";
import { initFilters } from "./filtros_botao_excluir.js";

await renderOrders(null, "estabelecimento");

initFilters();