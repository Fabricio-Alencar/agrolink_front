
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

    img.onerror = () => {
        img.onerror = null;
        img.src = "../static/assets/user.png";
    };

    img.src = url;
}

function abrirSelect(select) {
    if (!select) return;

    select.disabled = false;
    select.focus();

    if (typeof select.showPicker === "function") {
        try {
            select.showPicker();
        } catch (e) {}
    }
}

// =============================================================
// AUXILIARES DE SENHA
// =============================================================
const MASCARA_SENHA = "••••••••";

function obterCampoConfirmacao() {
    return document.getElementById("profile-confirm-password");
}

function obterContainerCampo(campo) {
    if (!campo) return null;

    // Procura o contêiner visual do campo sem ocultar
    // um contêiner que também contenha outros campos.
    const wrapper = campo.closest(".input-wrapper");

    if (wrapper) {
        const grupo = wrapper.closest(
            ".form-group, .form-field, .form-item, .campo, .input-group"
        );

        if (grupo && grupo.contains(campo)) {
            return grupo;
        }
    }

    return campo.parentElement;
}

function configurarVisibilidadeEdicaoSenha(emEdicao) {
    const senha = document.getElementById("profile-password");
    const confirmacao = obterCampoConfirmacao();

    // Mostrar ou ocultar o campo de confirmação
    if (confirmacao) {
        const container = obterContainerCampo(confirmacao);

        if (container) {
            container.hidden = !emEdicao;
        }

        confirmacao.readOnly = !emEdicao;
        confirmacao.disabled = false;

        if (!emEdicao) {
            confirmacao.value = "";
            confirmacao.type = "password";
        }
    }

    // Mostrar ou ocultar os olhos dos campos de senha
    document.querySelectorAll(".toggle-password").forEach(icon => {
        const targetId = icon.getAttribute("data-target");

        if (
            targetId === "profile-password" ||
            targetId === "profile-confirm-password"
        ) {
            icon.hidden = !emEdicao;

            if (!emEdicao) {
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");

                icon.setAttribute("aria-label", "Mostrar senha");
                icon.setAttribute("title", "Mostrar senha");
            }
        }
    });

    if (senha && !emEdicao) {
        senha.type = "password";
    }
}

// =============================================================
// MOSTRAR / OCULTAR SENHA
// =============================================================
function configurarEventosMostrarSenha() {
    document.querySelectorAll(".toggle-password").forEach(icon => {
        if (icon.dataset.toggleConfigurado === "true") {
            return;
        }

        icon.dataset.toggleConfigurado = "true";

        icon.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            const targetId = icon.getAttribute("data-target");

            const campo = targetId
                ? document.getElementById(targetId)
                : icon.closest(".input-wrapper")
                    ?.querySelector("input");

            if (!campo) {
                console.error(
                    "Campo de senha não encontrado:",
                    targetId
                );
                return;
            }

            const mostrar = campo.type === "password";

            campo.type = mostrar ? "text" : "password";

            icon.classList.toggle("fa-eye", !mostrar);
            icon.classList.toggle("fa-eye-slash", mostrar);

            icon.setAttribute(
                "aria-label",
                mostrar ? "Ocultar senha" : "Mostrar senha"
            );

            icon.setAttribute(
                "title",
                mostrar ? "Ocultar senha" : "Mostrar senha"
            );
        });

        icon.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                icon.click();
            }
        });
    });
}

