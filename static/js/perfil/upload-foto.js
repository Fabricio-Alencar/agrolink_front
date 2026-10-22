import { DOM } from './dom.js';

export function configurarFotoComFallback(img, url) {
    if (!img) return;

    img.onerror = () => {
        img.onerror = null;
        img.src = "../static/assets/user.png";
    };

    img.src = url;
}

export function configurarUploadFoto(onFotoSelecionada) {
    if (!DOM.uploadZone || !DOM.fileInput) return;

    DOM.uploadZone.addEventListener("click", () => {
        DOM.fileInput.click();
    });

    DOM.fileInput.addEventListener("change", async event => {
        if (event.target.files.length > 0) {
            const arquivo = event.target.files[0];
            const reader = new FileReader();

            reader.onload = async loadEvent => {
                if (DOM.profileImg) {
                    DOM.profileImg.src = loadEvent.target.result;
                }

                const fotoDrawer = document.querySelector(".usuario-foto");
                if (fotoDrawer) {
                    fotoDrawer.src = loadEvent.target.result;
                }

                if (typeof onFotoSelecionada === "function") {
                    await onFotoSelecionada(arquivo);
                }
            };

            reader.readAsDataURL(arquivo);
        }
    });
}