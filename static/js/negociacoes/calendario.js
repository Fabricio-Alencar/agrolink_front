import { getCacheNegociacoes } from "./renderizacao.js";
import { showDetails } from "./navegacao.js";

// ============================================================
// ELEMENTOS
// ============================================================

const viewLista =
    document.getElementById("view-lista");

const viewCalendario =
    document.getElementById("view-calendario");

const viewDetalhes =
    document.getElementById("view-detalhes");


const btnLista =
    document.getElementById("btnLista");

const btnCalendario =
    document.getElementById("btnCalendario");


const btnListaCalendario =
    document.getElementById("btnListaCalendario");

const btnCalendarioLista =
    document.getElementById("btnCalendarioLista");


const calendarTitle =
    document.getElementById("calendarTitle");

const calendarGrid =
    document.getElementById("calendarGrid");


const btnMesAnterior =
    document.getElementById("btnMesAnterior");

const btnProximoMes =
    document.getElementById("btnProximoMes");

const btnHoje =
    document.getElementById("btnHoje");


// ============================================================
// ESTADO DO CALENDÁRIO
// ============================================================

let dataCalendario = new Date();


// ============================================================
// TIPO DE USUÁRIO
// ============================================================

function obterTipoUsuario() {

    return window.location.href.includes("estabelecimento")
        ? "estabelecimento"
        : "produtor";
}


// ============================================================
// NOME DO MÊS
// ============================================================

function obterNomeMes(mes) {

    const meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    return meses[mes];
}


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
// CONVERTER DATA DA API
// ============================================================

function converterData(data) {

    if (!data) {
        return null;
    }


    // --------------------------------------------------------
    // OBJETO DATE
    // --------------------------------------------------------

    if (data instanceof Date) {

        if (isNaN(data.getTime())) {
            return null;
        }

        return new Date(
            data.getFullYear(),
            data.getMonth(),
            data.getDate()
        );
    }


    const valor =
        String(data).trim();


    // --------------------------------------------------------
    // YYYY-MM-DD
    // --------------------------------------------------------

    const formatoISO =
        valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (formatoISO) {

        const ano =
            Number(formatoISO[1]);

        const mes =
            Number(formatoISO[2]) - 1;

        const dia =
            Number(formatoISO[3]);

        return new Date(
            ano,
            mes,
            dia
        );
    }


    // --------------------------------------------------------
    // DD/MM/YYYY
    // --------------------------------------------------------

    const formatoBR =
        valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (formatoBR) {

        const dia =
            Number(formatoBR[1]);

        const mes =
            Number(formatoBR[2]) - 1;

        const ano =
            Number(formatoBR[3]);

        return new Date(
            ano,
            mes,
            dia
        );
    }


    // --------------------------------------------------------
    // ISO COM HORÁRIO
    // --------------------------------------------------------

    const formatoISOCompleto =
        valor.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (formatoISOCompleto) {

        const ano =
            Number(formatoISOCompleto[1]);

        const mes =
            Number(formatoISOCompleto[2]) - 1;

        const dia =
            Number(formatoISOCompleto[3]);

        return new Date(
            ano,
            mes,
            dia
        );
    }


    // --------------------------------------------------------
    // ÚLTIMA TENTATIVA
    // --------------------------------------------------------

    const dataConvertida =
        new Date(valor);

    if (isNaN(dataConvertida.getTime())) {
        return null;
    }

    return new Date(
        dataConvertida.getFullYear(),
        dataConvertida.getMonth(),
        dataConvertida.getDate()
    );
}


// ============================================================
// COMPARAR DATAS
// ============================================================

function mesmaData(data1, data2) {

    return (
        data1.getFullYear() === data2.getFullYear() &&
        data1.getMonth() === data2.getMonth() &&
        data1.getDate() === data2.getDate()
    );
}


// ============================================================
// PEDIDOS DE UMA DATA
// ============================================================

function obterPedidosDoDia(dia) {

    const pedidos =
        getCacheNegociacoes() || [];


    return pedidos.filter(order => {

        const dataEntrega =
            converterData(order.data_entrega);


        if (!dataEntrega) {
            return false;
        }


        return mesmaData(
            dataEntrega,
            dia
        );
    });
}


