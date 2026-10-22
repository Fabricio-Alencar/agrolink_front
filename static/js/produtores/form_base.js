/**
 * ARQUIVO: form_base.js
 * OBJETIVO:
 * - Centralizar elementos
 * - Controlar upload de imagem
 * - Criar FormData
 * - Diferenciar criação e edição
 * - Controlar o status do produto
 */

// ===============================
// ELEMENTOS DO UPLOAD
// ===============================

const uploadBox = document.getElementById("uploadBox");
const inputFile = document.getElementById("fotoProduto");

// 🔹 CONTROLE DE IMAGEM GENÉRICA
let usarImagemGenerica = false;


// ===============================
// CONFIGURAÇÃO VISUAL DO UPLOAD
// ===============================

const placeholder = document.createElement("div");

placeholder.classList.add(
    "upload-placeholder"
);

placeholder.innerHTML = `
    <i data-lucide="upload" class="icone-upload"></i>
    <p>Selecione ou arraste sua imagem</p>
`;


const preview = document.createElement("img");

preview.classList.add(
    "upload-preview"
);

preview.style.display = "none";


// ===============================
// BOTÃO REMOVER IMAGEM
// ===============================

const btnRemover = document.createElement("button");

btnRemover.classList.add(
    "btn-remover-imagem"
);

btnRemover.textContent =
    "Remover imagem";

btnRemover.style.display = "none";


// ===============================
// ADICIONAR ELEMENTOS AO UPLOAD
// ===============================

uploadBox.appendChild(
    placeholder
);

uploadBox.appendChild(
    preview
);

uploadBox.appendChild(
    btnRemover
);


// =====================================================
// CAPTURA DE DADOS
// =====================================================

async function obterDadosFormulario(
    statusDesejado,
    estaEditando = false
) {

    const nome =
        document.getElementById(
            "nomeProduto"
        ).value;

    const preco =
        document.getElementById(
            "precoProduto"
        ).value;

    const quantidade =
        document.getElementById(
            "quantidadeProduto"
        ).value;


    // ===============================
    // VALIDAÇÃO
    // ===============================

    if (
        !nome ||
        !preco ||
        quantidade === ""
    ) {

        exibirNotificacao(
            "erro",
            "Preencha o nome, preço e quantidade!"
        );

        return null;
    }


    // ===============================
    // CRIAR FORMDATA
    // ===============================

    const formData =
        new FormData();


    formData.append(
        "nome",
        nome
    );

    formData.append(
        "preco",
        preco
    );

    formData.append(
        "quantidade",
        quantidade || 0
    );

    formData.append(
        "unidade",
        document.getElementById(
            "unidadeProduto"
        ).value
    );

    formData.append(
        "categoria",
        document.getElementById(
            "categoriaProduto"
        ).value
    );

    formData.append(
        "descricao",
        document.getElementById(
            "descricaoProduto"
        ).value
    );


    // =====================================================
    // STATUS
    // =====================================================
    //
    // CRIAÇÃO:
    // FastAPI espera "status_produto"
    //
    // EDIÇÃO:
    // FastAPI espera "status"
    //
    // =====================================================

    if (estaEditando) {

        formData.append(
            "status",
            statusDesejado
        );

    } else {

        formData.append(
            "status_produto",
            statusDesejado
        );
    }


    // ===============================
    // FOTO
    // ===============================

    const arquivoFoto =
        inputFile.files[0];


    // ===============================
    // USUÁRIO ESCOLHEU UMA FOTO
    // ===============================

    if (arquivoFoto) {

        formData.append(
            "foto",
            arquivoFoto
        );
    }


    // ===============================
    // USAR FOTO GENÉRICA
    // ===============================

    else if (usarImagemGenerica) {

        const response =
            await fetch(
                "../static/uploads/produtos/foto_generica.png"
            );

        const blob =
            await response.blob();

        const file =
            new File(
                [blob],
                "foto_generica.png",
                {
                    type: blob.type
                }
            );

        formData.append(
            "foto",
            file
        );
    }


    // ===============================
    // DEBUG
    // ===============================

    console.log(
        "===================================="
    );

    console.log(
        "📦 DADOS ENVIADOS NO FORM DATA"
    );

    console.log(
        "Modo:",
        estaEditando
            ? "EDIÇÃO"
            : "CRIAÇÃO"
    );

    console.log(
        "Status recebido:",
        statusDesejado
    );


    for (
        const [chave, valor]
        of formData.entries()
    ) {

        if (
            valor instanceof File
        ) {

            console.log(
                chave,
                "→",
                `Arquivo: ${valor.name}`
            );

        } else {

            console.log(
                chave,
                "→",
                valor
            );
        }
    }


    console.log(
        "===================================="
    );


    return formData;
}


// =====================================================
// MAESTRO
// Decide entre Criar ou Editar
// =====================================================

async function finalizarAcao(
    statusDesejado
) {

    const campoEdicao =
        document.getElementById(
            "editandoNomeOriginal"
        );


    const idParaEditar =
        campoEdicao
            ? campoEdicao.value
            : "";


    const estaEditando =
        Boolean(idParaEditar);


    console.log(
        "===================================="
    );

    console.log(
        "🎯 FINALIZAR AÇÃO"
    );

    console.log(
        "Status escolhido:",
        statusDesejado
    );

    console.log(
        "ID para edição:",
        idParaEditar
    );

    console.log(
        "É edição?",
        estaEditando
    );

    console.log(
        "===================================="
    );


    const dados =
        await obterDadosFormulario(
            statusDesejado,
            estaEditando
        );


    if (!dados) {
        return;
    }


    // ===============================
    // EDITAR
    // ===============================

    if (estaEditando) {

        executarEdicao(
            dados
        );

    }


    // ===============================
    // CRIAR
    // ===============================

    else {

        executarCriacao(
            dados
        );
    }
}


