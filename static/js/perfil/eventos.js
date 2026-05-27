import { DOM } from './dom.js';
import { API } from './api.js';

export async function carregarDadosIniciais() {
    try {
        const data = await API.obterPerfil();
        
        // Caminho da foto vinda do banco
        const caminhoFoto = `../static/${data.foto_perfil}`;
        
        // Preenche Exibição do Perfil
        DOM.userName.textContent = data.nome;
        DOM.userRole.textContent = capitalizar(data.tipo);
        DOM.profileImg.src = caminhoFoto;
        
        // Atualiza também a foto dentro do Drawer ao carregar a página
        const fotoDrawer = document.querySelector('.usuario-foto');
        if (fotoDrawer) {
            fotoDrawer.src = caminhoFoto;
        }
        
        // Preenche Inputs (0=Nome, 1=Email, 2=Telefone, 3=Local, 4=Senha)
        if(DOM.inputs.length >= 5) {
            DOM.inputs[0].value = data.nome;
            DOM.inputs[1].value = data.email;
            DOM.inputs[2].value = data.telefone || "";
            DOM.inputs[3].value = (data.cidade && data.estado) ? `${data.cidade}, ${data.estado}` : "";
            DOM.inputs[4].value = "••••••••";
        }
    } catch (error) {
        console.error("Falha ao inicializar perfil:", error);
    }
}

export function configurarEdicaoESalvamento() {
    DOM.editIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            let input = icon.hasAttribute('data-target') 
                ? document.getElementById(icon.getAttribute('data-target'))
                : e.target.closest('.input-wrapper').querySelector('.form-control');

            if (input) {
                input.removeAttribute('readonly');
                input.focus();
                if (input.type === 'password') input.value = ''; 
            }
        });
    });

    DOM.allEditable.forEach(input => {
        input.addEventListener('blur', () => {
            if (!input.hasAttribute('readonly')) {
                input.setAttribute('readonly', true);
                if (input.type === 'password' && input.value === '') input.value = "••••••••";
                salvarDados();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
                e.preventDefault();
                input.blur(); 
            }
        });
    });
}

export function configurarUploadFoto() {
    DOM.uploadZone.addEventListener('click', () => DOM.fileInput.click());

    DOM.fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const arquivo = e.target.files[0];
            
            // Preview visual imediato
            const reader = new FileReader();
            reader.onload = (event) => {
                // Atualiza a imagem principal do perfil
                DOM.profileImg.src = event.target.result;
                
                // 🔥 ATUALIZAÇÃO: Atualiza a imagem do Drawer instantaneamente no upload
                const fotoDrawer = document.querySelector('.usuario-foto');
                if (fotoDrawer) {
                    fotoDrawer.src = event.target.result;
                }
            };
            reader.readAsDataURL(arquivo);

            // Envia para o banco de dados
            await salvarDados({ foto: arquivo });
        }
    });
}

export function configurarModalExclusao() {
    DOM.btnDeleteAcc.addEventListener('click', () => DOM.modalDelete.classList.add('active'));
    DOM.btnCancelDelete.addEventListener('click', () => DOM.modalDelete.classList.remove('active'));

    DOM.btnConfirmDelete.addEventListener('click', async () => {
        try {
            await API.excluirConta();
            
            // 1. Agenda a notificação para aparecer NA PRÓXIMA TELA usando o tipo 'exclusao' definido no seu JS
            agendarNotificacao('exclusao', 'Conta excluída com sucesso!');
            
            // 2. Redireciona imediatamente para o login
            window.location.href = 'login.html'; 

        } catch (error) {
            // Se der erro, mostra o erro na tela atual (pois não vai redirecionar)
            exibirNotificacao('erro', error.message);
            DOM.modalDelete.classList.remove('active');
        }
    });
}

// === Funções Auxiliares ===
async function salvarDados(dadosExtras = {}) {
    const formData = new FormData();
    
    formData.append('nome', DOM.inputs[0].value);
    formData.append('email', DOM.inputs[1].value);
    formData.append('telefone', DOM.inputs[2].value);
    
    const loc = DOM.inputs[3].value.split(',');
    if (loc.length === 2) {
        formData.append('cidade', loc[0].trim());
        formData.append('estado', loc[1].trim());
    }

    const senha = DOM.inputs[4].value;
    if (senha !== '••••••••' && senha.trim() !== '') {
        formData.append('senha', senha);
    }


    if (dadosExtras.foto) {
        formData.append('foto', dadosExtras.foto);
    }

    try {
        await API.atualizarPerfil(formData);
        DOM.userName.textContent = DOM.inputs[0].value; 
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
}

function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}