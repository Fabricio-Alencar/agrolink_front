import { DOM } from './dom.js';
import { API } from './api.js';


// =============================================================
// CONFIGURAÇÃO DE FOTO COM FALLBACK
// =============================================================

function configurarFotoComFallback(img, url) {

    if (!img) return;

    // Define a imagem inicialmente
    img.src = url;

    // Caso a imagem não consiga carregar
    img.onerror = () => {

        // Evita loop caso a própria imagem genérica dê erro
        img.onerror = null;

        // Usa a imagem genérica do frontend
        img.src = "../static/assets/user.png";
    };
}


// =============================================================
// CARREGAR DADOS INICIAIS
// =============================================================

export async function carregarDadosIniciais() {

    try {

        const data = await API.obterPerfil();


        // =====================================================
        // FOTO DE PERFIL
        // =====================================================

        // O backend retorna diretamente a URL SAS do Azure.
        //
        // Se foto_perfil for null, já usamos a imagem genérica.
        const caminhoFoto = data.foto_perfil
            || "../static/assets/user.webp";


        // =====================================================
        // EXIBIÇÃO DO PERFIL
        // =====================================================

        DOM.userName.textContent = data.nome;

        DOM.userRole.textContent =
            capitalizar(data.tipo);


        // Foto principal do perfil
        configurarFotoComFallback(
            DOM.profileImg,
            caminhoFoto
        );


        // =====================================================
        // FOTO DO DRAWER
        // =====================================================

        const fotoDrawer =
            document.querySelector('.usuario-foto');

        if (fotoDrawer) {

            configurarFotoComFallback(
                fotoDrawer,
                caminhoFoto
            );
        }


        // =====================================================
        // PREENCHER INPUTS
        // =====================================================
        //
        // 0 = Nome
        // 1 = Email
        // 2 = Telefone
        // 3 = Localização
        // 4 = Senha
        //

        if (DOM.inputs.length >= 5) {

            DOM.inputs[0].value =
                data.nome;

            DOM.inputs[1].value =
                data.email;

            DOM.inputs[2].value =
                data.telefone || "";

            DOM.inputs[3].value =
                (data.cidade && data.estado)
                    ? `${data.cidade}, ${data.estado}`
                    : "";

            DOM.inputs[4].value =
                "••••••••";
        }


    } catch (error) {

        console.error(
            "Falha ao inicializar perfil:",
            error
        );
    }
}


// =============================================================
// EDIÇÃO E SALVAMENTO DOS DADOS
// =============================================================

export function configurarEdicaoESalvamento() {

    DOM.editIcons.forEach(icon => {

        icon.addEventListener('click', (e) => {

            let input =
                icon.hasAttribute('data-target')
                    ? document.getElementById(
                        icon.getAttribute('data-target')
                    )
                    : e.target
                        .closest('.input-wrapper')
                        .querySelector('.form-control');


            if (input) {

                input.removeAttribute(
                    'readonly'
                );

                input.focus();


                // Se for senha, limpa o campo
                if (input.type === 'password') {

                    input.value = '';
                }
            }
        });
    });


    // =========================================================
    // SALVAR AO SAIR DO CAMPO
    // =========================================================

    DOM.allEditable.forEach(input => {

        input.addEventListener('blur', () => {

            if (!input.hasAttribute('readonly')) {

                input.setAttribute(
                    'readonly',
                    true
                );


                // Se a senha estiver vazia,
                // volta a mostrar os pontos
                if (
                    input.type === 'password'
                    && input.value === ''
                ) {

                    input.value =
                        "••••••••";
                }


                salvarDados();
            }
        });


        // =====================================================
        // ENTER PARA SALVAR
        // =====================================================

        input.addEventListener(
            'keydown',
            (e) => {

                if (
                    e.key === 'Enter'
                    && input.tagName !== 'TEXTAREA'
                ) {

                    e.preventDefault();

                    input.blur();
                }
            }
        );
    });
}


