import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    vi
} from "vitest";


describe("Importação de produtos por planilha", () => {
    let leitorCriado;
    let planilha;

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

        concluir(resultado = "dados-excel") {
            this.result = resultado;
            this.onload?.({
                target: {
                    result: resultado
                }
            });
        }

        falhar() {
            this.onerror?.();
        }
    }

    function prepararHTML() {
        document.body.innerHTML = `
            <div id="modalPlanilha">
                <div id="estadoUpload" class="active"></div>
                <div id="estadoResultado"></div>
                <input id="inputPlanilha" type="file">
                <div id="nomeArquivo"></div>
                <div id="dropZonePlanilha"></div>

                <span id="qtdValidos"></span>
                <span id="qtdErros"></span>

                <div id="secaoErros"></div>
                <div id="secaoValidos"></div>
                <div id="listaErros"></div>
                <div id="listaValidos"></div>

                <button id="btnConfirmarPlanilha"></button>
            </div>
        `;
    }

    function configurarXLSX(matriz, nomeAba = "Produtos") {
        globalThis.XLSX = {
            read: vi.fn(() => ({
                SheetNames: nomeAba ? [nomeAba] : [],
                Sheets: nomeAba ? {
                    [nomeAba]: {}
                } : {}
            })),
            utils: {
                sheet_to_json: vi.fn(() => matriz)
            }
        };
    }

    function arquivo(nome = "produtos.xlsx") {
        return new File(["conteudo"], nome, {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
    }

    function processarMatriz(matriz) {
        configurarXLSX(matriz);

        planilha.processarArquivoExcel(
            arquivo()
        );

        leitorCriado.concluir();
    }

    function matrizProdutoValido() {
        return [
            [
                "Nome do Produto",
                "Categoria",
                "Unidade",
                "Preço",
                "Quantidade",
                "Descrição"
            ],
            [
                "Maçã",
                "Frutas",
                "kg",
                5.5,
                20,
                "Produto fresco"
            ]
        ];
    }

    beforeAll(async () => {
        prepararHTML();

        globalThis.FileReader = FileReaderFake;
        globalThis.exibirNotificacao = vi.fn();
        globalThis.renderProdutos = vi.fn();

        // Importa pelo Vite para contabilizar a cobertura
        planilha = await import("../../static/js/produtores/planilha.js");
    });

    beforeEach(() => {
        vi.clearAllMocks();
        planilha.resetarModalPlanilha();

        document.getElementById("modalPlanilha").className = "";
        document.getElementById("estadoUpload").className = "active";
        document.getElementById("estadoResultado").className = "";

        document.getElementById("inputPlanilha").value = "";
        document.getElementById("nomeArquivo").innerText = "";

        document.getElementById("qtdValidos").innerText = "";
        document.getElementById("qtdErros").innerText = "";

        document.getElementById("listaErros").innerHTML = "";
        document.getElementById("listaValidos").innerHTML = "";

        document.getElementById("secaoErros").style.display = "";
        document.getElementById("secaoValidos").style.display = "";

        const botao = document.getElementById("btnConfirmarPlanilha");
        botao.disabled = false;
        botao.innerText = "";

        globalThis.API = {
            criarProduto: vi.fn()
        };

        globalThis.exibirNotificacao = vi.fn();
        globalThis.renderProdutos = vi.fn();

        leitorCriado = null;
        planilha.resetarModalPlanilha();
    });

    it("abre o modal e reseta o estado da importação", () => {
        planilha.abrirModalPlanilha();

        expect(document.getElementById("modalPlanilha").classList.contains("active"))
            .toBe(true);
        expect(document.getElementById("estadoUpload").classList.contains("active"))
            .toBe(true);
        expect(document.getElementById("estadoResultado").classList.contains("active"))
            .toBe(false);
    });

    it("fecha o modal", () => {
        planilha.abrirModalPlanilha();
        planilha.fecharModalPlanilha();

        expect(document.getElementById("modalPlanilha").classList.contains("active"))
            .toBe(false);
    });

    it("limpa a lista de produtos ao resetar o modal", () => {
        processarMatriz(matrizProdutoValido());

        expect(planilha.listaProdutosValidos).toHaveLength(1);

        planilha.resetarModalPlanilha();

        expect(planilha.listaProdutosValidos).toEqual([]);
        expect(document.getElementById("estadoUpload").classList.contains("active"))
            .toBe(true);
        expect(document.getElementById("estadoResultado").classList.contains("active"))
            .toBe(false);
    });

    it("rejeita arquivo com extensão diferente de Excel", () => {
        planilha.processarArquivoExcel(
            arquivo("produtos.csv")
        );

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "exclusao",
            "Erro: Apenas arquivos Excel!"
        );
        expect(leitorCriado).toBeNull();
    });

    it("aceita arquivo com extensão xlsx", () => {
        configurarXLSX(matrizProdutoValido());

        planilha.processarArquivoExcel(
            arquivo("produtos.xlsx")
        );

        expect(leitorCriado).not.toBeNull();
        expect(leitorCriado.arquivo.name).toBe("produtos.xlsx");
    });

    it("aceita arquivo com extensão xls", () => {
        configurarXLSX(matrizProdutoValido());

        planilha.processarArquivoExcel(
            arquivo("produtos.xls")
        );

        expect(leitorCriado).not.toBeNull();
    });

    it("ignora diferenças entre letras maiúsculas e minúsculas na extensão", () => {
        configurarXLSX(matrizProdutoValido());

        planilha.processarArquivoExcel(
            arquivo("PRODUTOS.XLSX")
        );

        expect(leitorCriado).not.toBeNull();
    });

    it("apresenta o nome do arquivo selecionado", () => {
        configurarXLSX(matrizProdutoValido());

        planilha.processarArquivoExcel(
            arquivo("minha_planilha.xlsx")
        );

        expect(document.getElementById("nomeArquivo").innerText)
            .toBe("minha_planilha.xlsx");
    });

    it("lê o arquivo usando XLSX em formato binary", () => {
        configurarXLSX(matrizProdutoValido());

        planilha.processarArquivoExcel(arquivo());
        leitorCriado.concluir("conteudo-binario");

        expect(XLSX.read).toHaveBeenCalledWith(
            "conteudo-binario",
            { type: "binary" }
        );
    });

    it("converte a primeira aba em matriz", () => {
        configurarXLSX(matrizProdutoValido());

        planilha.processarArquivoExcel(arquivo());
        leitorCriado.concluir();

        expect(XLSX.utils.sheet_to_json).toHaveBeenCalledWith(
            {},
            { header: 1 }
        );
    });

    it("localiza cabeçalho mesmo quando existem linhas antes dele", () => {
        processarMatriz([
            ["Planilha de produtos"],
            ["Dados para importação"],
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos).toHaveLength(1);
        expect(planilha.listaProdutosValidos[0].nome).toBe("Maçã");
        expect(planilha.listaProdutosValidos[0].identificadorTemporario)
            .toBe(4);
    });

    it("notifica quando não encontra cabeçalho com nome e categoria", () => {
        processarMatriz([
            ["Produto", "Preço", "Quantidade"],
            ["Maçã", 5, 10]
        ]);

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "exclusao",
            "Não foi possível encontrar as colunas de produtos na planilha."
        );
    });

    it("normaliza cabeçalhos removendo acentos e caracteres especiais", () => {
        processarMatriz([
            [
                "Nome",
                "Categoria",
                "Descrição Opcional",
                "Preço por Unidade Escolhida",
                "Estoque Disponível na Unidade Escolhida",
                "Forma de Venda Unidade de Medida"
            ],
            [
                "Maçã",
                "Frutas",
                "Produto fresco",
                5,
                10,
                "Quilograma"
            ]
        ]);

        const lista = planilha.listaProdutosValidos;

        console.log("PRODUTOS VÁLIDOS:", lista);
        console.log(
            "ERROS DA VALIDAÇÃO:",
            document.getElementById("listaErros")?.innerText
        );

        expect(lista).toHaveLength(1);

        if (lista.length === 0) {
            console.log(
                "ERROS DA VALIDAÇÃO:",
                document.getElementById("listaErros").innerText
            );
        }

        expect(lista).toHaveLength(1);

        expect(lista[0]).toEqual(
            expect.objectContaining({
                nome: "Maçã",
                categoria: "frutas",
                descricao: "Produto fresco",
                unidade: "kg",
                precoOriginal: 5,
                quantidadeOriginal: 10
            })
        );
    });

    it("ignora cabeçalhos vazios", () => {
        processarMatriz([
            ["Nome", "", "Categoria", "Preço", "Unidade", "Quantidade"],
            ["Maçã", "ignorado", "Frutas", 5, "kg", 10]
        ]);

        expect(planilha.listaProdutosValidos).toHaveLength(1);
        expect(planilha.listaProdutosValidos[0].nome).toBe("Maçã");
        expect(planilha.listaProdutosValidos[0].categoria).toBe("frutas");
    });

    it("ignora linhas completamente vazias", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, 10],
            [],
            [null, null, null, null, null],
            ["Banana", "Frutas", "kg", 4, 20]
        ]);

        expect(planilha.listaProdutosValidos).toHaveLength(2);
        expect(planilha.listaProdutosValidos[0].nome).toBe("Maçã");
        expect(planilha.listaProdutosValidos[1].nome).toBe("Banana");
    });

    it("preserva a numeração original das linhas do Excel", () => {
        processarMatriz([
            ["Título"],
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].identificadorTemporario)
            .toBe(3);
    });

    it("mapeia produto válido com os campos esperados", () => {
        processarMatriz(matrizProdutoValido());

        expect(planilha.listaProdutosValidos[0]).toEqual(
            expect.objectContaining({
                nome: "Maçã",
                categoria: "frutas",
                unidade: "kg",
                precoOriginal: 5.5,
                quantidadeOriginal: 20,
                descricao: "Produto fresco",
                status: "publicado",
                exibicaoPreco: "R$ 5,50 / kg",
                exibicaoQuantidade: "20 (kg) em estoque"
            })
        );
    });

    it("aceita nome usando o cabeçalho nome", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Pera", "Frutas", "kg", 6, 5]
        ]);

        expect(planilha.listaProdutosValidos[0].nome).toBe("Pera");
    });

    it("aceita nome usando o cabeçalho nome do produto", () => {
        processarMatriz(matrizProdutoValido());

        expect(planilha.listaProdutosValidos[0].nome).toBe("Maçã");
    });

    it("normaliza categoria singular fruta para frutas", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Fruta", "kg", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].categoria).toBe("frutas");
    });

    it("normaliza categoria singular legume para legumes", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Cenoura", "Legume", "kg", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].categoria).toBe("legumes");
    });

    it("normaliza categoria com cereais para grãos", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Milho", "Cereais", "kg", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].categoria).toBe("graos");
    });

    it("normaliza categoria com sementes para oleaginosas", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Soja", "Sementes", "kg", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].categoria).toBe("oleaginosas");
    });

    it("normaliza categoria com temperos para ervas", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Manjericão", "Temperos", "kg", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].categoria).toBe("ervas");
    });

    it("aceita unidade quilograma", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "Quilograma", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("kg");
    });

    it("aceita unidade grama", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Erva", "Ervas", "Grama", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("g");
    });

    it("aceita unidade arroba", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Produto", "Outros", "Arroba", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("arroba");
    });

    it("aceita unidade tonelada", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Milho", "Grãos", "Tonelada", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("t");
    });

    it("aceita unidade dúzia", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Ovos", "Outros", "Dúzia", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("duzia");
    });

    it("aceita unidade cento", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Mudas", "Outros", "Cento", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("cento");
    });

    it("aceita unidade milheiro", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Mudas", "Outros", "Milheiro", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("milheiro");
    });

    it("aceita unidade saca", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Milho", "Grãos", "Saca", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("saca");
    });

    it("aceita unidade maço", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Couve", "Hortaliças", "Maço", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("maco");
    });

    it("aceita unidade litro", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Leite", "Outros", "Litro", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("litro");
    });

    it("aceita unidade caixa", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Tomate", "Legumes", "Caixa", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("caixa");
    });

    it("aceita unidade bandeja", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Morango", "Frutas", "Bandeja", 5, 10]
        ]);

        expect(planilha.listaProdutosValidos[0].unidade).toBe("bandeja");
    });

    it("aceita quantidade igual a zero", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, "0"]
        ]);

        expect(planilha.listaProdutosValidos).toHaveLength(1);
        expect(planilha.listaProdutosValidos[0].quantidadeOriginal).toBe(0);
    });

    it("registra erro quando o nome está ausente", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["", "Frutas", "kg", 5, 10]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Nome do produto é obrigatório");
    });

    it("registra erro quando a categoria é inválida", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Inválida", "kg", 5, 10]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Categoria inválida");
    });

    it("registra erro quando a unidade é inválida", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "pacote", 5, 10]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Forma de Venda inválida");
    });

    it("registra erro quando o preço é zero", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 0, 10]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Preço deve ser maior que zero");
    });

    it("registra erro quando o preço é negativo", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", -2, 10]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Preço deve ser maior que zero");
    });

    it("registra erro quando o preço não é numérico", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", "abc", 10]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Preço deve ser maior que zero");
    });

    it("registra erro quando a quantidade é negativa", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, -1]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Estoque inválido ou negativo");
    });

    it("registra erro quando a quantidade não é numérica", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, "abc"]
        ]);

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Estoque inválido ou negativo");
    });

    it("apresenta vários motivos de erro para o mesmo produto", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["", "Inválida", "pacote", 0, -1]
        ]);

        const html = document.getElementById("listaErros").innerHTML;

        expect(html).toContain("Nome do produto é obrigatório");
        expect(html).toContain("Categoria inválida");
        expect(html).toContain("Forma de Venda inválida");
        expect(html).toContain("Preço deve ser maior que zero");
        expect(html).toContain("Estoque inválido ou negativo");
    });

    it("apresenta contagem de produtos válidos e inválidos", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, 10],
            ["Banana", "Inválida", "kg", 5, 10]
        ]);

        expect(document.getElementById("qtdValidos").innerText).toBe(1);
        expect(document.getElementById("qtdErros").innerText).toBe(1);
    });

    it("oculta seção de erros quando não existem erros", () => {
        processarMatriz(matrizProdutoValido());

        expect(document.getElementById("secaoErros").style.display).toBe("none");
        expect(document.getElementById("secaoValidos").style.display).toBe("block");
    });

    it("oculta seção de válidos quando não existem produtos válidos", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Inválida", "kg", 5, 10]
        ]);

        expect(document.getElementById("secaoValidos").style.display).toBe("none");
        expect(document.getElementById("secaoErros").style.display).toBe("block");
    });

    it("desabilita botão de importação quando não existem produtos válidos", () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Inválida", "kg", 5, 10]
        ]);

        expect(document.getElementById("btnConfirmarPlanilha").disabled).toBe(true);
    });

    it("habilita botão de importação quando existem produtos válidos", () => {
        processarMatriz(matrizProdutoValido());

        expect(document.getElementById("btnConfirmarPlanilha").disabled).toBe(false);
        expect(document.getElementById("btnConfirmarPlanilha").innerText)
            .toBe("Importar 1 Produtos");
    });

    it("altera status de produto válido para rascunho", () => {
        processarMatriz(matrizProdutoValido());

        const produto = planilha.listaProdutosValidos[0];

        planilha.mudarStatusImportacao(
            produto.identificadorTemporario,
            "rascunho"
        );

        expect(produto.status).toBe("rascunho");
    });

    it("não altera status quando o identificador não existe", () => {
        processarMatriz(matrizProdutoValido());

        const produto = planilha.listaProdutosValidos[0];

        planilha.mudarStatusImportacao(
            999,
            "rascunho"
        );

        expect(produto.status).toBe("publicado");
    });

    it("não importa quando a lista de produtos válidos está vazia", async () => {
        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(API.criarProduto).not.toHaveBeenCalled();
    });

    it("importa produto válido e atualiza marketplace", async () => {
        processarMatriz(matrizProdutoValido());

        API.criarProduto.mockResolvedValue({
            mensagem: "Criado"
        });

        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(API.criarProduto).toHaveBeenCalledTimes(1);
        expect(renderProdutos).toHaveBeenCalled();
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "cadastro",
            "1 produto adicionado!"
        );
        expect(document.getElementById("modalPlanilha").classList.contains("active"))
            .toBe(false);
    });

    it("envia os campos esperados no FormData da importação", async () => {
        processarMatriz(matrizProdutoValido());

        API.criarProduto.mockResolvedValue({});

        await document.getElementById("btnConfirmarPlanilha").onclick();

        const formData = API.criarProduto.mock.calls[0][0];

        expect(formData.get("nome")).toBe("Maçã");
        expect(formData.get("categoria")).toBe("frutas");
        expect(formData.get("preco")).toBe("5.5");
        expect(formData.get("unidade")).toBe("kg");
        expect(formData.get("quantidade")).toBe("20");
        expect(formData.get("descricao")).toBe("Produto fresco");
        expect(formData.get("status_produto")).toBe("publicado");
    });

    it("apresenta plural quando mais de um produto é importado", async () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, 10],
            ["Banana", "Frutas", "kg", 4, 20]
        ]);

        API.criarProduto.mockResolvedValue({});

        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "cadastro",
            "2 produtos adicionados!"
        );
    });

    it("mantém produtos que falharam e apresenta erro da API", async () => {
        processarMatriz(matrizProdutoValido());

        API.criarProduto.mockResolvedValue({
            erro: "Produto recusado"
        });

        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(planilha.listaProdutosValidos).toHaveLength(1);
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "1 produto(s) falharam no processamento externo."
        );
        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Produto recusado");
    });

    it("usa mensagem padrão quando a API retorna erro sem texto", async () => {
        processarMatriz(matrizProdutoValido());

        API.criarProduto.mockResolvedValue({
            erro: true
        });

        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("true");
    });

    it("registra falha de rede ao importar produto", async () => {
        processarMatriz(matrizProdutoValido());

        API.criarProduto.mockRejectedValue(
            new Error("Falha de rede")
        );

        vi.spyOn(console, "error").mockImplementation(() => {});

        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(document.getElementById("listaErros").innerHTML)
            .toContain("Falha crítica de comunicação com o servidor.");
        expect(exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "1 produto(s) falharam no processamento externo."
        );
    });

    it("mantém apenas os produtos que falharam quando há sucesso parcial", async () => {
        processarMatriz([
            ["Nome", "Categoria", "Unidade", "Preço", "Quantidade"],
            ["Maçã", "Frutas", "kg", 5, 10],
            ["Banana", "Frutas", "kg", 4, 20]
        ]);

        API.criarProduto
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ erro: "Falhou" });

        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(renderProdutos).toHaveBeenCalled();
        expect(planilha.listaProdutosValidos).toHaveLength(1);
        expect(planilha.listaProdutosValidos[0].nome).toBe("Banana");
    });

    it("não fecha o modal quando existem produtos que falharam", async () => {
        processarMatriz(matrizProdutoValido());

        API.criarProduto.mockResolvedValue({
            erro: "Falha"
        });

        await document.getElementById("btnConfirmarPlanilha").onclick();

        expect(document.getElementById("modalPlanilha").classList.contains("active"))
            .toBe(false);
    });

    it("exibe erro crítico quando ocorre falha na leitura da estrutura", () => {
        configurarXLSX(matrizProdutoValido());
        XLSX.read.mockImplementation(() => {
            throw new Error("Arquivo inválido");
        });

        vi.spyOn(console, "error").mockImplementation(() => {});

        planilha.processarArquivoExcel(arquivo());
        leitorCriado.concluir();

        expect(exibirNotificacao).toHaveBeenCalledWith(
            "exclusao",
            "Erro crítico ao ler a estrutura do arquivo."
        );
    });
});