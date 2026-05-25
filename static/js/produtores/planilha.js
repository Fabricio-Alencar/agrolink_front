/**
 * ARQUIVO: planilha.js
 * OBJETIVO: Processar arquivos Excel, validar dados locais adaptados às classes CSS fornecidas,
 * e enviar os produtos aprovados via API.
 */

let listaProdutosValidos = [];

// --- Controle do Modal ---

function abrirModalPlanilha() {
    document.getElementById("modalPlanilha").classList.add("active");
    resetarModalPlanilha();
}

function fecharModalPlanilha() {
    document.getElementById("modalPlanilha").classList.remove("active");
}

function resetarModalPlanilha() {
    // Alterna os estados usando a classe comum .estado-planilha e gerenciando o .active do CSS
    document.getElementById("estadoUpload").classList.add("active");
    document.getElementById("estadoResultado").classList.remove("active");
    
    const campoInput = document.getElementById("inputPlanilha");
    if (campoInput) campoInput.value = "";
    listaProdutosValidos = [];
}

// --- Processamento Excel ---

const zonaDrop = document.getElementById("dropZonePlanilha");
const seletorArquivo = document.getElementById("inputPlanilha");

if (zonaDrop) {
    // Alinhado com a classe .upload-zone.drag-over do seu CSS
    zonaDrop.addEventListener("dragover", (e) => { e.preventDefault(); zonaDrop.classList.add("drag-over"); });
    zonaDrop.addEventListener("dragleave", () => zonaDrop.classList.remove("drag-over"));
    zonaDrop.addEventListener("drop", (e) => {
        e.preventDefault();
        zonaDrop.classList.remove("drag-over");
        if (e.dataTransfer.files.length) processarArquivoExcel(e.dataTransfer.files[0]);
    });
}

if (seletorArquivo) {
    seletorArquivo.addEventListener("change", (e) => {
        if (e.target.files.length) processarArquivoExcel(e.target.files[0]);
    });
}

function processarArquivoExcel(arquivo) {
    const nomeMinusculo = arquivo.name.toLowerCase();
    if (!nomeMinusculo.endsWith('.xlsx') && !nomeMinusculo.endsWith('.xls')) {
        exibirNotificacao('exclusao', "Erro: Apenas arquivos Excel!");
        return;
    }

    // Se tiver um elemento para exibir o nome do arquivo atual
    const elNome = document.getElementById("nomeArquivo");
    if (elNome) elNome.innerText = arquivo.name;

    const leitor = new FileReader();

    leitor.onload = (e) => {
        try {
            const binario = e.target.result;
            const livroExcel = XLSX.read(binario, { type: 'binary' });
            const nomePrimeiraAba = livroExcel.SheetNames[0];
            const aba = livroExcel.Sheets[nomePrimeiraAba];

            const linhasMatriz = XLSX.utils.sheet_to_json(aba, { header: 1 });

            let indiceCabecalho = -1;
            for (let i = 0; i < linhasMatriz.length; i++) {
                const linha = linhasMatriz[i];
                if (linha && linha.length > 0) {
                    const temNome = linha.some(c => c && c.toString().toLowerCase().includes("nome"));
                    const temCategoria = linha.some(c => c && c.toString().toLowerCase().includes("categoria"));
                    if (temNome && temCategoria) {
                        indiceCabecalho = i;
                        break;
                    }
                }
            }

            if (indiceCabecalho === -1) {
                exibirNotificacao('exclusao', "Não foi possível encontrar as colunas de produtos na planilha.");
                return;
            }

            const cabecalhosBrutos = linhasMatriz[indiceCabecalho];
            const cabecalhosLimpos = cabecalhosBrutos.map(coluna => {
                if (!coluna) return "";
                return coluna.toString().toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                    .replace(/[^a-z0-9]/g, ""); // Limpeza total do '$' e caracteres especiais
            });

            let dadosNormalizados = [];
            for (let i = indiceCabecalho + 1; i < linhasMatriz.length; i++) {
                const linhaDados = linhasMatriz[i];
                
                if (!linhaDados || linhaDados.length === 0 || linhaDados.every(c => c === null || c === undefined || c === '')) {
                    continue; 
                }

                const novaLinha = {};
                cabecalhosLimpos.forEach((colunaLimpa, indexCol) => {
                    if (colunaLimpa) {
                        novaLinha[colunaLimpa] = linhaDados[indexCol] !== undefined ? linhaDados[indexCol] : "";
                    }
                });

                novaLinha._linhaExcelOriginal = i + 1;
                dadosNormalizados.push(novaLinha);
            }

            validarDadosDaPlanilha(dadosNormalizados);

        } catch (erroParsing) {
            console.error("Erro ao processar a planilha:", erroParsing);
            exibirNotificacao('exclusao', "Erro crítico ao ler a estrutura do arquivo.");
        }
    };
    leitor.readAsBinaryString(arquivo);
}

// --- Mapeamento e Validação Local ---

