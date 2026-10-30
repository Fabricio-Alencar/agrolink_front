import {
    describe, it, expect, beforeEach, vi
} from "vitest";

const mocks = vi.hoisted(() => ({
    obterPerfil: vi.fn(),
    atualizarPerfil: vi.fn(),
    preencherLocalizacao: vi.fn(),
    obterDigitosTelefone: vi.fn(value => value.replace(/\D/g, "")),
    formatarTelefone: vi.fn(value => value),
    telefoneValido: vi.fn(() => true),
    configurarCampoTelefone: vi.fn(),
    localizacaoValida: vi.fn(() => true),
    avisarLocalizacaoInvalida: vi.fn(),
    obterCampoConfirmacao: vi.fn(),
    configurarVisibilidadeEdicaoSenha: vi.fn(),
    configurarFotoComFallback: vi.fn(),
    configurarUploadFoto: vi.fn()
}));

vi.mock("../../static/js/avaliacoes.js", () => ({
    Avaliacoes: {
        resumo: vi.fn(() => "<p>Avaliações</p>")
    }
}));

vi.mock("../../static/js/perfil/api.js", () => ({
    API: {
        obterPerfil: mocks.obterPerfil,
        atualizarPerfil: mocks.atualizarPerfil
    }
}));

vi.mock("../../static/js/perfil/localizacao.js", () => ({
    preencherLocalizacao: mocks.preencherLocalizacao
}));

vi.mock("../../static/js/perfil/telefone.js", () => ({
    obterDigitosTelefone: mocks.obterDigitosTelefone,
    formatarTelefone: mocks.formatarTelefone,
    telefoneValido: mocks.telefoneValido,
    configurarCampoTelefone: mocks.configurarCampoTelefone
}));

vi.mock("../../static/js/perfil/validacao-localizacao.js", () => ({
    localizacaoValida: mocks.localizacaoValida,
    avisarLocalizacaoInvalida: mocks.avisarLocalizacaoInvalida
}));

vi.mock("../../static/js/perfil/senha.js", () => ({
    MASCARA_SENHA: "••••••••",
    obterCampoConfirmacao: mocks.obterCampoConfirmacao,
    configurarVisibilidadeEdicaoSenha:
        mocks.configurarVisibilidadeEdicaoSenha
}));

vi.mock("../../static/js/perfil/upload-foto.js", () => ({
    configurarFotoComFallback: mocks.configurarFotoComFallback,
    configurarUploadFoto: mocks.configurarUploadFoto
}));

let controller;

function criarHTML() {
    document.body.innerHTML = `
        <span class="user-name"></span>
        <span class="user-role"></span>

        <img id="profile-img">
        <div id="profile-upload-zone"></div>
        <input id="file-input" type="file">

        <input class="form-control" id="profile-name">
        <input class="form-control" id="profile-email">
        <input class="form-control" id="profile-phone">

        <select class="form-control" id="profile-state">
            <option value="SP">São Paulo</option>
        </select>

        <select class="form-control" id="profile-city">
            <option value="Campinas">Campinas</option>
        </select>

        <input class="form-control" id="profile-password">
        <input id="profile-confirm-password">

        <form id="user-form"></form>

        <div id="userMiniName"></div>
        <div id="userMiniRole"></div>
        <div id="perfil-avaliacao"></div>
    `;
}

