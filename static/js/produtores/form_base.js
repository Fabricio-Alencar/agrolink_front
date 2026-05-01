/**
 * ARQUIVO: form_base.js
 * OBJETIVO: Centralizar elementos, upload de imagem, FormData e Maestro.
 */

const uploadBox = document.getElementById("uploadBox");
const inputFile = document.getElementById("fotoProduto");

// 🔹 CONTROLE DE IMAGEM GENÉRICA
let usarImagemGenerica = false;

// --- CONFIGURAÇÃO VISUAL DO UPLOAD ---
const placeholder = document.createElement("div");
placeholder.classList.add("upload-placeholder");
placeholder.innerHTML = `<img src="../static/assets/upload.png"><p>Selecione ou arraste sua imagem</p>`;

const preview = document.createElement("img");
preview.classList.add("upload-preview");
preview.style.display = "none";

// 🔹 BOTÃO REMOVER IMAGEM
const btnRemover = document.createElement("button");
btnRemover.classList.add("btn-remover-imagem");
btnRemover.textContent = "Remover imagem";
btnRemover.style.display = "none";

uploadBox.appendChild(placeholder);
uploadBox.appendChild(preview);
uploadBox.appendChild(btnRemover);

/**
 * CAPTURA DE DADOS
 * Organiza os campos em um FormData para suportar envio de arquivos.
 */
async function obterDadosFormulario(statusDesejado) {
    const nome = document.getElementById("nomeProduto").value;
    const preco = document.getElementById("precoProduto").value;
    const quantidade = document.getElementById("quantidadeProduto").value;

    if (!nome || !preco || quantidade === "") {
        exibirNotificacao('erro', "Preencha o nome, preço e quantidade!");
        return null;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('preco', preco);
    formData.append('quantidade', quantidade || 0);
    formData.append('unidade', document.getElementById("unidadeProduto").value);
    formData.append('categoria', document.getElementById("categoriaProduto").value);
    formData.append('descricao', document.getElementById("descricaoProduto").value);
    formData.append('status', statusDesejado);

    const arquivoFoto = inputFile.files[0];

    if (arquivoFoto) {
        formData.append('foto', arquivoFoto);
    } 
    // 🔥 ENVIA IMAGEM GENÉRICA
    else if (usarImagemGenerica) {
        const response = await fetch("../static/uploads/produtos/foto_generica.png");
        const blob = await response.blob();
        const file = new File([blob], "foto_generica.png", { type: blob.type });
        formData.append('foto', file);
    }

    return formData;
}

/**
 * MAESTRO: Decide entre Criar ou Editar.
 */
async function finalizarAcao(statusDesejado) {
    const idParaEditar = document.getElementById("editandoNomeOriginal").value;
    const dados = await obterDadosFormulario(statusDesejado);
    
    if (dados) {
        if (idParaEditar) {
            executarEdicao(dados);
        } else {
            executarCriacao(dados);
        }
    }
}

/**
 * LIMPEZA: Reseta o modal para o estado original.
 */
function fecharModal() {
    document.getElementById("modalProduto").classList.remove("active");
    
    // Reset de Texto e IDs
    document.getElementById("editandoNomeOriginal").value = "";
    document.getElementById("nomeProduto").value = "";
    document.getElementById("precoProduto").value = "";
    document.getElementById("quantidadeProduto").value = "";
    document.getElementById("descricaoProduto").value = "";
    
    // Reset de Selects
    document.getElementById("categoriaProduto").selectedIndex = 0;
    document.getElementById("unidadeProduto").selectedIndex = 0;

    // Reset de Foto
    inputFile.value = ""; 
    preview.src = "";
    preview.style.display = "none";
    placeholder.style.display = "block";
    btnRemover.style.display = "none";
    usarImagemGenerica = false;

    atualizarLabelsUnidade();
}

// ===============================
// 🔹 FUNÇÃO ÚNICA PARA PROCESSAR IMAGEM
// ===============================
function processarImagem(file) {
    if (file && file.type.startsWith("image/")) {
        usarImagemGenerica = false;

        const reader = new FileReader();
        reader.onload = (event) => {
            preview.src = event.target.result;
            preview.style.display = "block";
            placeholder.style.display = "none";
            btnRemover.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
}

// --- LÓGICA DE UPLOAD (CLICK) ---
uploadBox.addEventListener("click", () => inputFile.click());

inputFile.addEventListener("change", (e) => {
    processarImagem(e.target.files[0]);
});

// ===============================
// 🔹 DRAG & DROP
// ===============================
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    uploadBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

["dragenter", "dragover"].forEach(eventName => {
    uploadBox.addEventListener(eventName, () => {
        uploadBox.classList.add("drag-over");
    });
});

["dragleave", "drop"].forEach(eventName => {
    uploadBox.addEventListener(eventName, () => {
        uploadBox.classList.remove("drag-over");
    });
});

uploadBox.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];

    if (file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        inputFile.files = dataTransfer.files;

        processarImagem(file);
    }
});

// ===============================
// 🔹 REMOVER IMAGEM
// ===============================
btnRemover.addEventListener("click", (e) => {
    e.stopPropagation();

    inputFile.value = "";

    // 🔥 VOLTA PARA O ESTADO ORIGINAL (SEM IMAGEM)
    preview.src = "";
    preview.style.display = "none";
    placeholder.style.display = "block";
    btnRemover.style.display = "none";

    // 🔥 AINDA MARCA PARA ENVIAR GENÉRICA NO BACKEND
    usarImagemGenerica = true;
});

// --- UX: ATUALIZAÇÃO DINÂMICA DE UNIDADE ---
const selectUnidade = document.getElementById("unidadeProduto");
const labelPreco = document.getElementById("labelPreco");
const labelQuantidade = document.getElementById("labelQuantidade");

function atualizarLabelsUnidade() {
    if (!selectUnidade || !labelPreco || !labelQuantidade) return;

    const unidadeSelecionada = selectUnidade.options[selectUnidade.selectedIndex].text;
    
    labelPreco.innerHTML = `Preço por <strong>${unidadeSelecionada}</strong> (R$)`;
    labelQuantidade.innerHTML = `Estoque Disponível (em <strong>${unidadeSelecionada}</strong>)`;
}

if (selectUnidade) {
    selectUnidade.addEventListener("change", atualizarLabelsUnidade);
}

atualizarLabelsUnidade();

// 🔥 EXPÕE ELEMENTOS PARA EDIÇÃO
window.uploadElements = {
    preview,
    placeholder,
    btnRemover
};