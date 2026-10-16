
export function montarSecoesConversas(listaConversas) {
    const secaoArquivadas = document.createElement("section");
    secaoArquivadas.className = "conversas-arquivadas";
    secaoArquivadas.hidden = true;

    const botaoArquivadas = document.createElement("button");
    botaoArquivadas.type = "button";
    botaoArquivadas.className = "conversas-arquivadas-toggle";
    botaoArquivadas.setAttribute("aria-expanded", "false");

    const titulo = document.createElement("span");
    titulo.className = "conversas-arquivadas-titulo";

    const icone = document.createElement("i");
    icone.setAttribute("data-lucide", "archive");

    const textoTitulo = document.createElement("span");
    textoTitulo.textContent = "Pedidos finalizados ou cancelados";

    titulo.append(icone, textoTitulo);

    const contadorArquivadas = document.createElement("span");
    contadorArquivadas.className = "contador-arquivadas";
    contadorArquivadas.hidden = true;

    const seta = document.createElement("i");
    seta.className = "conversas-arquivadas-seta";
    seta.setAttribute("data-lucide", "chevron-down");

    botaoArquivadas.append(titulo, contadorArquivadas, seta);

    const conteudoArquivadas = document.createElement("div");
    conteudoArquivadas.className = "conversas-arquivadas-conteudo";
    conteudoArquivadas.hidden = true;

    const listaArquivadas = document.createElement("div");
    listaArquivadas.className = "conversas-arquivadas-lista";

    conteudoArquivadas.appendChild(listaArquivadas);
    secaoArquivadas.append(botaoArquivadas, conteudoArquivadas);

    const listaAtivas = document.createElement("div");
    listaAtivas.className = "conversas-ativas-lista";

    botaoArquivadas.addEventListener("click", () => {
        const expandida =
            botaoArquivadas.getAttribute("aria-expanded") === "true";

        botaoArquivadas.setAttribute(
            "aria-expanded",
            String(!expandida)
        );

        conteudoArquivadas.hidden = expandida;
        listaAtivas.hidden = !expandida;

        secaoArquivadas.classList.toggle("expandida", !expandida);
        secaoArquivadas.hidden = false;
    });

    listaConversas.append(secaoArquivadas, listaAtivas);

    if (window.lucide) {
        window.lucide.createIcons();
    }

    return {
        listaAtivas,
        listaArquivadas,
        secaoArquivadas,
        conteudoArquivadas,
        contadorArquivadas
    };
}

export function atualizarContadorArquivadas({
    listaArquivadas,
    contadorArquivadas,
    secaoArquivadas
}) {
    if (!listaArquivadas || !contadorArquivadas) {
        return;
    }

    const itens = listaArquivadas.querySelectorAll(".conversa-item");

    const totalNaoLidas = Array.from(itens).reduce(
        (total, item) => total + Number(item.dataset.naoLidas || 0),
        0
    );

    contadorArquivadas.textContent = String(totalNaoLidas);
    contadorArquivadas.hidden = totalNaoLidas === 0;

    const campoPesquisa = document.getElementById("chatSearch");
    const pesquisaAtiva = Boolean(campoPesquisa?.value.trim());

    if (!pesquisaAtiva && secaoArquivadas) {
        secaoArquivadas.hidden = itens.length === 0;
    }
}