// ============================================================
// CRIAR PEDIDO NO CALENDÁRIO
// ============================================================

function criarEventoPedido(order) {

    const evento =
        document.createElement("button");


    evento.type =
        "button";


    evento.classList.add(
        "calendar-order"
    );


    // ========================================================
    // STATUS
    // ========================================================

    const statusOriginal =
        order.status || "Pendente";


    const statusClass =
        normalizarStatus(statusOriginal);


    evento.classList.add(
        `status-${statusClass}`
    );


    // ========================================================
    // PRODUTO
    // ========================================================

    const produto =
        document.createElement("span");


    produto.classList.add(
        "calendar-order-product"
    );


    produto.textContent =
        order.produto_nome || "Produto";


    // ========================================================
    // NEGOCIANTE
    // ========================================================

    const negociante =
        document.createElement("span");


    negociante.classList.add(
        "calendar-order-person"
    );


    negociante.textContent =
        order.negociante_nome || "Negociante";


    // ========================================================
    // STATUS
    // ========================================================

    const status =
        document.createElement("span");


    status.classList.add(
        "calendar-order-status"
    );


    status.textContent =
        statusOriginal;


    // ========================================================
    // ADICIONAR ELEMENTOS
    // ========================================================

    evento.appendChild(produto);

    evento.appendChild(negociante);

    evento.appendChild(status);


    // ========================================================
    // ABRIR DETALHES
    // ========================================================

    evento.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();


            // ------------------------------------------------
            // VERIFICAR ID
            // ------------------------------------------------

            if (!order.id) {

                console.error(
                    "❌ Pedido não possui ID:",
                    order
                );

                return;
            }


            console.log(
                "📅 Abrindo pedido pelo calendário:",
                order.id
            );


            // ------------------------------------------------
            // MARCAR ORIGEM
            // ------------------------------------------------

            window.veioDoCalendario = true;


            // ------------------------------------------------
            // ABRIR DETALHES
            // ------------------------------------------------

            showDetails(
                order.id,
                obterTipoUsuario()
            );
        }
    );


    return evento;
}


// ============================================================
// CRIAR DIA
// ============================================================

function criarDiaCalendario(
    dia,
    mes,
    ano
) {

    const elementoDia =
        document.createElement("div");


    elementoDia.classList.add(
        "calendar-day"
    );


    // ========================================================
    // DATA
    // ========================================================

    const dataDia =
        new Date(
            ano,
            mes,
            dia
        );


    // ========================================================
    // HOJE
    // ========================================================

    const hoje =
        new Date();


    if (
        mesmaData(
            dataDia,
            hoje
        )
    ) {

        elementoDia.classList.add(
            "today"
        );
    }


    // ========================================================
    // NÚMERO DO DIA
    // ========================================================

    const numeroDia =
        document.createElement("span");


    numeroDia.classList.add(
        "day-number"
    );


    numeroDia.textContent =
        dia;


    elementoDia.appendChild(
        numeroDia
    );


    // ========================================================
    // PEDIDOS
    // ========================================================

    const pedidosDoDia =
        obterPedidosDoDia(
            dataDia
        );


    if (
        pedidosDoDia.length > 0
    ) {

        const pedidosContainer =
            document.createElement("div");


        pedidosContainer.classList.add(
            "calendar-orders"
        );


        pedidosDoDia.forEach(
            order => {

                pedidosContainer.appendChild(
                    criarEventoPedido(order)
                );
            }
        );


        elementoDia.appendChild(
            pedidosContainer
        );
    }


    return elementoDia;
}


// ============================================================
// RENDERIZAR CALENDÁRIO
// ============================================================

