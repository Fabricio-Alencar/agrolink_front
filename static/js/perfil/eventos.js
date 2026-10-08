import { DOM } from './dom.js';
import { API } from './api.js';

// =============================================================
// AUXILIARES E FOTO COM FALLBACK
// =============================================================
function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function configurarFotoComFallback(img, url) {
    if (!img) return;
    img.src = url;
    img.onerror = () => {
        img.onerror = null;
        img.src = "../static/assets/user.png";
    };
}

function abrirSelect(select) {
    if (!select) return;
    select.disabled = false;
    select.focus();
    if (typeof select.showPicker === "function") {
        try { select.showPicker(); } catch (e) {}
    }
}

// =============================================================
// LOCALIZAÇÃO (IBGE)
// =============================================================
async function carregarEstados() {
    if (!DOM.state) return;
    try {
        DOM.state.innerHTML = '<option value="">Selecione o estado</option>';
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
        if (!response.ok) throw new Error("Erro ao carregar estados.");

        const estados = await response.json();
        estados.forEach(estado => {
            const option = document.createElement("option");
            option.value = estado.sigla;
            option.textContent = estado.nome;
            DOM.state.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar estados:", error);
        DOM.state.innerHTML = '<option value="">Erro ao carregar estados</option>';
    }
}

async function carregarCidades(uf, cidadeSelecionada = "") {
    if (!DOM.city || !uf) return;
    try {
        DOM.city.disabled = true;
        DOM.city.innerHTML = '<option value="">Carregando cidades...</option>';

        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        if (!response.ok) throw new Error("Erro ao carregar cidades.");

        const cidades = await response.json();
        DOM.city.innerHTML = '<option value="">Selecione a cidade</option>';

        cidades.forEach(cidade => {
            const option = document.createElement("option");
            option.value = cidade.nome;
            option.textContent = cidade.nome;
            if (cidade.nome === cidadeSelecionada) option.selected = true;
            DOM.city.appendChild(option);
        });

        DOM.city.disabled = true;
    } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        DOM.city.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        DOM.city.disabled = true;
    }
}

export function configurarLocalizacao() {
    if (!DOM.state || !DOM.city) return;

    DOM.state.addEventListener("change", async () => {
        const uf = DOM.state.value;

        if (!uf) {
            DOM.city.disabled = true;
            DOM.city.innerHTML = '<option value="">Selecione o estado primeiro</option>';
            return;
        }

        DOM.city.disabled = true;
        DOM.city.innerHTML = '<option value="">Carregando cidades...</option>';
        await carregarCidades(uf);
        DOM.city.disabled = true;
    });
}

async function preencherLocalizacao(estado, cidade) {
    if (!DOM.state || !DOM.city) return;
    await carregarEstados();

    if (!estado) {
        DOM.state.value = "";
        DOM.state.disabled = true;
        DOM.city.disabled = true;
        DOM.city.innerHTML = '<option value="">Selecione o estado primeiro</option>';
        return;
    }

    DOM.state.value = estado;
    await carregarCidades(estado, cidade);

    DOM.state.disabled = true;
    DOM.city.disabled = true;
}

// =============================================================
// CARREGAR DADOS INICIAIS
// =============================================================
export async function carregarDadosIniciais() {
    try {
        const data = await API.obterPerfil();
        const caminhoFoto = data.foto_perfil || "../static/assets/user.webp";

        if (DOM.userName) DOM.userName.textContent = data.nome || "";
        if (DOM.userRole) DOM.userRole.textContent = capitalizar(data.tipo);

        configurarFotoComFallback(DOM.profileImg, caminhoFoto);

        const fotoDrawer = document.querySelector('.usuario-foto');
        if (fotoDrawer) configurarFotoComFallback(fotoDrawer, caminhoFoto);

        if (DOM.inputs.length >= 6) {
            DOM.inputs[0].value = data.nome || "";
            DOM.inputs[1].value = data.email || "";
            DOM.inputs[2].value = data.telefone || "";
            await preencherLocalizacao(data.estado, data.cidade);
            DOM.inputs[5].value = "••••••••";
        }
    } catch (error) {
        console.error("Falha ao inicializar perfil:", error);
    }
}

// =============================================================
// SALVAR DADOS
// =============================================================
async function salvarDados(dadosExtras = {}) {
    const formData = new FormData();

    if (DOM.inputs[0]) formData.append('nome', DOM.inputs[0].value);
    if (DOM.inputs[1]) formData.append('email', DOM.inputs[1].value);
    if (DOM.inputs[2]) formData.append('telefone', DOM.inputs[2].value);

    if (DOM.city && DOM.state) {
        formData.append('cidade', DOM.city.value);
        formData.append('estado', DOM.state.value);
    }

    const senha = DOM.inputs[5] ? DOM.inputs[5].value : "";
    if (senha !== '••••••••' && senha.trim() !== '') {
        formData.append('senha', senha);
    }

    if (dadosExtras.foto) {
        formData.append('foto', dadosExtras.foto);
    }

    try {
        await API.atualizarPerfil(formData);
        if (DOM.userName && DOM.inputs[0]) {
            DOM.userName.textContent = DOM.inputs[0].value;
        }
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
    }
}

// =============================================================
// CONFIGURAR EDIÇÃO E SALVAMENTO
// =============================================================
export function configurarEdicaoESalvamento() {
    DOM.editIcons.forEach(icon => {
        icon.addEventListener('click', async (e) => {
            const target = icon.getAttribute('data-target');
            const input = target ? document.getElementById(target) : e.target.closest('.input-wrapper')?.querySelector('.form-control');
            if (!input) return;

            if (input.id === "profile-state") {
                abrirSelect(input);
                return;
            }

            if (input.id === "profile-city") {
                if (!DOM.state || !DOM.state.value) {
                    if (typeof exibirNotificacao === "function") {
                        exibirNotificacao("erro", "Selecione o estado primeiro.");
                    }
                    return;
                }

                if (!DOM.city.options || DOM.city.options.length <= 1) {
                    await carregarCidades(DOM.state.value);
                }

                abrirSelect(input);
                return;
            }

            input.removeAttribute('readonly');
            input.focus();
            if (input.type === 'password') input.value = '';
        });
    });

    DOM.allEditable.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.tagName === "SELECT") {
                if (!input.disabled) {
                    input.disabled = true;
                    if (input.id === "profile-state" && (!DOM.city || !DOM.city.value)) return;
                    salvarDados();
                }
                return;
            }

            if (!input.hasAttribute('readonly')) {
                input.setAttribute('readonly', true);
                if (input.type === 'password' && input.value === '') {
                    input.value = "••••••••";
                }
                salvarDados();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT') {
                e.preventDefault();
                input.blur();
            }
        });
    });
}

