/**
 * SISTEMA GLOBAL DE NOTIFICAÇÕES (TOAST)
    * Esta função é responsável por criar e exibir um balão de notificação (toast) na tela, com base no tipo de ação realizada (cadastro, edição ou exclusão).
 */

function exibirNotificacao(tipo, mensagem) {
    // 1. Tenta localizar o container onde as notificações ficam empilhadas
    let container = document.getElementById("toast-container");
    
    // 2. Se o container não existir (primeira vez), ele é criado e injetado no body
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    // 3. Cria o elemento div da notificação individual
    const notificacao = document.createElement("div");
    let caminhoIcone = "";
    let classeEstilo = "";

    // 4. Define a identidade visual (CSS e Imagem) baseada no tipo de ação
    switch (tipo) {
        case 'cadastro':
            caminhoIcone = "../static/assets/produto_cadastrado.png";
            classeEstilo = "notificacao-sucesso";
            break;
        case 'edicao':
            caminhoIcone = "../static/assets/produto_editado.png";
            classeEstilo = "notificacao-edicao";
            break;
        case 'exclusao':
            caminhoIcone = "../static/assets/produto_excluido.png";
            classeEstilo = "notificacao-exclusao";
            break;
        case 'erro':
            caminhoIcone = "../static/assets/erro.png";
            classeEstilo = "notificacao-erro";
            break;
        default:
            caminhoIcone = "../static/assets/generica.png";
            classeEstilo = "notificacao-generica";
    }

    // 5. Monta a estrutura interna da notificação com ícone e texto
    notificacao.className = `notificacao-base ${classeEstilo}`;
    notificacao.innerHTML = `
        <img src="${caminhoIcone}" class="notificacao-icone" alt="ícone">
        <span class="notificacao-texto">${mensagem}</span>
    `;

    // 6. Adiciona a notificação ao container na tela
    container.appendChild(notificacao);

    // 7. Lógica de auto-remoção:
    // Após 4 segundos, adiciona classe de animação de saída.
    // 500ms depois (tempo da animação), remove o elemento do DOM.
    setTimeout(() => {
        notificacao.classList.add("saindo");
        setTimeout(() => notificacao.remove(), 500);
    }, 4000); 
}

/**
 * AGENDA UMA NOTIFICAÇÃO
 * Útil para casos onde a página vai recarregar (Ex: window.location.reload()).
 * Salva os dados no sessionStorage (memória temporária do navegador).
 */
function agendarNotificacao(tipo, mensagem) {
    // Converte o objeto em string JSON para salvar no navegador
    sessionStorage.setItem("notificacao_pendente", JSON.stringify({ tipo, mensagem }));
}

/**
 * OUVINTE DE CARREGAMENTO (DOMContentLoaded)
 * Sempre que qualquer página do sistema carregar, este código executa.
 * Ele verifica se há alguma notificação "na fila" para ser mostrada.
 */
window.addEventListener("DOMContentLoaded", () => {
    // Tenta buscar algo salvo na chave 'notificacao_pendente'
    const pendente = sessionStorage.getItem("notificacao_pendente");
    
    if (pendente) {
        // Converte de volta para objeto JS
        const dados = JSON.parse(pendente);
        // Chama a função visual para mostrar o balão
        exibirNotificacao(dados.tipo, dados.mensagem);
        // Remove do armazenamento para que o aviso não reapareça se o usuário der F5 novamente
        sessionStorage.removeItem("notificacao_pendente");
    }
});