function validarDadosDaPlanilha(produtosRecebidos) {
    let listaDeErrosEncontrados = [];
    listaProdutosValidos = [];

    const categoriasValidas = ["frutas", "legumes", "hortalicas", "graos", "oleaginosas", "ervas", "outros"];
    const unidadesValidas = ["kg", "g", "arroba", "t", "unidade", "duzia", "cento", "milheiro", "caixa", "saca", "maco", "bandeja", "litro"];

    produtosRecebidos.forEach((item) => {
        let errosDesteProduto = [];
        const numeroLinhaReal = item._linhaExcelOriginal || 2;

        const nome = item.nomedoproduto || item.nome;
        if (!nome) errosDesteProduto.push("Nome do produto é obrigatório");
        
        let categoriaRaw = item.categoria || "";
        let catTratada = categoriaRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (catTratada === "fruta") catTratada = "frutas";
        if (catTratada === "legume") catTratada = "legumes";
        if (catTratada === "hortalica") catTratada = "hortalicas";
        if (catTratada.includes("grao") || catTratada.includes("cereais")) catTratada = "graos";
        if (catTratada.includes("oleaginosa") || catTratada.includes("semente")) catTratada = "oleaginosas";
        if (catTratada.includes("erva") || catTratada.includes("tempero")) catTratada = "ervas";

        if (!catTratada || !categoriasValidas.includes(catTratada)) {
            errosDesteProduto.push(`Categoria inválida ("${categoriaRaw || 'Vazia'}")`);
        }

        let unidadeRaw = item.formadevendaunidadedemedida || item.unidade || item.unidadedemedida || "";
        let unidadeTratada = unidadeRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        
        if (unidadeTratada.includes("arroba")) unidadeTratada = "arroba";
        else if (unidadeTratada.includes("quilograma") || unidadeTratada.includes("kg")) unidadeTratada = "kg";
        else if (unidadeTratada.includes("grama") || unidadeTratada.includes("g")) unidadeTratada = "g";
        else if (unidadeTratada.includes("unidade") || unidadeTratada.includes("un")) unidadeTratada = "unidade";
        else if (unidadeTratada.includes("duzia")) unidadeTratada = "duzia";
        else if (unidadeTratada.includes("cento")) unidadeTratada = "cento";
        else if (unidadeTratada.includes("milheiro")) unidadeTratada = "milheiro";
        else if (unidadeTratada.includes("saca")) unidadeTratada = "saca";
        else if (unidadeTratada.includes("maco")) unidadeTratada = "maco";
        else if (unidadeTratada.includes("litro")) unidadeTratada = "litro";
        else if (unidadeTratada.includes("caixa")) unidadeTratada = "caixa";
        else if (unidadeTratada.includes("bandeja")) unidadeTratada = "bandeja";
        else if (unidadeTratada.includes("tonelada") || unidadeTratada === "t") unidadeTratada = "t";

        if (!unidadeTratada || !unidadesValidas.includes(unidadeTratada)) {
            errosDesteProduto.push(`Forma de Venda inválida ("${unidadeRaw || 'Vazia'}")`);
        }

        const precoRaw = item.precorporunidadeescolhida || item.precor || item.preco;
        const preco = parseFloat(precoRaw);
        if (isNaN(preco) || preco <= 0) errosDesteProduto.push("Preço deve ser maior que zero");
        
        const qtdRaw = item.estoquedisponivelnaunidadeescolhida || item.quantidade || item.estoque;
        const qtd = parseFloat(qtdRaw);
        if (isNaN(qtd) || qtd < 0) errosDesteProduto.push("Estoque inválido ou negativo");

        const descricao = item.descricaoopcional || item.descricao || "Importado via planilha.";

        if (errosDesteProduto.length > 0) {
            listaDeErrosEncontrados.push({ linha: numeroLinhaReal, nome: nome || "Sem Nome", detalhes: errosDesteProduto });
        } else {
            listaProdutosValidos.push({
                identificadorTemporario: numeroLinhaReal,
                nome: nome,
                categoria: catTratada,
                unidade: unidadeTratada,
                precoOriginal: preco, 
                quantidadeOriginal: qtd,
                descricao: descricao,
                status: "publicado", 
                exibicaoPreco: `R$ ${preco.toFixed(2).replace('.', ',')} / ${unidadeTratada}`,
                exibicaoQuantidade: `${qtd} (${unidadeTratada}) em estoque`
            });
        }
    });

    apresentarResultadosNoModal(listaProdutosValidos.length, listaDeErrosEncontrados);
}

// --- Renderização baseada no seu novo CSS ---

function mudarStatusImportacao(id, novoStatus) {
    const produto = listaProdutosValidos.find(p => p.identificadorTemporario === id);
    if (produto) produto.status = novoStatus;
}