// =============================================================
// UPLOAD DE FOTO
// =============================================================
export function configurarUploadFoto() {
    if (!DOM.uploadZone || !DOM.fileInput) return;

    DOM.uploadZone.addEventListener('click', () => DOM.fileInput.click());

    DOM.fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const arquivo = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                if (DOM.profileImg) DOM.profileImg.src = event.target.result;
                const fotoDrawer = document.querySelector('.usuario-foto');
                if (fotoDrawer) fotoDrawer.src = event.target.result;
            };

            reader.readAsDataURL(arquivo);
            await salvarDados({ foto: arquivo });
        }
    });
}

// =============================================================
// MODAL DE EXCLUSÃO
// =============================================================
export function configurarModalExclusao() {
    if (!DOM.btnDeleteAcc || !DOM.modalDelete || !DOM.btnCancelDelete || !DOM.btnConfirmDelete) return;

    DOM.btnDeleteAcc.addEventListener('click', () => DOM.modalDelete.classList.add('active'));
    DOM.btnCancelDelete.addEventListener('click', () => DOM.modalDelete.classList.remove('active'));

    DOM.btnConfirmDelete.addEventListener('click', async () => {
        try {
            await API.excluirConta();
            if (typeof agendarNotificacao === "function") {
                agendarNotificacao('exclusao', 'Conta excluída com sucesso!');
            }
            window.location.href = '/login';
        } catch (error) {
            if (typeof exibirNotificacao === "function") {
                exibirNotificacao('erro', error.message);
            }
            DOM.modalDelete.classList.remove('active');
        }
    });
}