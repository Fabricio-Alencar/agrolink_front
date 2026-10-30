import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

vi.mock("../../static/js/produtores/planilha/validacao.js", () => ({
    validarDadosDaPlanilha: vi.fn()
}));

import {
    validarDadosDaPlanilha
} from "../../static/js/produtores/planilha/validacao.js";

import {
    inicializarLeitorPlanilha,
    processarArquivoExcel
} from "../../static/js/produtores/planilha/leitor.js";

describe("Leitor de planilhas", () => {

    let notificacao;
    let leitorCriado;
    let FileReaderOriginal;
    let XLSXOriginal;

    class FileReaderFake {
        constructor() {
            leitorCriado = this;
            this.result = null;
            this.onload = null;
            this.onerror = null;
        }

        readAsBinaryString(arquivo) {
            this.arquivo = arquivo;
        }

        concluirLeitura(resultado = "dados-binarios") {
            this.result = resultado;

            this.onload?.({
                target: {
                    result: resultado
                }
            });
        }

        falharLeitura() {
            this.onerror?.();
        }
    }

    function arquivo(nome = "produtos.xlsx") {
        return new File(
            ["conteudo"],
            nome,
            { type: "application/octet-stream" }
        );
    }

    function configurarXLSX(matriz, nomeAba = "Produtos") {
    globalThis.XLSX = {
        read: vi.fn(() => ({
            SheetNames: [nomeAba],
            Sheets: {
                [nomeAba]: {}
            }
        })),
        utils: {
            sheet_to_json: vi.fn(() => matriz)
        }
    };
}

    beforeEach(() => {
        vi.clearAllMocks();

        document.body.innerHTML = `
            <div id="dropZonePlanilha"></div>
            <input id="inputPlanilha" type="file">
            <span id="nomeArquivo"></span>
        `;

        notificacao = vi.fn();
        globalThis.exibirNotificacao = notificacao;

        FileReaderOriginal = globalThis.FileReader;
        XLSXOriginal = globalThis.XLSX;

        globalThis.FileReader = FileReaderFake;

        leitorCriado = null;
    });

    afterEach(() => {
        if (FileReaderOriginal) {
            globalThis.FileReader = FileReaderOriginal;
        } else {
            delete globalThis.FileReader;
        }

        if (XLSXOriginal) {
            globalThis.XLSX = XLSXOriginal;
        } else {
            delete globalThis.XLSX;
        }

        delete globalThis.exibirNotificacao;
    });

    describe("inicializarLeitorPlanilha", () => {

        it("registra eventos na zona de arrastar arquivos", () => {
            const zona = document.getElementById("dropZonePlanilha");
            const spy = vi.spyOn(zona, "addEventListener");

            inicializarLeitorPlanilha();

            expect(spy).toHaveBeenCalledWith(
                "dragover",
                expect.any(Function)
            );

            expect(spy).toHaveBeenCalledWith(
                "dragleave",
                expect.any(Function)
            );

            expect(spy).toHaveBeenCalledWith(
                "drop",
                expect.any(Function)
            );
        });

        it("registra evento change no seletor de arquivos", () => {
            const input = document.getElementById("inputPlanilha");
            const spy = vi.spyOn(input, "addEventListener");

            inicializarLeitorPlanilha();

            expect(spy).toHaveBeenCalledWith(
                "change",
                expect.any(Function)
            );
        });

        it("adiciona a classe drag-over durante dragover", () => {
            inicializarLeitorPlanilha();

            const zona = document.getElementById("dropZonePlanilha");

            const evento = new Event("dragover", {
                bubbles: true,
                cancelable: true
            });

            zona.dispatchEvent(evento);

            expect(evento.defaultPrevented).toBe(true);
            expect(zona.classList.contains("drag-over")).toBe(true);
        });

        it("remove a classe drag-over durante dragleave", () => {
            inicializarLeitorPlanilha();

            const zona = document.getElementById("dropZonePlanilha");

            zona.classList.add("drag-over");

            zona.dispatchEvent(
                new Event("dragleave")
            );

            expect(zona.classList.contains("drag-over")).toBe(false);
        });

        it("processa arquivo recebido por drag and drop", () => {
            inicializarLeitorPlanilha();

            const zona = document.getElementById("dropZonePlanilha");
            const arquivoTeste = arquivo();

            const evento = new Event("drop", {
                bubbles: true,
                cancelable: true
            });

            Object.defineProperty(evento, "dataTransfer", {
                value: {
                    files: [arquivoTeste]
                }
            });

            zona.dispatchEvent(evento);

            expect(evento.defaultPrevented).toBe(true);
            expect(leitorCriado.arquivo).toBe(arquivoTeste);
            expect(zona.classList.contains("drag-over")).toBe(false);
        });

        it("não processa drop sem arquivos", () => {
            inicializarLeitorPlanilha();

            const zona = document.getElementById("dropZonePlanilha");

            const evento = new Event("drop", {
                bubbles: true,
                cancelable: true
            });

            Object.defineProperty(evento, "dataTransfer", {
                value: {
                    files: []
                }
            });

            zona.dispatchEvent(evento);

            expect(leitorCriado).toBeNull();
        });

        it("processa arquivo selecionado pelo input", () => {
            inicializarLeitorPlanilha();

            const input = document.getElementById("inputPlanilha");
            const arquivoTeste = arquivo();

            Object.defineProperty(input, "files", {
                configurable: true,
                value: [arquivoTeste]
            });

            input.dispatchEvent(new Event("change"));

            expect(leitorCriado.arquivo).toBe(arquivoTeste);
        });

        it("não processa input sem arquivo selecionado", () => {
            inicializarLeitorPlanilha();

            const input = document.getElementById("inputPlanilha");

            Object.defineProperty(input, "files", {
                configurable: true,
                value: []
            });

            input.dispatchEvent(new Event("change"));

            expect(leitorCriado).toBeNull();
        });

        it("não gera erro quando os elementos não existem", () => {
            document.body.innerHTML = "";

            expect(() => inicializarLeitorPlanilha()).not.toThrow();
        });

        it("inicializa quando somente a zona de drop existe", () => {
            document.body.innerHTML = `
                <div id="dropZonePlanilha"></div>
            `;

            expect(() => inicializarLeitorPlanilha()).not.toThrow();
        });

        it("inicializa quando somente o input existe", () => {
            document.body.innerHTML = `
                <input id="inputPlanilha" type="file">
            `;

            expect(() => inicializarLeitorPlanilha()).not.toThrow();
        });
    });

    describe("processarArquivoExcel", () => {

        it("não faz nada quando não recebe arquivo", () => {
            processarArquivoExcel(null);

            expect(leitorCriado).toBeNull();
            expect(notificacao).not.toHaveBeenCalled();
        });

        it("aceita arquivos com extensão xlsx", () => {
            processarArquivoExcel(arquivo("produtos.xlsx"));

            expect(leitorCriado).not.toBeNull();
        });

        it("aceita arquivos com extensão xls", () => {
            processarArquivoExcel(arquivo("produtos.xls"));

            expect(leitorCriado).not.toBeNull();
        });

        it("aceita extensão em letras maiúsculas", () => {
            processarArquivoExcel(arquivo("PRODUTOS.XLSX"));

            expect(leitorCriado).not.toBeNull();
        });

        it("rejeita arquivos com extensão diferente de Excel", () => {
            processarArquivoExcel(arquivo("produtos.csv"));

            expect(notificacao).toHaveBeenCalledWith(
                "exclusao",
                "Erro: Apenas arquivos Excel!"
            );

            expect(leitorCriado).toBeNull();
        });

        it("rejeita arquivos sem extensão Excel", () => {
            processarArquivoExcel(arquivo("produtos.pdf"));

            expect(notificacao).toHaveBeenCalled();
            expect(leitorCriado).toBeNull();
        });

        it("apresenta o nome do arquivo selecionado", () => {
            processarArquivoExcel(arquivo("colheita.xlsx"));

            expect(
                document.getElementById("nomeArquivo").textContent
            ).toBe("colheita.xlsx");
        });

        it("não gera erro quando o elemento nomeArquivo não existe", () => {
            document.body.innerHTML = "";

            expect(() => {
                processarArquivoExcel(arquivo());
            }).not.toThrow();

            expect(leitorCriado).not.toBeNull();
        });

        it("realiza a leitura binária do arquivo", () => {
            const arquivoTeste = arquivo();

            processarArquivoExcel(arquivoTeste);

            expect(leitorCriado.arquivo).toBe(arquivoTeste);
        });

        it("lê a primeira aba da planilha", () => {
            configurarXLSX([
                ["nome", "categoria"],
                ["Maçã", "frutas"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(XLSX.read).toHaveBeenCalledWith(
                "dados-binarios",
                { type: "binary" }
            );

            expect(XLSX.utils.sheet_to_json).toHaveBeenCalledWith(
                {},
                { header: 1 }
            );
        });

        it("localiza o cabeçalho mesmo quando está em outra linha", () => {
            configurarXLSX([
                ["Relatório de produtos"],
                [],
                ["Nome", "Categoria", "Preço"],
                ["Maçã", "Frutas", 5]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(validarDadosDaPlanilha).toHaveBeenCalledWith([
                expect.objectContaining({
                    nome: "Maçã",
                    categoria: "Frutas",
                    preco: 5,
                    _linhaExcelOriginal: 4
                })
            ]);
        });

        it("identifica cabeçalhos sem diferenciar maiúsculas e minúsculas", () => {
            configurarXLSX([
                ["NOME", "CATEGORIA"],
                ["Maçã", "Frutas"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(validarDadosDaPlanilha).toHaveBeenCalledTimes(1);
        });

        it("normaliza cabeçalhos removendo acentos e caracteres especiais", () => {
            configurarXLSX([
                ["Nome", "Categoria", "Descrição Opcional"],
                ["Maçã", "Frutas", "Produto fresco"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(validarDadosDaPlanilha).toHaveBeenCalledWith([
                expect.objectContaining({
                    nome: "Maçã",
                    categoria: "Frutas",
                    descricaoopcional: "Produto fresco"
                })
            ]);
        });

        
        it("ignora cabeçalhos vazios", () => {
    configurarXLSX([
        ["Nome", "", "Categoria", "Preço"],
        ["Maçã", "valor ignorado", "Frutas", 5]
    ]);

    processarArquivoExcel(arquivo());
    leitorCriado.concluirLeitura();

    expect(validarDadosDaPlanilha).toHaveBeenCalledTimes(1);

    const dados = validarDadosDaPlanilha.mock.calls[0][0];

    expect(dados).toHaveLength(1);

    expect(dados[0]).toEqual({
        nome: "Maçã",
        categoria: "Frutas",
        preco: 5,
        _linhaExcelOriginal: 2
    });

    // Verifica se o objeto não possui uma propriedade com nome vazio.
    expect(Object.hasOwn(dados[0], "")).toBe(false);
});

        it("preenche com string vazia quando falta um valor da linha", () => {
            configurarXLSX([
                ["Nome", "Categoria", "Preço"],
                ["Maçã", "Frutas"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            const dados = validarDadosDaPlanilha.mock.calls[0][0];

            expect(dados[0].preco).toBe("");
        });

        it("ignora linhas vazias", () => {
            configurarXLSX([
                ["Nome", "Categoria"],
                ["Maçã", "Frutas"],
                [],
                ["", ""],
                ["Banana", "Frutas"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            const dados = validarDadosDaPlanilha.mock.calls[0][0];

            expect(dados).toHaveLength(2);
            expect(dados[0].nome).toBe("Maçã");
            expect(dados[1].nome).toBe("Banana");
        });

        it("ignora linhas que possuem somente valores vazios", () => {
            configurarXLSX([
                ["Nome", "Categoria"],
                [null, undefined, ""],
                ["Maçã", "Frutas"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            const dados = validarDadosDaPlanilha.mock.calls[0][0];

            expect(dados).toHaveLength(1);
        });

        it("preserva a numeração original das linhas do Excel", () => {
            configurarXLSX([
                ["Nome", "Categoria"],
                ["Maçã", "Frutas"],
                [],
                ["Banana", "Frutas"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            const dados = validarDadosDaPlanilha.mock.calls[0][0];

            expect(dados[0]._linhaExcelOriginal).toBe(2);
            expect(dados[1]._linhaExcelOriginal).toBe(4);
        });

        it("encaminha os dados normalizados para validação", () => {
            configurarXLSX([
                ["Nome", "Categoria"],
                ["Maçã", "Frutas"]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(validarDadosDaPlanilha).toHaveBeenCalledWith([
                {
                    nome: "Maçã",
                    categoria: "Frutas",
                    _linhaExcelOriginal: 2
                }
            ]);
        });

        it("exibe notificação quando a planilha não possui abas", () => {
            globalThis.XLSX = {
                read: vi.fn(() => ({
                    SheetNames: [],
                    Sheets: {}
                })),
                utils: {
                    sheet_to_json: vi.fn()
                }
            };

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(notificacao).toHaveBeenCalledWith(
                "exclusao",
                "A planilha não possui abas para leitura."
            );

            expect(validarDadosDaPlanilha).not.toHaveBeenCalled();
        });

        it("exibe notificação quando não encontra cabeçalhos", () => {
            configurarXLSX([
                ["Produto", "Valor"],
                ["Maçã", 5]
            ]);

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(notificacao).toHaveBeenCalledWith(
                "exclusao",
                "Não foi possível encontrar as colunas de produtos na planilha."
            );

            expect(validarDadosDaPlanilha).not.toHaveBeenCalled();
        });

        it("exibe notificação quando ocorre erro no processamento", () => {
            globalThis.XLSX = {
                read: vi.fn(() => {
                    throw new Error("Arquivo corrompido");
                })
            };

            const erro = vi.spyOn(console, "error")
                .mockImplementation(() => {});

            processarArquivoExcel(arquivo());
            leitorCriado.concluirLeitura();

            expect(erro).toHaveBeenCalled();

            expect(notificacao).toHaveBeenCalledWith(
                "exclusao",
                "Erro crítico ao ler a estrutura do arquivo."
            );

            erro.mockRestore();
        });

        it("exibe notificação quando ocorre erro de leitura do arquivo", () => {
            processarArquivoExcel(arquivo());

            leitorCriado.falharLeitura();

            expect(notificacao).toHaveBeenCalledWith(
                "exclusao",
                "Não foi possível ler o arquivo selecionado."
            );
        });

        it("não valida os dados quando ocorre erro de leitura", () => {
            processarArquivoExcel(arquivo());

            leitorCriado.falharLeitura();

            expect(validarDadosDaPlanilha).not.toHaveBeenCalled();
        });
    });
});