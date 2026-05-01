/**
 * ARQUIVO: planilha.js
 * OBJETIVO: Processar arquivos Excel, validar dados e importar para a API centralizada.
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

    document.getElementById("nomeArquivo").innerText = arquivo.name;
    const leitor = new FileReader();

    leitor.onload = (e) => {
        const binario = e.target.result;
        const livroExcel = XLSX.read(binario, { type: 'binary' });
        const dadosPlanilha = XLSX.utils.sheet_to_json(livroExcel.Sheets[livroExcel.SheetNames[0]]);

        // Normaliza nomes das colunas (tira acentos, espaços e deixa minusculo)
        const dadosNormalizados = dadosPlanilha.map(linha => {
            const novaLinha = {};
            for (let coluna in linha) {
                const colunaLimpa = coluna.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, '');
                novaLinha[colunaLimpa] = linha[coluna];
            }
            return novaLinha;
        });

        validarDadosDaPlanilha(dadosNormalizados);
    };
    leitor.readAsBinaryString(arquivo);
}

// --- Validação ---

function validarDadosDaPlanilha(produtosRecebidos) {
    let listaDeErrosEncontrados = [];
    listaProdutosValidos = [];
    const categoriasPermitidas = ['fruta', 'frutas', 'legume', 'legumes', 'hortalica', 'hortalicas', 'grao', 'graos'];

    produtosRecebidos.forEach((item, indice) => {
        let errosDesteProduto = [];
        const nome = item.nomedoproduto || item.nome;

        if (!nome) errosDesteProduto.push("Nome é obrigatório");
        
        const catTratada = (item.categoria || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!catTratada || !categoriasPermitidas.includes(catTratada)) errosDesteProduto.push("Categoria inválida");

        const preco = parseFloat(item.precor || item.preco);
        if (isNaN(preco) || preco <= 0) errosDesteProduto.push("Preço inválido");
        
        const qtd = parseFloat(item.quantidade);
        if (isNaN(qtd) || qtd <= 0) errosDesteProduto.push("Quantidade inválida");

        if (errosDesteProduto.length > 0) {
            listaDeErrosEncontrados.push({ linha: indice + 2, nome: nome || "Sem Nome", detalhes: errosDesteProduto });
        } else {
            listaProdutosValidos.push({
                identificadorTemporario: indice,
                nome: nome,
                img: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
                categoria: item.categoria,
                descricao: item.descricao || "Importado via planilha.",
                preco: `R$ ${preco.toFixed(2).replace('.', ',')}/${item.unidade || 'un'}`,
                quantidade: `${qtd} ${item.unidade || 'un'} disponíveis`,
                status: "publicado" 
            });
        }
    });

    apresentarResultadosNoModal(listaProdutosValidos.length, listaDeErrosEncontrados);
}

// --- Renderização no Modal ---

function mudarStatusImportacao(id, novoStatus) {
    const produto = listaProdutosValidos.find(p => p.identificadorTemporario === id);
    if (produto) produto.status = novoStatus;
}

function apresentarResultadosNoModal(totalValidos, listaErros) {
    document.getElementById("estadoUpload").classList.remove("active");
    document.getElementById("estadoResultado").classList.add("active");

    document.getElementById("qtdValidos").innerText = totalValidos;
    document.getElementById("qtdErros").innerText = listaErros.length;

    const divErros = document.getElementById("listaErros");
    const divValidos = document.getElementById("listaValidos");
    
    divErros.innerHTML = "";
    divValidos.innerHTML = "";

    listaErros.forEach(erro => {
        divErros.innerHTML += `
            <div class="card-erro-planilha">
                <h4>${erro.nome} (Linha ${erro.linha})</h4>
                <ul>${erro.detalhes.map(d => `<li>${d}</li>`).join("")}</ul>
            </div>`;
    });

    listaProdutosValidos.forEach(p => {
        divValidos.innerHTML += `
            <div class="card-erro-planilha valid">
                <div class="card-erro-header">
                    <h4>${p.nome}</h4>
                    <select onchange="mudarStatusImportacao(${p.identificadorTemporario}, this.value)">
                        <option value="publicado">Publicar</option>
                        <option value="rascunho">Rascunho</option>
                    </select>
                </div>
                <p>${p.quantidade} | ${p.preco}</p>
            </div>`;
    });

    const btn = document.getElementById("btnConfirmarPlanilha");
    btn.disabled = totalValidos === 0;
    btn.innerText = `Importar ${totalValidos} Produtos`;
}

// --- Importação Final ---

document.getElementById("btnConfirmarPlanilha").onclick = () => {
    if (listaProdutosValidos.length > 0) {
        listaProdutosValidos.forEach(p => {
            // Removemos o ID temporário antes de enviar para a API
            const { identificadorTemporario, ...dadosParaSalvar } = p;
            API.adicionar(dadosParaSalvar);
        });

        renderProdutos(); // Atualiza a tela principal
        fecharModalPlanilha();
        
        const plural = listaProdutosValidos.length > 1 ? "s" : "";
        exibirNotificacao('cadastro', `${listaProdutosValidos.length} produto${plural} importado${plural}!`);
    }
};