// =============================================================
// UPLOAD DA FOTO
// =============================================================

export function configurarUploadFoto() {

    // Clicar na área da foto
    // abre o seletor de arquivos
    DOM.uploadZone.addEventListener(
        'click',
        () => DOM.fileInput.click()
    );


    // =========================================================
    // ESCOLHA DA FOTO
    // =========================================================

    DOM.fileInput.addEventListener(
        'change',
        async (e) => {

            if (e.target.files.length > 0) {

                const arquivo =
                    e.target.files[0];


                // =================================================
                // PREVIEW VISUAL IMEDIATO
                // =================================================

                const reader =
                    new FileReader();


                reader.onload = (event) => {

                    // Foto principal
                    DOM.profileImg.src =
                        event.target.result;


                    // Foto do Drawer
                    const fotoDrawer =
                        document.querySelector(
                            '.usuario-foto'
                        );


                    if (fotoDrawer) {

                        fotoDrawer.src =
                            event.target.result;
                    }
                };


                reader.readAsDataURL(
                    arquivo
                );


                // =================================================
                // ENVIA FOTO PARA O BACKEND
                // =================================================

                await salvarDados({
                    foto: arquivo
                });
            }
        }
    );
}


// =============================================================
// MODAL DE EXCLUSÃO
// =============================================================

export function configurarModalExclusao() {

    DOM.btnDeleteAcc.addEventListener(
        'click',
        () => DOM.modalDelete.classList.add('active')
    );


    DOM.btnCancelDelete.addEventListener(
        'click',
        () => DOM.modalDelete.classList.remove('active')
    );


    DOM.btnConfirmDelete.addEventListener(
        'click',
        async () => {

            try {

                await API.excluirConta();


                // Agenda a notificação para aparecer
                // na próxima tela
                agendarNotificacao(
                    'exclusao',
                    'Conta excluída com sucesso!'
                );


                // Redireciona para o login
                window.location.href = '/login';

            } catch (error) {

                exibirNotificacao(
                    'erro',
                    error.message
                );


                DOM.modalDelete.classList.remove(
                    'active'
                );
            }
        }
    );
}


// =============================================================
// SALVAR DADOS
// =============================================================

async function salvarDados(
    dadosExtras = {}
) {

    const formData =
        new FormData();


    // =========================================================
    // DADOS DO USUÁRIO
    // =========================================================

    formData.append(
        'nome',
        DOM.inputs[0].value
    );

    formData.append(
        'email',
        DOM.inputs[1].value
    );

    formData.append(
        'telefone',
        DOM.inputs[2].value
    );


    // =========================================================
    // LOCALIZAÇÃO
    // =========================================================

    const loc =
        DOM.inputs[3].value.split(',');


    if (loc.length === 2) {

        formData.append(
            'cidade',
            loc[0].trim()
        );

        formData.append(
            'estado',
            loc[1].trim()
        );
    }


    // =========================================================
    // SENHA
    // =========================================================

    const senha =
        DOM.inputs[4].value;


    if (
        senha !== '••••••••'
        && senha.trim() !== ''
    ) {

        formData.append(
            'senha',
            senha
        );
    }


    // =========================================================
    // FOTO
    // =========================================================

    if (dadosExtras.foto) {

        formData.append(
            'foto',
            dadosExtras.foto
        );
    }


    // =========================================================
    // ENVIA PARA O BACKEND
    // =========================================================

    try {

        await API.atualizarPerfil(
            formData
        );


        // Atualiza o nome exibido
        DOM.userName.textContent =
            DOM.inputs[0].value;


    } catch (error) {

        console.error(
            "Erro ao salvar:",
            error
        );
    }
}


// =============================================================
// FUNÇÃO AUXILIAR
// =============================================================

function capitalizar(texto) {

    if (!texto) {

        return "";
    }


    return (
        texto.charAt(0).toUpperCase()
        + texto.slice(1)
    );
}