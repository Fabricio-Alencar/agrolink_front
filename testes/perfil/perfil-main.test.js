
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

describe("Inicialização do perfil", () => {
    beforeEach(() => {
        vi.resetModules();

        vi.doMock("../../static/js/perfil/perfil-controller.js", () => ({
            carregarDadosIniciais: vi.fn(),
            configurarEdicaoESalvamento: vi.fn()
        }));

        vi.doMock("../../static/js/perfil/localizacao.js", () => ({
            configurarLocalizacao: vi.fn()
        }));

        vi.doMock("../../static/js/perfil/senha.js", () => ({
            inicializarCamposSenha: vi.fn()
        }));

        vi.doMock("../../static/js/perfil/modal-exclusao.js", () => ({
            configurarModalExclusao: vi.fn()
        }));
    });

    it("deve inicializar todos os recursos quando o DOM estiver pronto", async () => {
        const controller = await import(
            "../../static/js/perfil/perfil-controller.js"
        );

        const localizacao = await import(
            "../../static/js/perfil/localizacao.js"
        );

        const senha = await import(
            "../../static/js/perfil/senha.js"
        );

        const modal = await import(
            "../../static/js/perfil/modal-exclusao.js"
        );

        await import("../../static/js/perfil/main.js");

        document.dispatchEvent(
            new Event("DOMContentLoaded")
        );

        expect(
            senha.inicializarCamposSenha
        ).toHaveBeenCalledTimes(1);

        expect(
            controller.carregarDadosIniciais
        ).toHaveBeenCalledTimes(1);

        expect(
            controller.configurarEdicaoESalvamento
        ).toHaveBeenCalledTimes(1);

        expect(
            localizacao.configurarLocalizacao
        ).toHaveBeenCalledTimes(1);

        expect(
            modal.configurarModalExclusao
        ).toHaveBeenCalledTimes(1);
    });
});
