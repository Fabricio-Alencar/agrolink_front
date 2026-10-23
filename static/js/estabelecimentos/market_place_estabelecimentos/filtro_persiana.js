
/* =========================================================
   PERSIANA DOS FILTROS — MARKETPLACE
========================================================= */

const sidebarFiltros = document.querySelector('.sidebar');
const btnToggleFiltros = document.getElementById('btnToggleFiltros');
const painelOpcoesFiltros = document.getElementById('painelOpcoesFiltros');

const mediaCelular = window.matchMedia('(max-width: 768px)');

function definirFiltrosAbertos(aberto, animar = true) {
    if (!sidebarFiltros || !btnToggleFiltros || !painelOpcoesFiltros) {
        return;
    }

    sidebarFiltros.classList.toggle('filtros-abertos', aberto);

    btnToggleFiltros.setAttribute('aria-expanded', String(aberto));

    if (!mediaCelular.matches) {
        painelOpcoesFiltros.style.maxHeight = '';
        painelOpcoesFiltros.style.opacity = '';
        return;
    }

    if (!animar) {
        painelOpcoesFiltros.style.transition = 'none';
    }

    painelOpcoesFiltros.style.maxHeight = aberto
        ? `${painelOpcoesFiltros.scrollHeight}px`
        : '0px';

    painelOpcoesFiltros.style.opacity = aberto ? '1' : '0';

    if (!animar) {
        requestAnimationFrame(() => {
            painelOpcoesFiltros.style.transition = '';
        });
    }
}

if (sidebarFiltros && btnToggleFiltros && painelOpcoesFiltros) {

    // No celular, inicia recolhido.
    // Em telas maiores, os filtros permanecem visíveis.
    definirFiltrosAbertos(!mediaCelular.matches, false);

    btnToggleFiltros.addEventListener('click', () => {
        if (!mediaCelular.matches) return;

        const aberto =
            btnToggleFiltros.getAttribute('aria-expanded') === 'true';

        definirFiltrosAbertos(!aberto);
    });

    // Recalcula a altura se a orientação ou largura mudar.
    function atualizarLayoutFiltros() {
        definirFiltrosAbertos(!mediaCelular.matches, false);
    }

    if (mediaCelular.addEventListener) {
        mediaCelular.addEventListener('change', atualizarLayoutFiltros);
    } else {
        // Compatibilidade com navegadores mais antigos.
        mediaCelular.addListener(atualizarLayoutFiltros);
    }

    // Atualiza a altura se o conteúdo mudar enquanto estiver aberto.
    if ('ResizeObserver' in window) {
        const observadorFiltros = new ResizeObserver(() => {
            if (
                mediaCelular.matches &&
                btnToggleFiltros.getAttribute('aria-expanded') === 'true'
            ) {
                painelOpcoesFiltros.style.maxHeight =
                    `${painelOpcoesFiltros.scrollHeight}px`;
            }
        });

        observadorFiltros.observe(
            painelOpcoesFiltros.querySelector('.conteudo-filtros-interno')
        );
    }
}
