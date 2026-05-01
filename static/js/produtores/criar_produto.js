/**
 * ARQUIVO: criar_produto.js
 * OBJETIVO: Lógica exclusiva para criação de novos produtos.
 */

// CRIAÇÃO DE PRODUTO: Envia os dados do formulário para a API e lida com a resposta
async function executarCriacao(formData) {
    // 🛡️ Prevenção: Se não houver dados, não faz nada.
    if (!formData) return;
    try {        
        // 🚀 ENVIANDO: Chama a API centralizada (api.js)
        const resultado = await API.criarProduto(formData);

        // Verifica se a resposta foi bem-sucedida (não nula e sem campo de erro)
        if (resultado && !resultado.erro) {
            // 🔔 NOTIFICAÇÃO: Usa a função de exibir para mostrar o aviso após o reload
            if (typeof exibirNotificacao === 'function') {
                exibirNotificacao('cadastro', "Produto cadastrado com sucesso!");
            }
            // 🧹 LIMPEZA E FECHAMENTO: Fecha o modal antes de recarregar
            fecharModal();
            // 🔄 ATUALIZAÇÃO: Recarrega a página para exibir o novo card na lista
            await renderProdutos(); 
        } else {
            // Caso o backend retorne um erro específico (ex: validação ou banco)
            exibirNotificacao('erro', resultado?.erro || "Erro ao salvar!");
        }
    } catch (error) {
        // Erro de rede (servidor offline ou problema de conexão)
        console.error("🚨 Erro na criação:", error);
        exibirNotificacao('erro', "Erro de conexão com o servidor!");
    }
}

/**
 * FUNÇÃO PARA ABRIR O MODAL LIMPO
 * Prepara a interface visual especificamente para um novo cadastro.
 */
function abrirModalCriar() {
    fecharModal(); // Garante que todos os campos e IDs anteriores foram limpos
    
    // Altera o título do modal para o contexto de criação
    document.querySelector("#modalProduto h2").innerText = "Adicionar Produto";
    
    // Exibe o modal na tela
    document.getElementById("modalProduto").classList.add("active");
}