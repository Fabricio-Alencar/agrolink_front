/**
 * ARQUIVO: form_base.js
 * OBJETIVO:
 * Centralizar:
 * - elementos do formulário
 * - upload de imagem
 * - preview
 * - drag & drop
 * - geração de FormData
 * - controle criar/editar
 */

// ===============================
// ELEMENTOS PRINCIPAIS
// ===============================
const uploadBox = document.getElementById("uploadBox");
const inputFile = document.getElementById("fotoProduto");

// ===============================
// CONFIGURAÇÃO VISUAL UPLOAD
// ===============================
const placeholder = document.createElement("div");

placeholder.classList.add("upload-placeholder");

// 🔥 caminho absoluto
placeholder.innerHTML = `
    <img src="/static/assets/upload.png">
    <p>Selecione ou arraste sua imagem</p>
`;

// ===============================
// PREVIEW IMAGEM
// ===============================
const preview = document.createElement("img");

preview.classList.add("upload-preview");
preview.style.display = "none";

// ===============================
// BOTÃO REMOVER IMAGEM
// ===============================
const btnRemover = document.createElement("button");

btnRemover.classList.add("btn-remover-imagem");
btnRemover.textContent = "Remover imagem";
btnRemover.style.display = "none";

// adiciona elementos
uploadBox.appendChild(placeholder);
uploadBox.appendChild(preview);
uploadBox.appendChild(btnRemover);

// ===============================
// CAPTURA DADOS FORMULÁRIO
// ===============================
async function obterDadosFormulario(statusDesejado) {

    // =========================
    // CAMPOS
    // =========================
    const nome = document.getElementById("nomeProduto").value;

    const preco = document.getElementById("precoProduto").value;

    const quantidade = document.getElementById("quantidadeProduto").value;

    // =========================
    // VALIDAÇÃO
    // =========================
    if (!nome || preco === "" || quantidade === "") {

        exibirNotificacao(
            'erro',
            "Preencha nome, preço e quantidade!"
        );

        return null;
    }

    // =========================
    // FORMDATA
    // =========================
    const formData = new FormData();

    formData.append('nome', nome);

    formData.append('preco', preco);

    formData.append('quantidade', quantidade || 0);

    formData.append(
        'unidade',
        document.getElementById("unidadeProduto").value
    );

    formData.append(
        'categoria',
        document.getElementById("categoriaProduto").value
    );

    formData.append(
        'descricao',
        document.getElementById("descricaoProduto").value
    );

    formData.append('status', statusDesejado);

    // =========================
    // FOTO
    // =========================
    const arquivoFoto = inputFile.files[0];

    // 📸 só envia se existir
    if (arquivoFoto) {
        formData.append('foto', arquivoFoto);
    }

    return formData;
}

// ===============================
// MAESTRO (CRIAR OU EDITAR)
// ===============================
async function finalizarAcao(statusDesejado) {

    // pega ID edição
    const idParaEditar = document.getElementById(
        "editandoNomeOriginal"
    ).value;

    // gera formData
    const dados = await obterDadosFormulario(
        statusDesejado
    );

    // valida
    if (!dados) return;

    // =========================
    // EDIÇÃO
    // =========================
    if (idParaEditar) {

        executarEdicao(dados);

    } else {

        // =====================
        // CRIAÇÃO
        // =====================
        executarCriacao(dados);
    }
}

// ===============================
// FECHAR MODAL
// ===============================
function fecharModal() {

    // fecha modal
    document
        .getElementById("modalProduto")
        .classList.remove("active");

    // =========================
    // RESET TEXTOS
    // =========================
    document.getElementById(
        "editandoNomeOriginal"
    ).value = "";

    document.getElementById(
        "nomeProduto"
    ).value = "";

    document.getElementById(
        "precoProduto"
    ).value = "";

    document.getElementById(
        "quantidadeProduto"
    ).value = "";

    document.getElementById(
        "descricaoProduto"
    ).value = "";

    // =========================
    // RESET SELECTS
    // =========================
    document.getElementById(
        "categoriaProduto"
    ).selectedIndex = 0;

    document.getElementById(
        "unidadeProduto"
    ).selectedIndex = 0;

    // =========================
    // RESET FOTO
    // =========================
    inputFile.value = "";

    preview.src = "";

    preview.style.display = "none";

    placeholder.style.display = "block";

    btnRemover.style.display = "none";

    atualizarLabelsUnidade();
}

// ===============================
// PROCESSAR IMAGEM
// ===============================
function processarImagem(file) {

    // valida imagem
    if (
        file &&
        file.type.startsWith("image/")
    ) {

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

// ===============================
// CLICK UPLOAD
// ===============================
uploadBox.addEventListener(
    "click",
    (e) => {

        // evita abrir upload
        // ao clicar remover
        if (e.target === btnRemover) {
            return;
        }

        inputFile.click();
    }
);

// ===============================
// CHANGE INPUT
// ===============================
inputFile.addEventListener(
    "change",
    (e) => {

        processarImagem(
            e.target.files[0]
        );
    }
);

// ===============================
// DRAG & DROP
// ===============================
[
    "dragenter",
    "dragover",
    "dragleave",
    "drop"

].forEach(eventName => {

    uploadBox.addEventListener(
        eventName,
        (e) => {

            e.preventDefault();

            e.stopPropagation();
        }
    );
});

// ===============================
// EFEITO VISUAL DRAG
// ===============================
[
    "dragenter",
    "dragover"

].forEach(eventName => {

    uploadBox.addEventListener(
        eventName,
        () => {

            uploadBox.classList.add(
                "drag-over"
            );
        }
    );
});

[
    "dragleave",
    "drop"

].forEach(eventName => {

    uploadBox.addEventListener(
        eventName,
        () => {

            uploadBox.classList.remove(
                "drag-over"
            );
        }
    );
});

// ===============================
// DROP IMAGEM
// ===============================
uploadBox.addEventListener(
    "drop",
    (e) => {

        const file = e.dataTransfer.files[0];

        if (file) {

            const dataTransfer = new DataTransfer();

            dataTransfer.items.add(file);

            inputFile.files = dataTransfer.files;

            processarImagem(file);
        }
    }
);

// ===============================
// REMOVER IMAGEM
// ===============================
btnRemover.addEventListener(
    "click",
    (e) => {

        e.stopPropagation();

        // limpa input
        inputFile.value = "";

        // limpa preview
        preview.src = "";

        preview.style.display = "none";

        placeholder.style.display = "block";

        btnRemover.style.display = "none";
    }
);

// ===============================
// LABELS DINÂMICAS
// ===============================
const selectUnidade = document.getElementById(
    "unidadeProduto"
);

const labelPreco = document.getElementById(
    "labelPreco"
);

const labelQuantidade = document.getElementById(
    "labelQuantidade"
);

function atualizarLabelsUnidade() {

    if (
        !selectUnidade ||
        !labelPreco ||
        !labelQuantidade
    ) return;

    const unidadeSelecionada =
        selectUnidade.options[
            selectUnidade.selectedIndex
        ].text;

    labelPreco.innerHTML =
        `Preço por <strong>${unidadeSelecionada}</strong> (R$)`;

    labelQuantidade.innerHTML =
        `Estoque Disponível (em <strong>${unidadeSelecionada}</strong>)`;
}

// evento select
if (selectUnidade) {

    selectUnidade.addEventListener(
        "change",
        atualizarLabelsUnidade
    );
}

// inicia labels
atualizarLabelsUnidade();

// ===============================
// EXPÕE ELEMENTOS GLOBAIS
// ===============================
window.uploadElements = {
    preview,
    placeholder,
    btnRemover
};