function apresentarResultadosNoModal(totalValidos, listaErros) {
    // Altera visibilidade das telas .estado-planilha
    document.getElementById("estadoUpload").classList.remove("active");
    document.getElementById("estadoResultado").classList.add("active");

    // Alimenta os valores numéricos das Badges (.badge-sucesso e .badge-erro)
    document.getElementById("qtdValidos").innerText = totalValidos;
    document.getElementById("qtdErros").innerText = listaErros.length;

    // Seleciona os containers de renderização (Devem conter a classe .lista-erros-container para o scroll funcionar)
    const divErros = document.getElementById("listaErros");
    const divValidos = document.getElementById("listaValidos"); 
    
    divErros.innerHTML = "";
    divValidos.innerHTML = "";

    // Exibe ou oculta as seções com base na existência de itens
    document.getElementById("secaoErros").style.display = listaErros.length > 0 ? "block" : "none";
    document.getElementById("secaoValidos").style.display = totalValidos > 0 ? "block" : "none";

    // 1. Renderiza os Cards de Erro respeitando rigorosamente a árvore do seu CSS
    listaErros.forEach(erro => {
        divErros.innerHTML += `
            <div class="card-erro-planilha">
                <div class="card-erro-header">
                    <h4>${erro.nome}</h4>
                </div>
                <div class="card-erro-info">
                    <p>Localizado na <strong>Linha ${erro.linha}</strong> do arquivo Excel.</p>
                </div>
                <div class="card-erro-motivos">
                    <p>Inconsistências encontradas:</p>
                    <ul>
                        ${erro.detalhes.map(d => `<li>${d}</li>`).join("")}
                    </ul>
                </div>
            </div>`;
    });

    // 2. Renderiza os Cards Válidos adaptando a mesma estrutura, mas aplicando tons verdes elegantes inline
    listaProdutosValidos.forEach(p => {
        divValidos.innerHTML += `
            <div class="card-erro-planilha" style="border-color: #c8e6c9; background-color: #f9fdf9;">
                <div class="card-erro-header">
                    <h4 style="color: #2e7d32;">${p.nome}</h4>
                    <select onchange="mudarStatusImportacao(${p.identificadorTemporario}, this.value)" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; cursor: pointer;">
                        <option value="publicado" ${p.status === 'publicado' ? 'selected' : ''}>Publicar</option>
                        <option value="rascunho" ${p.status === 'rascunho' ? 'selected' : ''}>Salvar Rascunho</option>
                    </select>
                </div>
                <div class="card-erro-info">
                    <p><strong>Estoque mapeado:</strong> ${p.exibicaoQuantidade}</p>
                    <p><strong>Preço unitário:</strong> ${p.exibicaoPreco}</p>
                </div>
            </div>`;
    });

    // Atualiza o botão de finalização
    const btn = document.getElementById("btnConfirmarPlanilha");
    btn.disabled = totalValidos === 0;
    btn.innerText = `Importar ${totalValidos} Produtos`;
}

// --- Importação Final via API ---

document.getElementById("btnConfirmarPlanilha").onclick = async () => {
    if (listaProdutosValidos.length === 0) return;

    const btn = document.getElementById("btnConfirmarPlanilha");
    btn.disabled = true;
    btn.innerText = "Enviando para o Servidor...";

    let totalSucessos = 0;
    let listaErrosServidor = [];
    let produtosQueFalharam = [];

    for (const produto of listaProdutosValidos) {
        try {
            const formData = new FormData();
            formData.append("nomeProduto", produto.nome);
            formData.append("categoriaProduto", produto.categoria);
            formData.append("precoProduto", produto.precoOriginal);
            formData.append("unidadeProduto", produto.unidade);
            formData.append("quantidadeProduto", produto.quantidadeOriginal);
            formData.append("descricaoProduto", produto.descricao);
            formData.append("statusProduto", produto.status); 

            const resposta = await API.criarProduto(formData);

            if (resposta && !resposta.erro) {
                totalSucessos++;
            } else {
                listaErrosServidor.push({
                    linha: "API",
                    nome: produto.nome,
                    detalhes: [resposta?.erro || "Recusado pelas regras do servidor."]
                });
                produtosQueFalharam.push(produto);
            }
        } catch (error) {
            listaErrosServidor.push({
                linha: "Rede",
                nome: produto.nome,
                detalhes: ["Falha crítica de comunicação com o servidor."]
            });
            produtosQueFalharam.push(produto);
        }
    }

    if (totalSucessos > 0) {
        await renderProdutos();
        const plural = totalSucessos > 1 ? "s" : "";
        exibirNotificacao('cadastro', `${totalSucessos} produto${plural} adicionado${plural}!`);
    }

    if (listaErrosServidor.length > 0) {
        listaProdutosValidos = produtosQueFalharam;
        apresentarResultadosNoModal(listaProdutosValidos.length, listaErrosServidor);
        exibirNotificacao('erro', `${listaErrosServidor.length} produto(s) falharam no processamento externo.`);
    } else {
        fecharModalPlanilha();
    }
};
