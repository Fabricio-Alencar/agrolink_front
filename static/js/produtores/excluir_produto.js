/**
 * ARQUIVO: exclusao.js
 * OBJETIVO: Gerenciar o fluxo de exclusão de produtos
 */

// Variável de escopo global para o arquivo: armazena temporariamente o ID
// do produto que o usuário clicou, para ser usado no momento da confirmação final.
let idGlobalParaExcluir = null;


// PREPARA A EXCLUSÃO
function prepararExclusao(id, nome) {
    idGlobalParaExcluir = id; // Guarda o ID para o próximo passo
    
    // Altera o texto do modal dinamicamente para que o usuário saiba exatamente o que está deletando
    document.getElementById("mensagemExcluir").innerHTML = `Excluir o produto <strong>${nome}</strong>?`;
    
    // Abre o modal visualmente adicionando a classe de ativação
    document.getElementById("modalExcluir").classList.add("active");
}

/**
 * EVENTO DE CONFIRMAÇÃO
 * Atribuído ao botão "Confirmar" dentro do modal de exclusão.
 */
document.getElementById("btnConfirmarExclusao").onclick = async (event) => {
    // Evita comportamentos padrão (como recarregar a página antes da hora se for um <form>)
    if (event) event.preventDefault();

    // Só prossegue se houver um ID válido armazenado
    if (idGlobalParaExcluir) {
        try {
            // 🚀 CHAMA A API: Faz a requisição DELETE para o backend via objeto API centralizado
            const resultado = await API.excluirProduto(idGlobalParaExcluir);

            if (resultado) {
                // 🔔 SUCESSO: Exibe a notificação para o usuário
                exibirNotificacao('exclusao', 'Produto removido com sucesso!');
                // 🔄 ATUALIZAÇÃO: Força o recarregamento da página para limpar o item excluído da lista
                await renderProdutos(); 
            } else {
                // Erro lógico (ex: o servidor não autorizou a exclusão)
                exibirNotificacao('exclusao', 'Erro ao excluir no servidor.');
            }

        } catch (error) {
            // Erro de rede ou servidor fora do ar
            console.error("Erro:", error);
            exibirNotificacao('erro', 'Falha na conexão.');
        } finally {
            /**
             * BLOCO FINALLY: Executa sempre, independente de dar certo ou errado.
             * Garante que o modal feche e o ID global seja limpo para a próxima ação.
             */
            fecharModalExcluir();
            idGlobalParaExcluir = null;
        }
    }
};

/**
 * FECHAR MODAL
 * Apenas remove a classe visual de ativação do modal de exclusão.
 */
function fecharModalExcluir() {
    document.getElementById("modalExcluir").classList.remove("active");
}