export function renderizarCalendario() {

    if (!calendarGrid) {
        return;
    }


    // ========================================================
    // DATA
    // ========================================================

    const ano =
        dataCalendario.getFullYear();

    const mes =
        dataCalendario.getMonth();


    // ========================================================
    // TÍTULO
    // ========================================================

    if (calendarTitle) {

        calendarTitle.textContent =
            `${obterNomeMes(mes)} ${ano}`;
    }


    // ========================================================
    // LIMPAR
    // ========================================================

    calendarGrid.innerHTML = "";


    // ========================================================
    // PRIMEIRO DIA
    // ========================================================

    const primeiroDia =
        new Date(
            ano,
            mes,
            1
        ).getDay();


    // ========================================================
    // ÚLTIMO DIA
    // ========================================================

    const ultimoDia =
        new Date(
            ano,
            mes + 1,
            0
        ).getDate();


    // ========================================================
    // DIAS VAZIOS
    // ========================================================

    for (
        let i = 0;
        i < primeiroDia;
        i++
    ) {

        const vazio =
            document.createElement("div");


        vazio.classList.add(
            "calendar-day",
            "empty"
        );


        calendarGrid.appendChild(
            vazio
        );
    }


    // ========================================================
    // DIAS
    // ========================================================

    for (
        let dia = 1;
        dia <= ultimoDia;
        dia++
    ) {

        calendarGrid.appendChild(
            criarDiaCalendario(
                dia,
                mes,
                ano
            )
        );
    }


    // ========================================================
    // LUCIDE
    // ========================================================

    if (window.lucide) {

        window.lucide.createIcons();
    }
}


// ============================================================
// MOSTRAR LISTA
// ============================================================

function mostrarLista() {

    if (viewDetalhes) {

        viewDetalhes.style.display =
            "none";
    }


    if (viewCalendario) {

        viewCalendario.style.display =
            "none";
    }


    if (viewLista) {

        viewLista.style.display =
            "block";
    }


    // ========================================================
    // BOTÕES
    // ========================================================

    btnLista?.classList.add(
        "active"
    );

    btnCalendario?.classList.remove(
        "active"
    );


    btnListaCalendario?.classList.add(
        "active"
    );

    btnCalendarioLista?.classList.remove(
        "active"
    );


    window.veioDoCalendario =
        false;
}


// ============================================================
// MOSTRAR CALENDÁRIO
// ============================================================

function mostrarCalendario() {

    if (viewDetalhes) {

        viewDetalhes.style.display =
            "none";
    }


    if (viewLista) {

        viewLista.style.display =
            "none";
    }


    if (viewCalendario) {

        viewCalendario.style.display =
            "block";
    }


    // ========================================================
    // BOTÕES
    // ========================================================

    btnCalendario?.classList.add(
        "active"
    );

    btnLista?.classList.remove(
        "active"
    );


    btnCalendarioLista?.classList.add(
        "active"
    );

    btnListaCalendario?.classList.remove(
        "active"
    );


    // ========================================================
    // RENDERIZAR
    // ========================================================

    renderizarCalendario();
}


// ============================================================
// BOTÃO LISTA
// ============================================================

btnLista?.addEventListener(
    "click",
    mostrarLista
);


btnListaCalendario?.addEventListener(
    "click",
    mostrarLista
);


// ============================================================
// BOTÃO CALENDÁRIO
// ============================================================

btnCalendario?.addEventListener(
    "click",
    mostrarCalendario
);


btnCalendarioLista?.addEventListener(
    "click",
    mostrarCalendario
);


// ============================================================
// MÊS ANTERIOR
// ============================================================

btnMesAnterior?.addEventListener(
    "click",
    function () {

        dataCalendario.setMonth(
            dataCalendario.getMonth() - 1
        );


        renderizarCalendario();
    }
);


// ============================================================
// PRÓXIMO MÊS
// ============================================================

btnProximoMes?.addEventListener(
    "click",
    function () {

        dataCalendario.setMonth(
            dataCalendario.getMonth() + 1
        );


        renderizarCalendario();
    }
);


// ============================================================
// HOJE
// ============================================================

btnHoje?.addEventListener(
    "click",
    function () {

        dataCalendario =
            new Date();


        renderizarCalendario();
    }
);


// ============================================================
// DISPONIBILIZAR GLOBALMENTE
// ============================================================
//
// O navegacao.js pode chamar essa função depois que
// o usuário fechar os detalhes e voltar para o calendário.
//

window.renderizarCalendario =
    renderizarCalendario;
