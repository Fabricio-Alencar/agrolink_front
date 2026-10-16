const modalInfoNegociacao = document.getElementById("modalInfoNegociacao");
const btnInfoChat = document.getElementById("btnInfoChat");
const btnFecharInfo = document.getElementById("btnFecharInfo");

const infoDataRecebido = document.getElementById("infoDataRecebido");
const infoProdutoFoto = document.getElementById("infoProdutoFoto");
const infoProduto = document.getElementById("infoProduto");
const infoQuantidade = document.getElementById("infoQuantidade");
const infoPreco = document.getElementById("infoPreco");
const infoUnidade = document.getElementById("infoUnidade");
const infoTotal = document.getElementById("infoTotal");
const infoDataEntrega = document.getElementById("infoDataEntrega");
const infoStatus = document.getElementById("infoStatus");
const infoTelefone = document.getElementById("infoTelefone");
const infoEmail = document.getElementById("infoEmail");
const infoDescricao = document.getElementById("infoDescricao");
const infoDescricaoContainer = document.getElementById("infoDescricaoContainer");
const infoNegociante = document.getElementById("infoNegociante");

let negociacaoDetalhesAtual = null;

function formatarPreco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "-";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "-";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    if (!data) {
        return "-";
    }

    // Evita alterações de dia ao interpretar datas sem horário.
    const correspondencia = String(data).match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (correspondencia) {
        return `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`;
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
        return "-";
    }

    return dataConvertida.toLocaleDateString("pt-BR");
}

function formatarStatus(status) {
    if (!status) {
        return "-";
    }

    const statusFormatado = {
        pendente: "Pendente",
        aceito: "Aceito",
        recusado: "Recusado",
        "aguardando pagamento": "Aguardando pagamento",
        em_entrega: "Em entrega",
        entregue: "Entregue",
        finalizado: "Finalizado",
        cancelado: "Cancelado"
    };

    const chave = String(status).trim().toLowerCase();

    return statusFormatado[chave] ||
        chave.charAt(0).toUpperCase() + chave.slice(1).replaceAll("_", " ");
}

function preencherImagemProduto(url) {
    if (!infoProdutoFoto) {
        return;
    }

    const fallback = infoProdutoFoto.parentElement?.querySelector(
        ".info-produto-fallback"
    );

    if (!url) {
        infoProdutoFoto.removeAttribute("src");
        infoProdutoFoto.hidden = true;

        if (fallback) {
            fallback.hidden = false;
        }

        return;
    }

    infoProdutoFoto.onerror = () => {
        infoProdutoFoto.hidden = true;

        if (fallback) {
            fallback.hidden = false;
        }
    };

    infoProdutoFoto.onload = () => {
        infoProdutoFoto.hidden = false;

        if (fallback) {
            fallback.hidden = true;
        }
    };

    infoProdutoFoto.src = url;
}

