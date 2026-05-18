/**
 * ARQUIVO: editar_produto.js
 * OBJETIVO:
 * Lógica para edição de produtos.
 */


// =========================
// PREPARA EDIÇÃO
// =========================
async function prepararEdicao(produto) {

    // 🛡️ valida produto
    if (!produto) return;

    // elementos upload
    const {
        preview,
        placeholder,
        btnRemover
    } = window.uploadElements;

    // =========================
    // ALTERA TÍTULO
    // =========================
    document.querySelector(
        "#modalProduto h2"
    ).innerText = "Editar Produto";

    // salva ID
    document.getElementById(
        "editandoNomeOriginal"
    ).value = produto.id;

    // =========================
    // PREENCHE CAMPOS
    // =========================
    document.getElementById(
        "nomeProduto"
    ).value = produto.nome;

    document.getElementById(
        "categoriaProduto"
    ).value = produto.categoria;

    document.getElementById(
        "unidadeProduto"
    ).value = produto.unidade;

    document.getElementById(
        "descricaoProduto"
    ).value = produto.descricao || "";

    document.getElementById(
        "precoProduto"
    ).value = produto.preco;

    document.getElementById(
        "quantidadeProduto"
    ).value = produto.quantidade;

    // =========================
    // IMAGEM
    // =========================
    if (produto.foto) {

        // 📸 URL direta Azure Blob Storage
        preview.src = produto.foto;

        // fallback caso imagem falhe
        preview.onerror = () => {

            preview.onerror = null;

            preview.src =
                "https://via.placeholder.com/300x300.png?text=Sem+Imagem";
        };

        preview.style.display = "block";

        placeholder.style.display = "none";

        btnRemover.style.display = "block";

    } else {

        // imagem padrão
        preview.src =
            "https://via.placeholder.com/300x300.png?text=Sem+Imagem";

        preview.style.display = "block";

        placeholder.style.display = "none";

        btnRemover.style.display = "block";
    }

    // =========================
    // ABRE MODAL
    // =========================
    document
        .getElementById("modalProduto")
        .classList.add("active");

    // atualiza labels
    atualizarLabelsUnidade();
}


// =========================
// EXECUTA EDIÇÃO
// =========================
async function executarEdicao(formData) {

    // pega ID
    const idParaEditar =
        document.getElementById(
            "editandoNomeOriginal"
        ).value;

    // valida
    if (!idParaEditar || !formData) return;

    try {

        // 🚀 chama API
        const resultado =
            await API.atualizarProduto(
                idParaEditar,
                formData
            );

        // ✅ sucesso
        if (resultado && !resultado.erro) {

            exibirNotificacao(
                'edicao',
                "Alterações salvas com sucesso!"
            );

            // fecha modal
            fecharModal();

            // atualiza lista
            await renderProdutos();

        } else {

            // ❌ erro backend
            exibirNotificacao(
                'erro',
                resultado?.erro ||
                "Erro ao atualizar!"
            );
        }

    } catch (error) {

        // ❌ erro rede
        console.error(
            "Erro na edição:",
            error
        );

        exibirNotificacao(
            'erro',
            error.message ||
            "Erro de conexão com servidor!"
        );
    }
}
