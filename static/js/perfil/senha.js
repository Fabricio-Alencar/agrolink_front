
/* =========================================================
   CONFIGURAÇÃO DOS CAMPOS DE SENHA
========================================================= */

export const MASCARA_SENHA = "••••••••";

/* =========================================================
   OBTER CAMPO DE CONFIRMAÇÃO
========================================================= */

export function obterCampoConfirmacao() {
    return document.getElementById("profile-confirm-password");
}

/* =========================================================
   OBTER CONTÊINER DO CAMPO
========================================================= */

export function obterContainerCampo(campo) {
    if (!campo) return null;

    if (campo.id === "profile-confirm-password") {
        return document.getElementById(
            "profile-confirm-password-group"
        );
    }

    const wrapper = campo.closest(".input-wrapper");

    if (wrapper) {
        return wrapper.closest(
            ".form-group, .form-field, .form-item, .campo, .input-group"
        );
    }

    return campo.parentElement;
}

/* =========================================================
   MOSTRAR / OCULTAR OLHOS E CONFIRMAÇÃO
========================================================= */

export function configurarVisibilidadeEdicaoSenha(emEdicao) {
    const senha = document.getElementById("profile-password");
    const confirmacao = obterCampoConfirmacao();
    const grupoConfirmacao = document.getElementById(
        "profile-confirm-password-group"
    );

    // -------------------------------------------------------
    // CAMPO DE CONFIRMAÇÃO
    // -------------------------------------------------------

    if (grupoConfirmacao) {
        grupoConfirmacao.hidden = !emEdicao;
    }

    if (confirmacao) {
        confirmacao.readOnly = !emEdicao;
        confirmacao.disabled = false;

        if (!emEdicao) {
            confirmacao.value = "";
            confirmacao.type = "password";
        }
    }

    // -------------------------------------------------------
    // ÍCONES DE MOSTRAR / OCULTAR SENHA
    // -------------------------------------------------------

    document.querySelectorAll(".toggle-password").forEach(icon => {
        const targetId = icon.getAttribute("data-target");

        const pertenceAoCampoSenha =
            targetId === "profile-password" ||
            targetId === "profile-confirm-password";

        if (!pertenceAoCampoSenha) return;

        // Oculta os ícones fora do modo de edição.
        icon.hidden = !emEdicao;
        icon.style.display = emEdicao ? "" : "none";

        // Restaura o estado inicial do ícone.
        if (!emEdicao) {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

            icon.setAttribute("aria-label", "Mostrar senha");
            icon.setAttribute("title", "Mostrar senha");
        }
    });

    // -------------------------------------------------------
    // RESTAURAR SENHA QUANDO NÃO ESTIVER EDITANDO
    // -------------------------------------------------------

    if (senha && !emEdicao) {
        senha.type = "password";
        senha.setAttribute("readonly", "");
    }
}

/* =========================================================
   EVENTO GLOBAL DOS OLHOS
========================================================= */

export function inicializarToggleSenhaGlobal() {
    // Evita registrar o evento mais de uma vez.
    if (
        document.documentElement.dataset.toggleSenhaInicializado === "true"
    ) {
        return;
    }

    document.documentElement.dataset.toggleSenhaInicializado = "true";

    document.addEventListener("click", event => {
        const icon = event.target.closest(".toggle-password");

        // Ignora cliques fora do ícone ou quando ele está oculto.
        if (!icon || icon.hidden) return;

        // Segurança adicional: não permite alternar a senha
        // se os controles não estiverem no modo de edição.
        const senha = document.getElementById("profile-password");
        const emEdicao = senha && !senha.readOnly;

        if (!emEdicao) return;

        event.preventDefault();

        const targetId = icon.getAttribute("data-target");
        const campo = targetId
            ? document.getElementById(targetId)
            : icon.closest(".input-wrapper")?.querySelector("input");

        if (!campo) {
            console.error(
                "Campo de senha não encontrado:",
                targetId
            );
            return;
        }

        // Alterna a visibilidade da senha correspondente.
        const mostrar = campo.type === "password";

        campo.type = mostrar ? "text" : "password";

        // Atualiza o ícone.
        icon.classList.toggle("fa-eye", !mostrar);
        icon.classList.toggle("fa-eye-slash", mostrar);

        // Atualiza a acessibilidade.
        icon.setAttribute(
            "aria-label",
            mostrar ? "Ocultar senha" : "Mostrar senha"
        );

        icon.setAttribute(
            "title",
            mostrar ? "Ocultar senha" : "Mostrar senha"
        );
    });
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export function inicializarCamposSenha() {
    inicializarToggleSenhaGlobal();

    // Começa com os olhos e a confirmação ocultos.
    configurarVisibilidadeEdicaoSenha(false);
}
