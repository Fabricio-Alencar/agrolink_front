
import { DOM } from './dom.js';
import { API } from './api.js';
import { preencherLocalizacao } from './localizacao.js';
import {
    obterDigitosTelefone,
    formatarTelefone,
    telefoneValido,
    configurarCampoTelefone
} from './telefone.js';
import {
    localizacaoValida,
    avisarLocalizacaoInvalida
} from './validacao-localizacao.js';
import {
    MASCARA_SENHA,
    obterCampoConfirmacao,
    configurarVisibilidadeEdicaoSenha
} from './senha.js';
import {
    configurarFotoComFallback,
    configurarUploadFoto
} from './upload-foto.js';

/* =========================================================
   UTILITÁRIOS
========================================================= */

function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/* =========================================================
   CAMPOS DE SELEÇÃO
========================================================= */

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

/* =========================================================
   CARREGAMENTO INICIAL
========================================================= */

export async function carregarDadosIniciais() {
    try {
        const data = await API.obterPerfil();
        const caminhoFoto =
            data.foto_perfil || "../static/assets/user.webp";

        if (DOM.userName) {
            DOM.userName.textContent = data.nome || "";
        }

        if (DOM.userRole) {
            DOM.userRole.textContent = capitalizar(data.tipo);
        }

        const userMiniName = document.getElementById("userMiniName");
        const userMiniRole = document.getElementById("userMiniRole");

        if (userMiniName) {
            userMiniName.textContent = data.nome || "Usuário";
        }

        if (userMiniRole) {
            userMiniRole.textContent = capitalizar(data.tipo || "Membro");
        }

        const blocoAvaliacao = document.getElementById("perfil-avaliacao");

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
                <a class="link-produtor" href="/produtor/${Number(data.id)}">
                    Ver meu perfil público e avaliações
                </a>
            `;

            blocoAvaliacao.style.display = "flex";
        }

        configurarFotoComFallback(DOM.profileImg, caminhoFoto);

        const fotoDrawer = document.querySelector(".usuario-foto");

        if (fotoDrawer) {
            configurarFotoComFallback(fotoDrawer, caminhoFoto);
        }

        if (DOM.inputs.length >= 6) {
            DOM.inputs[0].value = data.nome || "";
            DOM.inputs[1].value = data.email || "";

            // Exibe o telefone já formatado.
            DOM.inputs[2].value = formatarTelefone(data.telefone || "");

            await preencherLocalizacao(data.estado, data.cidade);

            DOM.inputs[5].value = MASCARA_SENHA;
            DOM.inputs[5].type = "password";
            DOM.inputs[5].setAttribute("readonly", "");
        }

        const confirmarSenha = obterCampoConfirmacao();

        if (confirmarSenha) {
            confirmarSenha.value = "";
            confirmarSenha.type = "password";
            confirmarSenha.setAttribute("readonly", "");
        }

        configurarVisibilidadeEdicaoSenha(false);

    } catch (error) {
        console.error("Falha ao inicializar perfil:", error);
    }
}

/* =========================================================
   EDIÇÃO E SALVAMENTO
========================================================= */

export function configurarEdicaoESalvamento() {
    configurarCampoTelefone();

    DOM.editIcons.forEach(icon => {
        if (icon.dataset.edicaoConfigurada === "true") return;

        icon.dataset.edicaoConfigurada = "true";

        icon.addEventListener("click", event => {
            const target = icon.getAttribute("data-target");

            const input = target
                ? document.getElementById(target)
                : event.target
                    .closest(".input-wrapper")
                    ?.querySelector(".form-control");

            if (!input) return;

            if (input.id === "profile-state") {
                abrirSelect(input);
                return;
            }

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

            input.removeAttribute("readonly");
            input.disabled = false;
            input.focus();
        });
    });

    const form = document.getElementById("user-form");

    if (form && form.dataset.submitConfigurado !== "true") {
        form.dataset.submitConfigurado = "true";

        form.addEventListener("submit", async event => {
            event.preventDefault();

            /* VALIDAR LOCALIZAÇÃO */
            if (!localizacaoValida()) {
                avisarLocalizacaoInvalida();
                return;
            }

            /* VALIDAR TELEFONE */
            const telefone = DOM.inputs[2];

            if (telefone && !telefoneValido(telefone.value)) {
                if (typeof exibirNotificacao === "function") {
                    exibirNotificacao(
                        "erro",
                        "Informe um telefone completo com DDD (10 ou 11 números)."
                    );
                }

                telefone.focus();
                return;
            }

            /* VALIDAR SENHA */
            const senhaInput =
                document.getElementById("profile-password");

            const confirmarSenhaInput = obterCampoConfirmacao();

            if (senhaInput && confirmarSenhaInput) {
                const senha = senhaInput.value;
                const confirmarSenha = confirmarSenhaInput.value;

                if (senha !== MASCARA_SENHA && senha.trim() !== "") {
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

    configurarUploadFoto(async arquivoFoto => {
        await salvarDadosGerais({ foto: arquivoFoto });
    });
}

/* =========================================================
   SALVAR DADOS
========================================================= */

export async function salvarDadosGerais(dadosExtras = {}) {
    if (!localizacaoValida()) {
        avisarLocalizacaoInvalida();
        return;
    }

    const formData = new FormData();

    if (DOM.inputs[0]) {
        formData.append("nome", DOM.inputs[0].value);
    }

    if (DOM.inputs[1]) {
        formData.append("email", DOM.inputs[1].value);
    }

    if (DOM.inputs[2]) {
        // A API recebe somente os números do telefone.
        formData.append(
            "telefone",
            obterDigitosTelefone(DOM.inputs[2].value)
        );
    }

    if (DOM.city && DOM.state) {
        formData.append("cidade", DOM.city.value);
        formData.append("estado", DOM.state.value);
    }

    const senha = DOM.inputs[5] ? DOM.inputs[5].value : "";

    if (senha && senha !== MASCARA_SENHA && senha.trim() !== "") {
        formData.append("senha", senha);
    }

    if (dadosExtras.foto) {
        formData.append("foto", dadosExtras.foto);
    }

    try {
        await API.atualizarPerfil(formData);

        if (DOM.userName && DOM.inputs[0]) {
            DOM.userName.textContent = DOM.inputs[0].value;
        }

        const userMiniName = document.getElementById("userMiniName");

        if (userMiniName && DOM.inputs[0]) {
            userMiniName.textContent = DOM.inputs[0].value;
        }

        // Mantém o telefone formatado após salvar.
        if (DOM.inputs[2]) {
            DOM.inputs[2].value = formatarTelefone(DOM.inputs[2].value);
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

/* =========================================================
   BLOQUEAR CAMPOS APÓS SALVAR
========================================================= */

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

            if (input.id === "profile-phone") {
                input.value = formatarTelefone(input.value);
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
