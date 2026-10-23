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
        .replace(/[\u0300-\u036f]/g, "");
}

// ===============================
// CACHE LOCAL (evita múltiplas chamadas)
// ===============================

let cacheProdutos = null;

// ===============================
// BOTÃO LIMPAR FILTROS
// ===============================

const btnLimparFiltros = document.getElementById('btnLimparFiltros');

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

    return lista.filter(p => {
        const nome = normalizar(p.nome);
        const produtor = normalizar(p.produtor_nome);

        const estado = normalizar(p.produtor_estado);
        const cidade = normalizar(p.produtor_cidade);

        return (
            (nome.includes(termo) || produtor.includes(termo)) &&
            (
                filtros.categoria === 'Todos' ||
                p.categoria === filtros.categoria
            ) &&
            (estadoFiltro === '' || estado === estadoFiltro) &&
            (cidadeFiltro === '' || cidade === cidadeFiltro)
        );
    });
}

// ===============================
// APLICAR FILTROS
// ===============================

export async function aplicarFiltros() {
    try {
        // Usa cache para evitar múltiplas chamadas à API.
        if (!cacheProdutos) {
            console.log("🔄 Buscando API...");
            cacheProdutos = await API.listarProdutos();
        } else {
            console.log("⚡ Usando cache");
        }

        const filtros = obterFiltros();
        const resultado = filtrar(cacheProdutos, filtros);

        // A renderização atualiza a paginação
        // e retorna à primeira página.
        await renderizarProdutos(resultado);

    } catch (e) {
        console.error("Erro filtro:", e);
    }
}

// ===============================
// LIMPAR TODOS OS FILTROS
// ===============================

function limparFiltros() {
    DOM.searchInput.value = '';
    DOM.filterCat.value = 'Todos';
    DOM.filterEstado.value = '';
    DOM.filterCidade.value = '';

    // Reaplica os filtros sem fazer outra chamada à API.
    aplicarFiltros();
}

// ===============================
// EVENTOS
// ===============================

DOM.searchInput.addEventListener('input', aplicarFiltros);

DOM.filterCat.addEventListener('change', aplicarFiltros);

// Reseta a cidade ao trocar o estado.
DOM.filterEstado.addEventListener('change', () => {
    DOM.filterCidade.value = '';
    aplicarFiltros();
});

DOM.filterCidade.addEventListener('change', aplicarFiltros);

// Botão para limpar todos os filtros.
btnLimparFiltros?.addEventListener('click', limparFiltros);
