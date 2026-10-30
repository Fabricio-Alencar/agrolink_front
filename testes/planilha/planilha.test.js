import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

const mocks = vi.hoisted(() => ({
    abrirModalPlanilha: vi.fn(),
    fecharModalPlanilha: vi.fn(),
    resetarModalPlanilha: vi.fn(),

    inicializarLeitorPlanilha: vi.fn(),
    processarArquivoExcel: vi.fn(),

    inicializarEventosResultados: vi.fn(),
    mudarStatusImportacao: vi.fn(),

    importarProdutos: vi.fn()
}));

vi.mock("../../static/js/produtores/planilha/modal.js", () => ({
    abrirModalPlanilha: mocks.abrirModalPlanilha,
    fecharModalPlanilha: mocks.fecharModalPlanilha,
    resetarModalPlanilha: mocks.resetarModalPlanilha
}));

vi.mock("../../static/js/produtores/planilha/leitor.js", () => ({
    inicializarLeitorPlanilha: mocks.inicializarLeitorPlanilha,
    processarArquivoExcel: mocks.processarArquivoExcel
}));

vi.mock("../../static/js/produtores/planilha/resultados.js", () => ({
    inicializarEventosResultados: mocks.inicializarEventosResultados,
    mudarStatusImportacao: mocks.mudarStatusImportacao
}));

vi.mock("../../static/js/produtores/planilha/importacao.js", () => ({
    importarProdutos: mocks.importarProdutos
}));

describe("Inicialização do sistema de planilhas", () => {

    beforeEach(async () => {
        vi.clearAllMocks();

        document.body.innerHTML = `
            <button id="btnConfirmarPlanilha">
                Importar
            </button>
        `;

        delete window.abrirModalPlanilha;
        delete window.fecharModalPlanilha;
        delete window.resetarModalPlanilha;
        delete window.processarArquivoExcel;
        delete window.mudarStatusImportacao;

        vi.resetModules();

        await import(
            "../../static/js/produtores/planilha/planilha.js"
        );
    });

    it("disponibiliza abrirModalPlanilha no window", () => {
        expect(window.abrirModalPlanilha).toBe(
            mocks.abrirModalPlanilha
        );
    });

    it("disponibiliza fecharModalPlanilha no window", () => {
        expect(window.fecharModalPlanilha).toBe(
            mocks.fecharModalPlanilha
        );
    });

    it("disponibiliza resetarModalPlanilha no window", () => {
        expect(window.resetarModalPlanilha).toBe(
            mocks.resetarModalPlanilha
        );
    });

    it("disponibiliza processarArquivoExcel no window", () => {
        expect(window.processarArquivoExcel).toBe(
            mocks.processarArquivoExcel
        );
    });

    it("disponibiliza mudarStatusImportacao no window", () => {
        expect(window.mudarStatusImportacao).toBe(
            mocks.mudarStatusImportacao
        );
    });

    it("inicializa o leitor de planilhas", () => {
        expect(
            mocks.inicializarLeitorPlanilha
        ).toHaveBeenCalledTimes(1);
    });

    it("inicializa os eventos dos resultados", () => {
        expect(
            mocks.inicializarEventosResultados
        ).toHaveBeenCalledTimes(1);
    });

    it("registra o evento de clique no botão de confirmação", () => {
    const botao = document.getElementById("btnConfirmarPlanilha");

    expect(botao).not.toBeNull();

    botao.click();

    expect(mocks.importarProdutos).toHaveBeenCalledTimes(1);
    });

    it("executa importarProdutos ao clicar no botão", () => {
        const botao = document.getElementById("btnConfirmarPlanilha");

        botao.click();

        expect(mocks.importarProdutos).toHaveBeenCalledTimes(1);
    });

    it("não gera erro quando o botão de confirmação não existe", async () => {
        document.body.innerHTML = "";

        vi.resetModules();

        await expect(
            import("../../static/js/produtores/planilha/planilha.js")
        ).resolves.toBeDefined();

        expect(
            mocks.inicializarLeitorPlanilha
        ).toHaveBeenCalled();
    });

    it("permite chamar abrirModalPlanilha pelo window", () => {
        window.abrirModalPlanilha();

        expect(mocks.abrirModalPlanilha).toHaveBeenCalledTimes(1);
    });

    it("permite chamar fecharModalPlanilha pelo window", () => {
        window.fecharModalPlanilha();

        expect(mocks.fecharModalPlanilha).toHaveBeenCalledTimes(1);
    });

    it("permite chamar resetarModalPlanilha pelo window", () => {
        window.resetarModalPlanilha();

        expect(mocks.resetarModalPlanilha).toHaveBeenCalledTimes(1);
    });

    it("permite chamar mudarStatusImportacao pelo window", () => {
        window.mudarStatusImportacao(1, "rascunho");

        expect(mocks.mudarStatusImportacao).toHaveBeenCalledWith(
            1,
            "rascunho"
        );
    });

    it("permite chamar processarArquivoExcel pelo window", () => {
        const arquivo = new File(["teste"], "produtos.xlsx");

        window.processarArquivoExcel(arquivo);

        expect(mocks.processarArquivoExcel).toHaveBeenCalledWith(
            arquivo
        );
    });
});