
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

let configurarFotoComFallback;
let configurarUploadFoto;

function criarHTML() {
    document.body.innerHTML = `
        <img id="profile-img">
        <img class="usuario-foto">
        <div id="profile-upload-zone"></div>
        <input id="file-input" type="file">
    `;
}

async function carregarModulo() {
    vi.resetModules();

    const modulo = await import(
        "../../static/js/perfil/upload-foto.js"
    );

    configurarFotoComFallback = modulo.configurarFotoComFallback;
    configurarUploadFoto = modulo.configurarUploadFoto;
}

describe("Upload de foto do perfil", () => {
    beforeEach(async () => {
        criarHTML();
        await carregarModulo();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("não configura fallback se a imagem não existir", () => {
        expect(() =>
            configurarFotoComFallback(null, "/foto.png")
        ).not.toThrow();
    });

    it("define a URL da imagem e configura fallback", () => {
        const imagem = document.getElementById("profile-img");

        configurarFotoComFallback(imagem, "/foto.png");

        expect(imagem.getAttribute("src")).toBe("/foto.png");
        expect(typeof imagem.onerror).toBe("function");

        imagem.onerror();

        expect(imagem.getAttribute("src")).toBe(
            "../static/assets/user.png"
        );
        expect(imagem.onerror).toBeNull();
    });

    it("não configura upload quando os elementos não existem", async () => {
        document.body.innerHTML = "";

        await carregarModulo();

        expect(() => configurarUploadFoto(vi.fn())).not.toThrow();
    });

    it("abre o seletor de arquivos ao clicar na zona de upload", () => {
        const input = document.getElementById("file-input");
        const zona = document.getElementById("profile-upload-zone");
        const click = vi.spyOn(input, "click");

        configurarUploadFoto(vi.fn());

        zona.click();

        expect(click).toHaveBeenCalledTimes(1);
    });

    it("não processa mudança sem arquivos", async () => {
        const callback = vi.fn();
        const input = document.getElementById("file-input");

        configurarUploadFoto(callback);

        Object.defineProperty(input, "files", {
            configurable: true,
            value: []
        });

        input.dispatchEvent(new Event("change"));

        await Promise.resolve();

        expect(callback).not.toHaveBeenCalled();
    });

    it("lê a foto, atualiza as imagens e chama o callback", async () => {
        const arquivo = new File(["imagem"], "foto.png", {
            type: "image/png"
        });

        const callback = vi.fn().mockResolvedValue(undefined);

        class FileReaderMock {
            readAsDataURL() {
                this.result = "data:image/png;base64,AAAA";

                this.onload({
                    target: { result: this.result }
                });
            }
        }

        vi.stubGlobal("FileReader", FileReaderMock);

        configurarUploadFoto(callback);

        const input = document.getElementById("file-input");

        Object.defineProperty(input, "files", {
            configurable: true,
            value: [arquivo]
        });

        input.dispatchEvent(new Event("change"));

        await vi.waitFor(() => {
            expect(callback).toHaveBeenCalledWith(arquivo);

            expect(
                document.getElementById("profile-img").src
            ).toContain("data:image/png;base64,AAAA");

            expect(
                document.querySelector(".usuario-foto").src
            ).toContain("data:image/png;base64,AAAA");
        });
    });

    it("funciona sem callback de foto", async () => {
        const arquivo = new File(["imagem"], "foto.png", {
            type: "image/png"
        });

        class FileReaderMock {
            readAsDataURL() {
                this.result = "data:image/png;base64,BBBB";

                this.onload({
                    target: { result: this.result }
                });
            }
        }

        vi.stubGlobal("FileReader", FileReaderMock);

        configurarUploadFoto();

        const input = document.getElementById("file-input");

        Object.defineProperty(input, "files", {
            configurable: true,
            value: [arquivo]
        });

        input.dispatchEvent(new Event("change"));

        await vi.waitFor(() => {
            expect(
                document.getElementById("profile-img").src
            ).toContain("data:image/png;base64,BBBB");
        });
    });
});
