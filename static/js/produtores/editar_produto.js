/**
 * ARQUIVO: editar_produto.js
 * OBJETIVO: Lógica para edição recebendo o objeto direto da lista.
 */

async function prepararEdicao(produto) {
    if (!produto) return;

    const { preview, placeholder, btnRemover } = window.uploadElements;

    document.querySelector("#modalProduto h2").innerText = "Editar Produto";
    document.getElementById("editandoNomeOriginal").value = produto.id; 

    document.getElementById("nomeProduto").value = produto.nome;
    document.getElementById("categoriaProduto").value = produto.categoria;
    document.getElementById("unidadeProduto").value = produto.unidade;
    document.getElementById("descricaoProduto").value = produto.descricao || "";
    document.getElementById("precoProduto").value = produto.preco;
    document.getElementById("quantidadeProduto").value = produto.quantidade;

    // 🔹 IMAGEM
    if (produto.foto) {

        let caminhoFoto;

        if (produto.foto.startsWith('http')) {
            caminhoFoto = produto.foto;
        } else if (produto.foto.startsWith('/static')) {
            caminhoFoto = `${API_URL}${produto.foto}`;
        } else {
            caminhoFoto = `${API_URL}/static/uploads/produtos/${produto.foto}`;
        }

        preview.src = caminhoFoto;

        preview.onerror = () => {
            preview.onerror = null;
            preview.src = `${API_URL}/static/uploads/produtos/foto_generica.png`;
        };

        preview.style.display = "block";
        placeholder.style.display = "none";
        btnRemover.style.display = "block";

    } else {
        preview.src = "../static/uploads/produtos/foto_generica.png";
        preview.style.display = "block";
        placeholder.style.display = "none";
        btnRemover.style.display = "block";
    }

    document.getElementById("modalProduto").classList.add("active");
    atualizarLabelsUnidade();
}

async function executarEdicao(formData) {
    const idParaEditar = document.getElementById("editandoNomeOriginal").value;
    if (!idParaEditar || !formData) return;

    try {
        const resultado = await API.atualizarProduto(idParaEditar, formData);
        
        if (resultado && !resultado.erro) {
            exibirNotificacao('edicao', "Alterações salvas com sucesso!");
            fecharModal();
            await renderProdutos();
        } else {
            exibirNotificacao('erro', resultado?.erro || "Erro ao atualizar!");
        }

    } catch (error) {
        console.error("Erro na edição:", error);
        exibirNotificacao('erro', "Erro de conexão com o servidor!");
    }
}
