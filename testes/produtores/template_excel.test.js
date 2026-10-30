
import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    vi
} from "vitest";

describe("Download do modelo de planilha", () => {
    let botao;
    let template;

    

    beforeEach(async () => {
    document.body.innerHTML = `
        <button id="btnBaixarTemplate"></button>
    `;

    botao = document.getElementById("btnBaixarTemplate");

    globalThis.exibirNotificacao = vi.fn();

    vi.spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});

    vi.resetModules();

    await import("../../static/js/produtores/template_excel.js");

});

    it("registra o evento de clique no botão", () => {
        expect(typeof botao.onclick).toBe("function");
    });

    it("cria link com o caminho do modelo", () => {
        botao.click();

        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();

        expect(document.querySelector("a")).toBeNull();
    });

    it("define o nome correto do arquivo para download", () => {
        const appendSpy = vi.spyOn(document.body, "appendChild");

        botao.click();

        const link = appendSpy.mock.calls
            .map(([elemento]) => elemento)
            .find(elemento => elemento.tagName === "A");

        expect(link).toBeDefined();
        expect(link.download).toBe("modelo_planilha_produtos.xlsx");
        expect(link.getAttribute("href"))
            .toBe("../../static/assets/modelo_planilha_produtos.xlsx");
    });

    it("remove o link temporário após o clique", () => {
        botao.click();

        expect(document.querySelector("a")).toBeNull();
    });

    it("exibe notificação após iniciar o download", () => {
        botao.click();

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "cadastro",
            "Download do modelo iniciado!"
        );
    });

    it("não falha quando a função de notificação não existe", () => {
        delete globalThis.exibirNotificacao;

        expect(() => botao.click()).not.toThrow();
    });
});