// =============================================================
// LOCALIZAÇÃO (IBGE)
// =============================================================
async function carregarEstados() {
    if (!DOM.state) return;

    try {
        DOM.state.innerHTML =
            '<option value="">Selecione o estado</option>';

        const response = await fetch(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
        );

        if (!response.ok) {
            throw new Error("Erro ao carregar estados.");
        }

        const estados = await response.json();

        estados.forEach(estado => {
            const option = document.createElement("option");

            option.value = estado.sigla;
            option.textContent = estado.nome;

            DOM.state.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar estados:", error);

        DOM.state.innerHTML =
            '<option value="">Erro ao carregar estados</option>';
    }
}

async function carregarCidades(uf, cidadeSelecionada = "") {
    if (!DOM.city || !uf) return;

    try {
        DOM.city.disabled = false;

        DOM.city.innerHTML =
            '<option value="">Carregando cidades...</option>';

        const response = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );

        if (!response.ok) {
            throw new Error("Erro ao carregar cidades.");
        }

        const cidades = await response.json();

        DOM.city.innerHTML =
            '<option value="">Selecione a cidade</option>';

        cidades.forEach(cidade => {
            const option = document.createElement("option");

            option.value = cidade.nome;
            option.textContent = cidade.nome;

            if (cidade.nome === cidadeSelecionada) {
                option.selected = true;
            }

            DOM.city.appendChild(option);
        });

        DOM.city.disabled = false;
    } catch (error) {
        console.error("Erro ao carregar cidades:", error);

        DOM.city.innerHTML =
            '<option value="">Erro ao carregar cidades</option>';

        DOM.city.disabled = true;
    }
}

export function configurarLocalizacao() {
    if (!DOM.state || !DOM.city) return;

    DOM.state.addEventListener("change", async () => {
        const uf = DOM.state.value;

        DOM.city.innerHTML =
            '<option value="">Selecione o estado primeiro</option>';

        DOM.city.value = "";
        DOM.city.disabled = true;

        if (!uf) return;

        await carregarCidades(uf);
    });
}

async function preencherLocalizacao(estado, cidade) {
    if (!DOM.state || !DOM.city) return;

    await carregarEstados();

    if (!estado) {
        DOM.state.value = "";
        DOM.state.disabled = true;

        DOM.city.disabled = true;

        DOM.city.innerHTML =
            '<option value="">Selecione o estado primeiro</option>';

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

        const caminhoFoto =
            data.foto_perfil || "../static/assets/user.webp";

        // Cabeçalho e drawer lateral
        if (DOM.userName) {
            DOM.userName.textContent = data.nome || "";
        }

        if (DOM.userRole) {
            DOM.userRole.textContent = capitalizar(data.tipo);
        }

        // Card lateral do perfil
        const userMiniName =
            document.getElementById("userMiniName");

        const userMiniRole =
            document.getElementById("userMiniRole");

        const userMiniMember =
            document.getElementById("userMiniMember");

        if (userMiniName) {
            userMiniName.textContent = data.nome || "Usuário";
        }

        if (userMiniRole) {
            userMiniRole.textContent =
                capitalizar(data.tipo || "Membro");
        }

        if (userMiniMember) {
            if (data.membro_desde) {
                userMiniMember.textContent =
                    `Membro AgroLink desde ${data.membro_desde}`;
            } else if (data.criado_em) {
                userMiniMember.textContent =
                    `Membro AgroLink desde ${data.criado_em}`;
            } else {
                userMiniMember.textContent =
                    "Membro AgroLink desde 2024";
            }
        }

        // Avaliações do produtor
        const blocoAvaliacao =
            document.getElementById("perfil-avaliacao");

        if (
            blocoAvaliacao &&
            data.tipo === "produtor" &&
            window.Avaliacoes
        ) {
            blocoAvaliacao.innerHTML = `
                ${window.Avaliacoes.resumo(
                    data.media_avaliacoes,
                    data.total_avaliacoes,
                    20
                )}
                <a class="link-produtor"
                   href="/produtor/${Number(data.id)}">
                    Ver meu perfil público e avaliações
                </a>
            `;

            blocoAvaliacao.style.display = "flex";
        }

        // Fotos de perfil
        configurarFotoComFallback(DOM.profileImg, caminhoFoto);

        const fotoDrawer =
            document.querySelector(".usuario-foto");

        if (fotoDrawer) {
            configurarFotoComFallback(fotoDrawer, caminhoFoto);
        }

        // Preencher formulário
        if (DOM.inputs.length >= 6) {
            DOM.inputs[0].value = data.nome || "";
            DOM.inputs[1].value = data.email || "";
            DOM.inputs[2].value = data.telefone || "";

            await preencherLocalizacao(
                data.estado,
                data.cidade
            );

            // Máscara visual; a senha real não vem da API.
            DOM.inputs[5].value = MASCARA_SENHA;
            DOM.inputs[5].type = "password";
            DOM.inputs[5].setAttribute("readonly", "");
        }

        // Campo de confirmação começa oculto e bloqueado
        const confirmarSenha = obterCampoConfirmacao();

        if (confirmarSenha) {
            confirmarSenha.value = "";
            confirmarSenha.type = "password";
            confirmarSenha.setAttribute("readonly", "");
        }

        configurarEventosMostrarSenha();
        configurarVisibilidadeEdicaoSenha(false);

    } catch (error) {
        console.error("Falha ao inicializar perfil:", error);
    }
}

// =============================================================
// CONFIGURAR EDIÇÃO E SALVAMENTO
// =============================================================
export function configurarEdicaoESalvamento() {

    // ---------------------------------------------------------
    // 1. LIBERAR CAMPOS PARA EDIÇÃO
    // ---------------------------------------------------------
    DOM.editIcons.forEach(icon => {
        if (icon.dataset.edicaoConfigurada === "true") {
            return;
        }

        icon.dataset.edicaoConfigurada = "true";

        icon.addEventListener("click", event => {
            const target = icon.getAttribute("data-target");

            const input = target
                ? document.getElementById(target)
                : event.target.closest(".input-wrapper")
                    ?.querySelector(".form-control");

            if (!input) return;

            // Estado
            if (input.id === "profile-state") {
                abrirSelect(input);
                return;
            }

            // Cidade
            if (input.id === "profile-city") {
                if (!DOM.state || !DOM.state.value) {
                    if (typeof exibirNotificacao === "function") {
                        exibirNotificacao(
                            "erro",
                            "Selecione o estado primeiro."
                        );
                    }

                    return;
                }

                abrirSelect(input);
                return;
            }

            // Senha: exibir confirmação e olhos
            if (input.id === "profile-password") {
                if (input.value === MASCARA_SENHA) {
                    input.value = "";
                }

                input.type = "password";
                input.removeAttribute("readonly");
                input.disabled = false;

                configurarVisibilidadeEdicaoSenha(true);

                const confirmarSenha = obterCampoConfirmacao();

                if (confirmarSenha) {
                    confirmarSenha.value = "";
                    confirmarSenha.type = "password";
                    confirmarSenha.removeAttribute("readonly");
                    confirmarSenha.disabled = false;
                }

                input.focus();
                return;
            }

            // Demais campos
            input.removeAttribute("readonly");
            input.disabled = false;
            input.focus();
        });
    });

    configurarEventosMostrarSenha();

    // ---------------------------------------------------------
    // 2. VALIDAÇÃO E SALVAMENTO DO FORMULÁRIO
    // ---------------------------------------------------------
    const form = document.getElementById("user-form");

    if (form && form.dataset.submitConfigurado !== "true") {
        form.dataset.submitConfigurado = "true";

        form.addEventListener("submit", async event => {
            event.preventDefault();

            const senhaInput =
                document.getElementById("profile-password");

            const confirmarSenhaInput = obterCampoConfirmacao();

            if (senhaInput && confirmarSenhaInput) {
                const senha = senhaInput.value;
                const confirmarSenha = confirmarSenhaInput.value;

                // Validar quando uma nova senha for informada
                if (
                    senha !== MASCARA_SENHA &&
                    senha.trim() !== ""
                ) {
                    if (!confirmarSenha) {
                        if (typeof exibirNotificacao === "function") {
                            exibirNotificacao(
                                "erro",
                                "Confirme sua nova senha."
                            );
                        }

                        return;
                    }

                    if (senha !== confirmarSenha) {
                        if (typeof exibirNotificacao === "function") {
                            exibirNotificacao(
                                "erro",
                                "As senhas não coincidem. Verifique e tente novamente."
                            );
                        }

                        return;
                    }
                }
            }

            await salvarDadosGerais();
        });
    }
}

// =============================================================
// SALVAR DADOS GERAIS
// =============================================================
async function salvarDadosGerais(dadosExtras = {}) {
    const formData = new FormData();

    if (DOM.inputs[0]) {
        formData.append("nome", DOM.inputs[0].value);
    }

    if (DOM.inputs[1]) {
        formData.append("email", DOM.inputs[1].value);
    }

    if (DOM.inputs[2]) {
        formData.append("telefone", DOM.inputs[2].value);
    }

    if (DOM.city && DOM.state) {
        formData.append("cidade", DOM.city.value);
        formData.append("estado", DOM.state.value);
    }

    const senha = DOM.inputs[5]
        ? DOM.inputs[5].value
        : "";

    // Enviar somente uma nova senha
    if (
        senha &&
        senha !== MASCARA_SENHA &&
        senha.trim() !== ""
    ) {
        formData.append("senha", senha);
    }

    if (dadosExtras.foto) {
        formData.append("foto", dadosExtras.foto);
    }

    try {
        await API.atualizarPerfil(formData);

        // Atualizar nome no cabeçalho
        if (DOM.userName && DOM.inputs[0]) {
            DOM.userName.textContent = DOM.inputs[0].value;
        }

        const userMiniName =
            document.getElementById("userMiniName");

        if (userMiniName && DOM.inputs[0]) {
            userMiniName.textContent = DOM.inputs[0].value;
        }

        if (typeof exibirNotificacao === "function") {
            exibirNotificacao(
                "edicao",
                "Alterações salvas com sucesso!"
            );
        }

        bloquearCamposAposSalvar();

    } catch (error) {
        console.error("Erro ao salvar perfil:", error);

        if (typeof exibirNotificacao === "function") {
            exibirNotificacao(
                "erro",
                error.message || "Erro ao salvar alterações."
            );
        }
    }
}

// =============================================================
// BLOQUEAR CAMPOS APÓS SALVAR
// =============================================================
function bloquearCamposAposSalvar() {
    DOM.inputs.forEach(input => {
        if (input.tagName === "SELECT") {
            input.disabled = true;
        } else {
            input.setAttribute("readonly", "");

            if (input.id === "profile-password") {
                input.type = "password";
                input.value = MASCARA_SENHA;
            }
        }
    });

    const confirmarSenha = obterCampoConfirmacao();

    if (confirmarSenha) {
        confirmarSenha.value = "";
        confirmarSenha.type = "password";
        confirmarSenha.setAttribute("readonly", "");
    }

    configurarVisibilidadeEdicaoSenha(false);
}

// =============================================================
// UPLOAD DE FOTO
// =============================================================
export function configurarUploadFoto() {
    if (!DOM.uploadZone || !DOM.fileInput) return;

    DOM.uploadZone.addEventListener("click", () => {
        DOM.fileInput.click();
    });

    DOM.fileInput.addEventListener("change", async event => {
        if (event.target.files.length > 0) {
            const arquivo = event.target.files[0];

            const reader = new FileReader();

            reader.onload = loadEvent => {
                if (DOM.profileImg) {
                    DOM.profileImg.src = loadEvent.target.result;
                }

                const fotoDrawer =
                    document.querySelector(".usuario-foto");

                if (fotoDrawer) {
                    fotoDrawer.src = loadEvent.target.result;
                }
            };

            reader.readAsDataURL(arquivo);

            await salvarDadosGerais({
                foto: arquivo
            });
        }
    });
}

// =============================================================
// MODAL DE EXCLUSÃO
// =============================================================
export function configurarModalExclusao() {
    if (
        !DOM.btnDeleteAcc ||
        !DOM.modalDelete ||
        !DOM.btnCancelDelete ||
        !DOM.btnConfirmDelete
    ) {
        return;
    }

    DOM.btnDeleteAcc.addEventListener("click", () => {
        DOM.modalDelete.classList.add("active");
    });

    DOM.btnCancelDelete.addEventListener("click", () => {
        DOM.modalDelete.classList.remove("active");
    });

    DOM.btnConfirmDelete.addEventListener("click", async () => {
        try {
            await API.excluirConta();

            if (typeof agendarNotificacao === "function") {
                agendarNotificacao(
                    "exclusao",
                    "Conta excluída com sucesso!"
                );
            }

            window.location.href = "/login";

        } catch (error) {
            if (typeof exibirNotificacao === "function") {
                exibirNotificacao("erro", error.message);
            }

            DOM.modalDelete.classList.remove("active");
        }
    });
}

// =============================================================
// INICIALIZAÇÃO INDEPENDENTE DOS OLHOS
// =============================================================
configurarEventosMostrarSenha();
configurarVisibilidadeEdicaoSenha(false);
