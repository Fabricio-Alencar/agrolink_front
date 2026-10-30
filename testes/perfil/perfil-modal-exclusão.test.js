
import {
    describe, it, expect, beforeAll, beforeEach, vi
} from "vitest";

const { excluirConta } = vi.hoisted(() => ({
    excluirConta: vi.fn()
}));

vi.mock("../../static/js/perfil/api.js", () => ({
    API: {
        excluirConta
    }
}));

let configurarModalExclusao;

describe("Modal de exclusão da conta", () => {
    beforeAll(async () => {
        document.body.innerHTML = `
            <button id="btn-delete-account">Excluir</button>
            <div id="delete-modal">
                <button id="btn-cancel-delete">Cancelar</button>
                <button id="btn-confirm-delete">Confirmar</button>
            </div>
        `;

        ({ configurarModalExclusao } =
            await import("../../static/js/perfil/modal-exclusao.js"));
    });

    beforeEach(() => {
        excluirConta.mockReset();

        vi.stubGlobal("agendarNotificacao", vi.fn());
        vi.stubGlobal("exibirNotificacao", vi.fn());

        document.getElementById("delete-modal").classList.remove("active");
    });

    it("abre o modal ao clicar em excluir", () => {
        configurarModalExclusao();

        document.getElementById("btn-delete-account").click();

        expect(
            document.getElementById("delete-modal").classList.contains("active")
        ).toBe(true);
    });

    it("fecha o modal ao cancelar", () => {
        configurarModalExclusao();

        const modal = document.getElementById("delete-modal");
        modal.classList.add("active");

        document.getElementById("btn-cancel-delete").click();

        expect(modal.classList.contains("active")).toBe(false);
    });

    it("chama a API e notifica ao confirmar exclusão", async () => {
        excluirConta.mockResolvedValue({});

        configurarModalExclusao();

        document.getElementById("btn-confirm-delete").click();

        await vi.waitFor(() => {
            expect(excluirConta).toHaveBeenCalled();
        });

        expect(agendarNotificacao).toHaveBeenCalledWith(
            "exclusao",
            "Conta excluída com sucesso!"
        );
    });

    it("exibe erro e fecha o modal quando a exclusão falha", async () => {
        excluirConta.mockRejectedValue(new Error("Não foi possível excluir"));

        configurarModalExclusao();

        const modal = document.getElementById("delete-modal");
        modal.classList.add("active");

        document.getElementById("btn-confirm-delete").click();

        await vi.waitFor(() => {
            expect(exibirNotificacao).toHaveBeenCalledWith(
                "erro",
                "Não foi possível excluir"
            );
        });

        expect(modal.classList.contains("active")).toBe(false);
    });

    it("funciona sem as funções globais de notificação", async () => {
        excluirConta.mockRejectedValue(new Error("Erro"));

        delete globalThis.agendarNotificacao;
        delete globalThis.exibirNotificacao;

        configurarModalExclusao();

        document.getElementById("btn-confirm-delete").click();

        await vi.waitFor(() => {
            expect(excluirConta).toHaveBeenCalled();
        });
    });
});
