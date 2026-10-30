
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

describe("Elementos DOM do perfil", () => {
    beforeEach(() => {
        vi.resetModules();

        document.body.innerHTML = `
            <h1 class="user-name">Maria</h1>
            <span class="user-role">Produtor</span>

            <img id="profile-img">
            <div id="profile-upload-zone"></div>
            <input id="file-input" type="file">

            <input class="form-control" id="nome">
            <input class="form-control" id="email">

            <button class="edit-icon"></button>

            <select id="profile-city"></select>
            <select id="profile-state"></select>

            <button id="btn-delete-account"></button>

            <div id="delete-modal"></div>
            <button id="btn-cancel-delete"></button>
            <button id="btn-confirm-delete"></button>
        `;
    });

    it("deve selecionar os elementos principais do perfil", async () => {
        const { DOM } = await import("../../static/js/perfil/dom.js");

        expect(DOM.userName.textContent).toBe("Maria");
        expect(DOM.userRole.textContent).toBe("Produtor");

        expect(DOM.profileImg.id).toBe("profile-img");
        expect(DOM.uploadZone.id).toBe("profile-upload-zone");
        expect(DOM.fileInput.id).toBe("file-input");
    });

    it("deve selecionar os campos de edição", async () => {
        const { DOM } = await import("../../static/js/perfil/dom.js");

        expect(DOM.inputs).toHaveLength(2);
        expect(DOM.editIcons).toHaveLength(1);
    });

    it("deve selecionar os elementos de localização", async () => {
        const { DOM } = await import("../../static/js/perfil/dom.js");

        expect(DOM.city.id).toBe("profile-city");
        expect(DOM.state.id).toBe("profile-state");
    });

    it("deve selecionar os elementos de exclusão da conta", async () => {
        const { DOM } = await import("../../static/js/perfil/dom.js");

        expect(DOM.btnDeleteAcc.id).toBe("btn-delete-account");
        expect(DOM.modalDelete.id).toBe("delete-modal");
        expect(DOM.btnCancelDelete.id).toBe("btn-cancel-delete");
        expect(DOM.btnConfirmDelete.id).toBe("btn-confirm-delete");
    });

    it("deve retornar referências nulas quando elementos não existem", async () => {
        document.body.innerHTML = "";

        vi.resetModules();

        const { DOM } = await import("../../static/js/perfil/dom.js");

        expect(DOM.userName).toBeNull();
        expect(DOM.profileImg).toBeNull();
        expect(DOM.city).toBeNull();
        expect(DOM.state).toBeNull();
        expect(DOM.btnDeleteAcc).toBeNull();
    });
});
