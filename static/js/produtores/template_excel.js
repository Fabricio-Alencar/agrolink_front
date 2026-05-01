document.getElementById("btnBaixarTemplate").onclick = function() {
    // 1. Caminho para o seu arquivo modelo
    const caminhoArquivo = "../../static/assets/modelo_produtos.xlsx";
    
    // 2. Criar um elemento de link temporário
    const linkTemporario = document.createElement("a");
    linkTemporario.href = caminhoArquivo;
    
    // 3. Define o nome que o arquivo terá ao ser baixado
    linkTemporario.download = "modelo_produtos.xlsx";
    
    // 4. Adiciona ao corpo da página, clica e remove
    document.body.appendChild(linkTemporario);
    linkTemporario.click();
    document.body.removeChild(linkTemporario);

    // 5. Opcional: Notificar o usuário com a sua função global
    if (typeof exibirNotificacao === "function") {
        exibirNotificacao('planilha', 'Download do modelo iniciado!');
    }
};