function preencherDetalhesNegociacao(detalhes) {
    if (!detalhes) {
        return;
    }

    // Cabeçalho do pedido
    if (infoDataRecebido) {
        const dataRecebido = formatarData(detalhes.data_criacao);

        infoDataRecebido.textContent =
            dataRecebido !== "-"
                ? `Recebido em ${dataRecebido}`
                : `Pedido #${detalhes.id ?? "-"}`;
    }

    // Produto
    if (infoProduto) {
        infoProduto.textContent =
            detalhes.produto_nome ||
            detalhes.nome_produto ||
            detalhes.produto ||
            "-";
    }

    preencherImagemProduto(detalhes.produto_foto);

    // Quantidade
    const quantidade = Number(detalhes.quantidade);
    const quantidadeValida =
        detalhes.quantidade !== null &&
        detalhes.quantidade !== undefined &&
        detalhes.quantidade !== "" &&
        Number.isFinite(quantidade);

    if (infoQuantidade) {
        infoQuantidade.textContent = quantidadeValida
            ? quantidade.toLocaleString("pt-BR")
            : "-";
    }

    // Preço por unidade
    const preco = detalhes.produto_preco ?? detalhes.preco;
    const precoNumerico = Number(preco);

    const precoValido =
        preco !== null &&
        preco !== undefined &&
        preco !== "" &&
        Number.isFinite(precoNumerico);

    if (infoPreco) {
        infoPreco.textContent = formatarPreco(preco);
    }

    if (infoUnidade) {
        const unidade =
            detalhes.produto_unidade ||
            detalhes.unidade ||
            "";

        infoUnidade.textContent = unidade ? ` / ${unidade}` : "";
    }

    // Valor total estimado do produto
    if (infoTotal) {
        infoTotal.textContent =
            quantidadeValida && precoValido
                ? formatarPreco(quantidade * precoNumerico)
                : "-";
    }

    // Data de entrega
    if (infoDataEntrega) {
        infoDataEntrega.textContent = formatarData(
            detalhes.data_entrega
        );
    }

    // Contato da outra pessoa na negociação
    if (infoNegociante) {
        infoNegociante.textContent =
            detalhes.negociante_nome ||
            detalhes.nome_outro_usuario ||
            detalhes.nome_usuario ||
            detalhes.nome ||
            "-";
    }

    if (infoTelefone) {
        infoTelefone.textContent = detalhes.negociante_telefone || "-";
    }

    if (infoEmail) {
        infoEmail.textContent = detalhes.negociante_email || "-";
    }

    // Status do pedido
    if (infoStatus) {
        const statusOriginal = String(detalhes.status || "").toLowerCase();

        infoStatus.textContent = formatarStatus(detalhes.status);

        infoStatus.classList.remove(
            "status-pendente",
            "status-aceito",
            "status-recusado",
            "status-entrega",
            "status-finalizado",
            "status-cancelado"
        );

        const classesStatus = {
            pendente: "status-pendente",
            aceito: "status-aceito",
            "aguardando pagamento": "status-pendente",
            em_entrega: "status-entrega",
            entregue: "status-finalizado",
            finalizado: "status-finalizado",
            recusado: "status-recusado",
            cancelado: "status-cancelado"
        };

        infoStatus.classList.add(
            classesStatus[statusOriginal] || "status-pendente"
        );
    }

    // Descrição opcional
    if (infoDescricao && infoDescricaoContainer) {
        const descricao = String(detalhes.descricao || "").trim();

        infoDescricao.textContent = descricao;
        infoDescricaoContainer.hidden = !descricao;
    }
}

export function atualizarInfoNegociacao(detalhes) {
    negociacaoDetalhesAtual = detalhes;
}

export function abrirModalInfo() {
    if (!negociacaoDetalhesAtual || !modalInfoNegociacao) {
        return;
    }

    preencherDetalhesNegociacao(negociacaoDetalhesAtual);

    modalInfoNegociacao.style.display = "flex";
    modalInfoNegociacao.setAttribute("aria-hidden", "false");

    btnFecharInfo?.focus();
}

export function fecharModalInfo() {
    if (!modalInfoNegociacao) {
        return;
    }

    // Remove o foco de elementos que estão dentro do modal.
    if (modalInfoNegociacao.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    // Esconde o modal.
    modalInfoNegociacao.style.display = "none";
    modalInfoNegociacao.setAttribute("aria-hidden", "true");

    // Devolve o foco ao botão que abriu o modal.
    btnInfoChat?.focus();
}

btnInfoChat?.addEventListener("click", abrirModalInfo);
btnFecharInfo?.addEventListener("click", fecharModalInfo);

modalInfoNegociacao?.addEventListener("click", event => {
    if (event.target === modalInfoNegociacao) {
        fecharModalInfo();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        modalInfoNegociacao &&
        modalInfoNegociacao.style.display !== "none"
    ) {
        fecharModalInfo();
    }
});