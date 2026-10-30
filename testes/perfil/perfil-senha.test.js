import {
    describe, it, expect, beforeEach, vi
} from "vitest";

let senha;

function criarHTML() {
    document.body.innerHTML = `
        <input id="profile-password" readonly type="password">

        <div id="profile-confirm-password-group" hidden>
            <input
                id="profile-confirm-password"
                readonly
                type="password"
            >
        </div>

        <div class="input-wrapper">
            <input id="outra-senha" type="password">
        </div>

        <button
            class="toggle-password"
            data-target="profile-password"
            aria-label="Mostrar senha"
            title="Mostrar senha"
            type="button"
        >
            <i class="fa-eye"></i>
        </button>

        <button
            class="toggle-password"
            data-target="profile-confirm-password"
            type="button"
        >
            <i class="fa-eye"></i>
        </button>

        <button
            class="toggle-password"
            data-target="outra-senha"
            type="button"
        ></button>
    `;
}

describe("Senha do perfil", () => {
    beforeEach(async () => {
        vi.resetModules();

        criarHTML();

        senha = await import(
            "../../static/js/perfil/senha.js"
        );
    });

    it("exporta a máscara de senha esperada", () => {
        expect(senha.MASCARA_SENHA).toBe("••••••••");
    });

    it("obtém o campo de confirmação", () => {
        expect(senha.obterCampoConfirmacao()).toBe(
            document.getElementById("profile-confirm-password")
        );
    });

    it("retorna null quando o contêiner não recebe campo", () => {
        expect(senha.obterContainerCampo(null)).toBeNull();
    });

    it("obtém o grupo específico da confirmação", () => {
        expect(
            senha.obterContainerCampo(
                document.getElementById("profile-confirm-password")
            )
        ).toBe(
            document.getElementById("profile-confirm-password-group")
        );
    });

    it("obtém o contêiner de um campo dentro de wrapper", () => {
        document.body.insertAdjacentHTML(
            "beforeend",
            `
                <div class="form-group" id="grupo">
                    <div class="input-wrapper">
                        <input id="campo-teste">
                    </div>
                </div>
            `
        );

        expect(
            senha.obterContainerCampo(
                document.getElementById("campo-teste")
            )
        ).toBe(document.getElementById("grupo"));
    });

    it("usa o elemento pai quando não há wrapper", () => {
        const pai = document.createElement("div");
        const campo = document.createElement("input");

        pai.appendChild(campo);

        expect(senha.obterContainerCampo(campo)).toBe(pai);
    });

    it("mostra confirmação e ícones durante edição", () => {
        senha.configurarVisibilidadeEdicaoSenha(true);

        expect(
            document.getElementById("profile-confirm-password-group").hidden
        ).toBe(false);

        expect(
            document.querySelectorAll(".toggle-password")[0].hidden
        ).toBe(false);

        expect(
            document.getElementById("profile-confirm-password").readOnly
        ).toBe(false);
    });

    it("oculta confirmação e ícones fora da edição", () => {
        senha.configurarVisibilidadeEdicaoSenha(false);

        expect(
            document.getElementById("profile-confirm-password-group").hidden
        ).toBe(true);

        expect(
            document.getElementById("profile-confirm-password").value
        ).toBe("");

        expect(
            document.querySelectorAll(".toggle-password")[0].hidden
        ).toBe(true);

        expect(
            document.getElementById("profile-password").readOnly
        ).toBe(true);
    });

    it("ignora ícones que não pertencem aos campos de senha", () => {
        const icone = document.querySelector(
            '[data-target="outra-senha"]'
        );

        senha.configurarVisibilidadeEdicaoSenha(true);

        expect(icone.hidden).toBe(false);
        expect(icone.style.display).toBe("");
    });

    it("inicializa os eventos globais uma única vez", () => {
        const spy = vi.spyOn(document, "addEventListener");

        senha.inicializarToggleSenhaGlobal();
        senha.inicializarToggleSenhaGlobal();

        const cliques = spy.mock.calls.filter(
            ([evento]) => evento === "click"
        );

        expect(cliques).toHaveLength(1);
    });

    
    it("mostra e oculta a senha ao clicar no ícone", () => {
        senha.configurarVisibilidadeEdicaoSenha(true);

        const campo = document.getElementById("profile-password");

        // Simula o campo principal em modo de edição.
        campo.readOnly = false;

        senha.inicializarToggleSenhaGlobal();

        const icone = document.querySelector(
            '[data-target="profile-password"]'
        );

        icone.click();

        expect(campo.type).toBe("text");
        expect(icone.getAttribute("aria-label")).toBe("Ocultar senha");
        expect(icone.getAttribute("title")).toBe("Ocultar senha");
        expect(icone.classList.contains("fa-eye-slash")).toBe(true);

        icone.click();

        expect(campo.type).toBe("password");
        expect(icone.getAttribute("aria-label")).toBe("Mostrar senha");
        expect(icone.getAttribute("title")).toBe("Mostrar senha");
        expect(icone.classList.contains("fa-eye")).toBe(true);
    });

    it("não mostra a senha quando o modo de edição está desativado", () => {
        senha.configurarVisibilidadeEdicaoSenha(false);
        senha.inicializarToggleSenhaGlobal();

        const icone = document.querySelector(
            '[data-target="profile-password"]'
        );

        icone.click();

        expect(
            document.getElementById("profile-password").type
        ).toBe("password");
    });

    it("não duplica a inicialização dos campos de senha", () => {
        senha.inicializarCamposSenha();
        senha.inicializarCamposSenha();

        expect(
            document.documentElement.dataset.toggleSenhaInicializado
        ).toBe("true");
    });
});