describe("Controller do Perfil", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        criarHTML();

        mocks.obterCampoConfirmacao.mockReturnValue(
            document.getElementById("profile-confirm-password")
        );

        mocks.localizacaoValida.mockReturnValue(true);
        mocks.telefoneValido.mockReturnValue(true);

        mocks.formatarTelefone.mockImplementation(
            value => value
        );

        mocks.obterDigitosTelefone.mockImplementation(
            value => value.replace(/\D/g, "")
        );

        vi.stubGlobal("exibirNotificacao", vi.fn());

        vi.spyOn(console, "error").mockImplementation(() => {});

        controller = await import(
            "../../static/js/perfil/perfil-controller.js"
        );
    });

    it("carrega os dados principais do perfil", async () => {
        mocks.obterPerfil.mockResolvedValue({
            id: 1,
            nome: "Maria",
            email: "maria@email.com",
            telefone: "11987654321",
            tipo: "produtor",
            estado: "SP",
            cidade: "Campinas"
        });

        await controller.carregarDadosIniciais();

        expect(document.querySelector(".user-name").textContent)
            .toBe("Maria");

        expect(document.querySelector(".user-role").textContent)
            .toBe("Produtor");

        expect(document.getElementById("userMiniName").textContent)
            .toBe("Maria");

        expect(document.getElementById("userMiniRole").textContent)
            .toBe("Produtor");

        expect(mocks.preencherLocalizacao).toHaveBeenCalledWith(
            "SP",
            "Campinas"
        );

        expect(mocks.configurarVisibilidadeEdicaoSenha)
            .toHaveBeenCalledWith(false);
    });

    it("usa valores padrão quando dados opcionais estão ausentes", async () => {
        mocks.obterPerfil.mockResolvedValue({
            tipo: null
        });

        await controller.carregarDadosIniciais();

        expect(document.querySelector(".user-name").textContent)
            .toBe("");

        expect(document.querySelector(".user-role").textContent)
            .toBe("");

        expect(document.getElementById("userMiniName").textContent)
            .toBe("Usuário");

        expect(document.getElementById("userMiniRole").textContent)
            .toBe("Membro");
    });

    it("trata falha ao carregar o perfil", async () => {
        mocks.obterPerfil.mockRejectedValue(
            new Error("Falha na API")
        );

        await expect(
            controller.carregarDadosIniciais()
        ).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(
            "Falha ao inicializar perfil:",
            expect.any(Error)
        );
    });

    it("salva os dados gerais e atualiza o nome exibido", async () => {
        mocks.atualizarPerfil.mockResolvedValue({});

        document.getElementById("profile-name").value = "Maria Silva";
        document.getElementById("profile-email").value = "maria@email.com";
        document.getElementById("profile-phone").value = "(11) 98765-4321";
        document.getElementById("profile-state").value = "SP";
        document.getElementById("profile-city").value = "Campinas";
        document.getElementById("profile-password").value = "••••••••";

        await controller.salvarDadosGerais();

        expect(mocks.atualizarPerfil).toHaveBeenCalledTimes(1);

        const formData = mocks.atualizarPerfil.mock.calls[0][0];

        expect(formData.get("nome")).toBe("Maria Silva");
        expect(formData.get("email")).toBe("maria@email.com");
        expect(formData.get("telefone")).toBe("11987654321");
        expect(formData.get("cidade")).toBe("Campinas");
        expect(formData.get("estado")).toBe("SP");
        expect(formData.has("senha")).toBe(false);

        expect(document.querySelector(".user-name").textContent)
            .toBe("Maria Silva");

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "edicao",
            "Alterações salvas com sucesso!"
        );
    });

    it("não salva quando a localização é inválida", async () => {
        mocks.localizacaoValida.mockReturnValue(false);

        await controller.salvarDadosGerais();

        expect(mocks.avisarLocalizacaoInvalida)
            .toHaveBeenCalled();

        expect(mocks.atualizarPerfil)
            .not.toHaveBeenCalled();
    });

    it("inclui senha e foto quando fornecidas", async () => {
        mocks.atualizarPerfil.mockResolvedValue({});

        document.getElementById("profile-name").value = "Maria";
        document.getElementById("profile-email").value = "maria@email.com";
        document.getElementById("profile-phone").value = "11987654321";
        document.getElementById("profile-state").value = "SP";
        document.getElementById("profile-city").value = "Campinas";
        document.getElementById("profile-password").value = "novaSenha123";

        const foto = new File(["imagem"], "foto.png", {
            type: "image/png"
        });

        await controller.salvarDadosGerais({ foto });

        expect(mocks.atualizarPerfil).toHaveBeenCalledTimes(1);

        const formData = mocks.atualizarPerfil.mock.calls[0][0];

        expect(formData.get("senha")).toBe("novaSenha123");
        expect(formData.get("foto")).toBeInstanceOf(File);
        expect(formData.get("foto").name).toBe("foto.png");
    });

    it("mostra notificação quando a API falha ao salvar", async () => {
        mocks.atualizarPerfil.mockRejectedValue(
            new Error("Falha ao salvar")
        );

        await controller.salvarDadosGerais();

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Falha ao salvar"
        );
    });

    it("configura o campo de telefone e o upload", () => {
        controller.configurarEdicaoESalvamento();

        expect(mocks.configurarCampoTelefone)
            .toHaveBeenCalled();

        expect(mocks.configurarUploadFoto).toHaveBeenCalledWith(
            expect.any(Function)
        );
    });
});
