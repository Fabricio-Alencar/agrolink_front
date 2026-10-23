/**
 * ARQUIVO: paginacao.js
 * OBJETIVO:
 * - Paginar qualquer lista de dados no frontend
 * - Criar controles de navegação reutilizáveis
 * - Notificar a página quando o usuário trocar de página
 */

export function criarPaginacao({
    container,
    itensPorPagina = 12,
    aoMudarPagina
}) {
    if (!container) {
        throw new Error('O container da paginação é obrigatório.');
    }

    if (!Number.isInteger(itensPorPagina) || itensPorPagina < 1) {
        throw new Error('itensPorPagina deve ser um inteiro positivo.');
    }

    if (typeof aoMudarPagina !== 'function') {
        throw new Error('aoMudarPagina deve ser uma função.');
    }

    let lista = [];
    let paginaAtual = 1;

    const nav = document.createElement('nav');
    nav.className = 'paginacao';
    nav.setAttribute('aria-label', 'Navegação entre páginas');

    container.appendChild(nav);

    function obterTotalPaginas() {
        return Math.ceil(lista.length / itensPorPagina);
    }

    function obterItensDaPagina() {
        const inicio = (paginaAtual - 1) * itensPorPagina;

        return lista.slice(inicio, inicio + itensPorPagina);
    }

    function notificarMudanca() {
        aoMudarPagina({
            itens: obterItensDaPagina(),
            paginaAtual,
            totalPaginas: obterTotalPaginas(),
            totalItens: lista.length
        });
    }

    function renderizarControles() {
        const totalPaginas = obterTotalPaginas();

        nav.innerHTML = '';

        if (totalPaginas <= 1) {
            nav.hidden = true;
            return;
        }

        nav.hidden = false;

        const controles = document.createElement('div');
        controles.className = 'paginacao-controles';

        function criarBotao(texto, pagina, opcoes = {}) {
            const botao = document.createElement('button');

            botao.type = 'button';
            botao.className = 'paginacao-btn';
            botao.textContent = texto;
            botao.disabled = Boolean(opcoes.disabled);

            if (opcoes.ativa) {
                botao.classList.add('ativo');
                botao.setAttribute('aria-current', 'page');
            }

            botao.addEventListener('click', () => {
                irParaPagina(pagina);
            });

            return botao;
        }

        controles.appendChild(
            criarBotao('Anterior', paginaAtual - 1, {
                disabled: paginaAtual === 1
            })
        );

        for (let numero = 1; numero <= totalPaginas; numero++) {
            controles.appendChild(
                criarBotao(String(numero), numero, {
                    ativa: numero === paginaAtual,
                    disabled: numero === paginaAtual
                })
            );
        }

        controles.appendChild(
            criarBotao('Próxima', paginaAtual + 1, {
                disabled: paginaAtual === totalPaginas
            })
        );

        nav.appendChild(controles);

        const inicio = (paginaAtual - 1) * itensPorPagina + 1;
        const fim = Math.min(
            paginaAtual * itensPorPagina,
            lista.length
        );

        const resumo = document.createElement('p');
        resumo.className = 'paginacao-resumo';
        resumo.textContent =
            `Exibindo ${inicio}–${fim} de ${lista.length} itens`;

        nav.appendChild(resumo);
    }

    function irParaPagina(numero) {
        const totalPaginas = obterTotalPaginas();

        if (
            !Number.isInteger(numero) ||
            numero < 1 ||
            numero > totalPaginas ||
            numero === paginaAtual
        ) {
            return;
        }

        paginaAtual = numero;

        renderizarControles();
        notificarMudanca();
    }

    function atualizar(novaLista, reiniciar = true) {
        lista = Array.isArray(novaLista) ? novaLista : [];

        if (reiniciar) {
            paginaAtual = 1;
        } else {
            paginaAtual = Math.min(
                paginaAtual,
                Math.max(1, obterTotalPaginas())
            );
        }

        renderizarControles();
        notificarMudanca();
    }

    function destruir() {
        nav.remove();
        lista = [];
        paginaAtual = 1;
    }

    return {
        atualizar,
        irParaPagina,
        destruir,
        obterPaginaAtual: () => paginaAtual,
        obterTotalPaginas,
        obterItensDaPagina
    };
}
