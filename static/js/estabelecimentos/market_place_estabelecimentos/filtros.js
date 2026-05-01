// ===============================
// 5. FILTROS (LÓGICA)
// ===============================
import { DOM } from './acesso_a_elementos_DOM.js';
import { API } from './api.js';
import { renderizarProdutos } from './renderizacao.js';

// ===============================
// NORMALIZADOR (resolve acento + espaços)
// ===============================
function normalizar(str) {
    return (str || '')
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

// ===============================
// CACHE LOCAL (evita múltiplas chamadas)
// ===============================
let cacheProdutos = null;

// ===============================
// PEGAR FILTROS
// ===============================
function obterFiltros() {
    const filtros = {
        termo: normalizar(DOM.searchInput.value),
        categoria: DOM.filterCat.value,
        estado: DOM.filterEstado.value,
        cidade: DOM.filterCidade.value
    };

    console.log("🎯 Filtros:", filtros);

    return filtros;
}

// ===============================
// FILTRAR LISTA
// ===============================
function filtrar(lista, filtros) {
    const termo = normalizar(filtros.termo);
    const estadoFiltro = normalizar(filtros.estado);
    const cidadeFiltro = normalizar(filtros.cidade);

    const resultado = lista.filter(p => {

        const nome = normalizar(p.nome);
        const produtor = normalizar(p.produtor_nome);

        const estado = normalizar(p.produtor_estado);
        const cidade = normalizar(p.produtor_cidade);

        return (
            (nome.includes(termo) || produtor.includes(termo)) &&

            (filtros.categoria === 'Todos' || p.categoria === filtros.categoria) &&

            (estadoFiltro === '' || estado === estadoFiltro) &&
            (cidadeFiltro === '' || cidade === cidadeFiltro)
        );
    });

    return resultado;
}

// ===============================
// APLICAR FILTROS
// ===============================
export async function aplicarFiltros() {
    try {
        // usa cache
        if (!cacheProdutos) {
            console.log("🔄 Buscando API...");
            cacheProdutos = await API.listarProdutos();
        } else {
            console.log("⚡ Usando cache");
        }

        const filtros = obterFiltros();
        const resultado = filtrar(cacheProdutos, filtros);

        renderizarProdutos(resultado);

    } catch (e) {
        console.error("Erro filtro:", e);
    }
}

// ===============================
// EVENTOS
// ===============================
DOM.searchInput.addEventListener('input', aplicarFiltros);
DOM.filterCat.addEventListener('change', aplicarFiltros);

// 🔥 IMPORTANTE: resetar cidade ao trocar estado
DOM.filterEstado.addEventListener('change', () => {
    DOM.filterCidade.value = '';
    aplicarFiltros();
});

DOM.filterCidade.addEventListener('change', aplicarFiltros);