// =====================================================
// LIMPEZA
// Reseta o modal para o estado original
// =====================================================

function fecharModal() {

    document
        .getElementById(
            "modalProduto"
        )
        .classList.remove(
            "active"
        );


    // ===============================
    // RESET DO ID DE EDIÇÃO
    // ===============================

    document
        .getElementById(
            "editandoNomeOriginal"
        )
        .value = "";


    // ===============================
    // RESET DOS CAMPOS
    // ===============================

    document
        .getElementById(
            "nomeProduto"
        )
        .value = "";


    document
        .getElementById(
            "precoProduto"
        )
        .value = "";


    document
        .getElementById(
            "quantidadeProduto"
        )
        .value = "";


    document
        .getElementById(
            "descricaoProduto"
        )
        .value = "";


    // ===============================
    // RESET DOS SELECTS
    // ===============================

    document
        .getElementById(
            "categoriaProduto"
        )
        .selectedIndex = 0;


    document
        .getElementById(
            "unidadeProduto"
        )
        .selectedIndex = 0;


    // ===============================
    // RESET DA FOTO
    // ===============================

    inputFile.value = "";

    preview.src = "";

    preview.style.display =
        "none";

    placeholder.style.display =
        "block";

    btnRemover.style.display =
        "none";

    usarImagemGenerica =
        false;


    atualizarLabelsUnidade();
}


// =====================================================
// PROCESSAR IMAGEM
// =====================================================

function processarImagem(
    file
) {

    if (
        file &&
        file.type.startsWith(
            "image/"
        )
    ) {

        usarImagemGenerica =
            false;


        const reader =
            new FileReader();


        reader.onload =
            (event) => {

                preview.src =
                    event.target.result;

                preview.style.display =
                    "block";

                placeholder.style.display =
                    "none";

                btnRemover.style.display =
                    "block";
            };


        reader.readAsDataURL(
            file
        );
    }
}


// =====================================================
// CLICK NO UPLOAD
// =====================================================

uploadBox.addEventListener(
    "click",
    () => {

        inputFile.click();
    }
);


// =====================================================
// SELEÇÃO DE ARQUIVO
// =====================================================

inputFile.addEventListener(
    "change",
    (e) => {

        processarImagem(
            e.target.files[0]
        );
    }
);


// =====================================================
// DRAG & DROP
// =====================================================

[
    "dragenter",
    "dragover",
    "dragleave",
    "drop"
].forEach(
    eventName => {

        uploadBox.addEventListener(
            eventName,
            (e) => {

                e.preventDefault();

                e.stopPropagation();
            }
        );
    }
);


// =====================================================
// DRAG ENTER / OVER
// =====================================================

[
    "dragenter",
    "dragover"
].forEach(
    eventName => {

        uploadBox.addEventListener(
            eventName,
            () => {

                uploadBox.classList.add(
                    "drag-over"
                );
            }
        );
    }
);


// =====================================================
// DRAG LEAVE / DROP
// =====================================================

[
    "dragleave",
    "drop"
].forEach(
    eventName => {

        uploadBox.addEventListener(
            eventName,
            () => {

                uploadBox.classList.remove(
                    "drag-over"
                );
            }
        );
    }
);


// =====================================================
// DROP
// =====================================================

uploadBox.addEventListener(
    "drop",
    (e) => {

        const file =
            e.dataTransfer.files[0];


        if (file) {

            const dataTransfer =
                new DataTransfer();


            dataTransfer.items.add(
                file
            );


            inputFile.files =
                dataTransfer.files;


            processarImagem(
                file
            );
        }
    }
);


// =====================================================
// REMOVER IMAGEM
// =====================================================

btnRemover.addEventListener(
    "click",
    (e) => {

        e.stopPropagation();


        inputFile.value = "";


        preview.src = "";

        preview.style.display =
            "none";


        placeholder.style.display =
            "block";


        btnRemover.style.display =
            "none";


        // 🔥 Ao remover a foto,
        // será enviada a imagem genérica
        usarImagemGenerica =
            true;
    }
);


// =====================================================
// ELEMENTOS DA UNIDADE
// =====================================================

const selectUnidade =
    document.getElementById(
        "unidadeProduto"
    );


const labelPreco =
    document.getElementById(
        "labelPreco"
    );


const labelQuantidade =
    document.getElementById(
        "labelQuantidade"
    );


// =====================================================
// ATUALIZAR LABELS DA UNIDADE
// =====================================================

function atualizarLabelsUnidade() {

    if (
        !selectUnidade ||
        !labelPreco ||
        !labelQuantidade
    ) {

        return;
    }


    const unidadeSelecionada =
        selectUnidade
            .options[
                selectUnidade.selectedIndex
            ]
            .text;


    labelPreco.innerHTML =
        `Preço por <strong>${unidadeSelecionada}</strong> (R$)`;


    labelQuantidade.innerHTML =
        `Estoque Disponível (em <strong>${unidadeSelecionada}</strong>)`;
}


// =====================================================
// EVENTO DE ALTERAÇÃO DA UNIDADE
// =====================================================

if (selectUnidade) {

    selectUnidade.addEventListener(
        "change",
        atualizarLabelsUnidade
    );
}


// Executar inicialmente
atualizarLabelsUnidade();


// =====================================================
// EXPOR ELEMENTOS PARA OUTROS ARQUIVOS
// =====================================================

window.uploadElements = {

    preview,

    placeholder,

    btnRemover
};