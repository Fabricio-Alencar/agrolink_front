import { DOM } from './dom.js';
import { API } from './api.js';

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
                agendarNotificacao("exclusao", "Conta excluída com sucesso!");
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