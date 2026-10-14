import { renderOrders } from "./renderizacao.js";
import { initFilters } from "./filtros_botao_excluir.js";

// O filtro "Para avaliar" é só do estabelecimento (quem avalia)
document.getElementById("opcaoParaAvaliar")?.remove();

await renderOrders(null, "produtor");

initFilters();