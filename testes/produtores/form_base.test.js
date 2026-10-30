
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

describe("Formulário base de produtos", () => {
    let formBase;
    let elementos;

    // =====================================================
    // MOCK DO FILEREADER
    // =====================================================

    class FileReaderFake {
        readAsDataURL(file) {
            this.file = file;

            this.onload?.({
                target: {
                    result: "data:image/png;base64,imagem"
                }
            });
        }
    }

    // =====================================================
    // PREPARAR FORMULÁRIO
    // =====================================================

    function preencherFormulario() {
        document.getElementById("nomeProduto").value = "Maçã";
        document.getElementById("precoProduto").value = "5.50";
        document.getElementById("quantidadeProduto").value = "10";
        document.getElementById("unidadeProduto").value = "kg";
        document.getElementById("categoriaProduto").value = "frutas";
        document.getElementById("descricaoProduto").value = "Produto fresco";
    }

    // =====================================================
    // PREPARAR AMBIENTE
    // =====================================================

    async function prepararAmbiente() {
        document.body.innerHTML = `
            <div id="uploadBox"></div>

            <input id="fotoProduto" type="file">
            <input id="nomeProduto">
            <input id="precoProduto">
            <input id="quantidadeProduto">

            <select id="unidadeProduto">
                <option value="kg">Quilograma</option>
                <option value="unidade">Unidade</option>
                <option value="litro">Litro</option>
            </select>

            <select id="categoriaProduto">
                <option value="">Selecione</option>
                <option value="frutas">Frutas</option>
            </select>

            <textarea id="descricaoProduto"></textarea>

            <input id="editandoNomeOriginal">

            <div id="modalProduto" class="active"></div>

            <label id="labelPreco"></label>
            <label id="labelQuantidade"></label>
        `;

        // Mocks utilizados pelo JavaScript de produção
        vi.stubGlobal("exibirNotificacao", vi.fn());
        vi.stubGlobal("executarCriacao", vi.fn());
        vi.stubGlobal("executarEdicao", vi.fn());
        vi.stubGlobal("FileReader", FileReaderFake);

        // Limpa o cache do módulo
        vi.resetModules();

        // Importa pelo Vite para contabilizar a cobertura
        formBase = await import("../../static/js/produtores/form_base.js");

        // Referências das funções disponibilizadas pela configuração do Vitest
        elementos = {
            uploadBox: document.getElementById("uploadBox"),
            inputFile: document.getElementById("fotoProduto"),
            preview: window.uploadElements.preview,
            placeholder: window.uploadElements.placeholder,
            btnRemover: window.uploadElements.btnRemover
        };
    }

    // =====================================================
    // CONFIGURAÇÃO ANTES DE CADA TESTE
    // =====================================================

    beforeEach(async () => {
        vi.clearAllMocks();

        await prepararAmbiente();

        preencherFormulario();

        document.getElementById("editandoNomeOriginal").value = "";

        document.getElementById("modalProduto").classList.add("active");
    });

    // =====================================================
    // VALIDAÇÃO DOS CAMPOS
    // =====================================================

    it("retorna null quando o nome está vazio", async () => {
    document.getElementById("nomeProduto").value = "";

    const resultado =
        await formBase.obterDadosFormulario("publicado");

    expect(resultado).toBeNull();

    expect(exibirNotificacao).toHaveBeenCalledWith(
        "erro",
        "Preencha o nome, preço e quantidade!"
    );
});

    it("retorna null quando o preço está vazio", async () => {
        document.getElementById("precoProduto").value = "";

        const resultado =
            await formBase.obterDadosFormulario("publicado");

        expect(resultado).toBeNull();
        expect(exibirNotificacao).toHaveBeenCalled();
    });

    it("retorna null quando a quantidade está vazia", async () => {
        document.getElementById("quantidadeProduto").value = "";

        const resultado =
            await formBase.obterDadosFormulario("publicado");

        expect(resultado).toBeNull();
        expect(exibirNotificacao).toHaveBeenCalled();
    });

    // =====================================================
    // FORMDATA
    // =====================================================

    it("monta FormData com os campos do produto", async () => {
        const resultado =
            await formBase.obterDadosFormulario("publicado");

        expect(resultado).toBeInstanceOf(FormData);

        expect(resultado.get("nome")).toBe("Maçã");
        expect(resultado.get("preco")).toBe("5.50");
        expect(resultado.get("quantidade")).toBe("10");
        expect(resultado.get("unidade")).toBe("kg");
        expect(resultado.get("categoria")).toBe("frutas");
        expect(resultado.get("descricao")).toBe("Produto fresco");
    });

    it("envia status_produto durante a criação", async () => {
        const resultado =
            await formBase.obterDadosFormulario("rascunho", false);

        expect(resultado.get("status_produto")).toBe("rascunho");
        expect(resultado.has("status")).toBe(false);
    });

    it("envia status durante a edição", async () => {
        const resultado =
            await formBase.obterDadosFormulario("publicado", true);

        expect(resultado.get("status")).toBe("publicado");
        expect(resultado.has("status_produto")).toBe(false);
    });

    it("retorna null quando a quantidade é uma string vazia", async () => {
        document.getElementById("quantidadeProduto").value = "";

        const resultado =
            await formBase.obterDadosFormulario("publicado");

        expect(resultado).toBeNull();
    });

    // =====================================================
    // FOTOS NO FORMDATA
    // =====================================================

    it("inclui foto selecionada no FormData", async () => {
        const arquivo = new File(
            ["imagem"],
            "maca.png",
            { type: "image/png" }
        );

        Object.defineProperty(elementos.inputFile, "files", {
            configurable: true,
            value: [arquivo]
        });

        const resultado =
            await formBase.obterDadosFormulario("publicado");

        expect(resultado.get("foto")).toBe(arquivo);
    });

    it("não adiciona foto quando nenhuma foi selecionada", async () => {
        expect(elementos.inputFile.files.length).toBe(0);

        const resultado =
            await formBase.obterDadosFormulario("publicado");

        expect(resultado).toBeInstanceOf(FormData);
        expect(resultado.has("foto")).toBe(false);
    });

    // =====================================================
    // PROCESSAMENTO DE IMAGEM
    // =====================================================

    it("processa imagem válida e atualiza o preview", () => {
        const arquivo = new File(
            ["imagem"],
            "foto.png",
            { type: "image/png" }
        );

        formBase.processarImagem(arquivo);

        expect(elementos.preview.src).toContain("data:image/png");
        expect(elementos.preview.style.display).toBe("block");
        expect(elementos.placeholder.style.display).toBe("none");
        expect(elementos.btnRemover.style.display).toBe("block");
    });

    it("ignora arquivo que não seja imagem", () => {
        const arquivo = new File(
            ["texto"],
            "arquivo.txt",
            { type: "text/plain" }
        );

        formBase.processarImagem(arquivo);

        expect(elementos.preview.style.display).toBe("none");
        expect(elementos.placeholder.style.display).toBe("");
    });

    it("ignora arquivo inexistente no processamento da imagem", () => {
        formBase.processarImagem(null);

        expect(elementos.preview.style.display).toBe("none");
    });

    // =====================================================
    // EVENTOS DO UPLOAD
    // =====================================================

    it("abre seletor de arquivo ao clicar na área de upload", () => {
        const spy = vi.spyOn(elementos.inputFile, "click");

        elementos.uploadBox.click();

        expect(spy).toHaveBeenCalled();
    });

    it("processa imagem quando o input de arquivo muda", () => {
        const arquivo = new File(
            ["imagem"],
            "foto.png",
            { type: "image/png" }
        );

        Object.defineProperty(elementos.inputFile, "files", {
            configurable: true,
            value: [arquivo]
        });

        elementos.inputFile.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(elementos.preview.src).toContain("data:image/png");
    });

    // =====================================================
    // DRAG & DROP
    // =====================================================

    it.each(["dragenter", "dragover", "dragleave"])(
        "previne comportamento padrão no evento %s",
        (tipo) => {
            const evento = new Event(tipo, {
                bubbles: true,
                cancelable: true
            });

            elementos.uploadBox.dispatchEvent(evento);

            expect(evento.defaultPrevented).toBe(true);
        }
    );

    it("previne comportamento padrão no evento drop", () => {
        const evento = new Event("drop", {
            bubbles: true,
            cancelable: true
        });

        Object.defineProperty(evento, "dataTransfer", {
            value: {
                files: []
            }
        });

        elementos.uploadBox.dispatchEvent(evento);

        expect(evento.defaultPrevented).toBe(true);
    });

    it.each(["dragenter", "dragover"])(
        "adiciona classe drag-over no evento %s",
        (tipo) => {
            elementos.uploadBox.dispatchEvent(
                new Event(tipo, { bubbles: true })
            );

            expect(
                elementos.uploadBox.classList.contains("drag-over")
            ).toBe(true);
        }
    );

    it.each(["dragleave", "drop"])(
        "remove classe drag-over no evento %s",
        (tipo) => {
            elementos.uploadBox.classList.add("drag-over");

            const evento = new Event(tipo, {
                bubbles: true
            });

            if (tipo === "drop") {
                Object.defineProperty(evento, "dataTransfer", {
                    value: {
                        files: []
                    }
                });
            }

            elementos.uploadBox.dispatchEvent(evento);

            expect(
                elementos.uploadBox.classList.contains("drag-over")
            ).toBe(false);
        }
    );

    // =====================================================
    // REMOVER IMAGEM
    // =====================================================

    it("interrompe propagação ao clicar no botão de remover imagem", () => {
        const evento = new Event("click", {
            bubbles: true,
            cancelable: true
        });

        const stopSpy = vi.spyOn(evento, "stopPropagation");

        elementos.btnRemover.dispatchEvent(evento);

        expect(stopSpy).toHaveBeenCalled();

        expect(elementos.inputFile.value).toBe("");
        expect(elementos.preview.style.display).toBe("none");
        expect(elementos.placeholder.style.display).toBe("block");
        expect(elementos.btnRemover.style.display).toBe("none");
    });

    // =====================================================
    // UNIDADE DE MEDIDA
    // =====================================================

    it("atualiza labels quando a unidade muda", () => {
        const unidade = document.getElementById("unidadeProduto");

        unidade.value = "unidade";

        unidade.dispatchEvent(new Event("change"));

        expect(
            document.getElementById("labelPreco").innerHTML
        ).toContain("Unidade");

        expect(
            document.getElementById("labelQuantidade").innerHTML
        ).toContain("Unidade");
    });

    // =====================================================
    // FECHAR MODAL
    // =====================================================

    it("fecha modal e limpa os campos do formulário", () => {
        document.getElementById("editandoNomeOriginal").value = "10";
        document.getElementById("nomeProduto").value = "Maçã";
        document.getElementById("precoProduto").value = "5";
        document.getElementById("quantidadeProduto").value = "20";
        document.getElementById("descricaoProduto").value = "Descrição";

        formBase.fecharModal();

        expect(
            document.getElementById("modalProduto")
                .classList.contains("active")
        ).toBe(false);

        expect(
            document.getElementById("editandoNomeOriginal").value
        ).toBe("");

        expect(
            document.getElementById("nomeProduto").value
        ).toBe("");

        expect(
            document.getElementById("precoProduto").value
        ).toBe("");

        expect(
            document.getElementById("quantidadeProduto").value
        ).toBe("");

        expect(
            document.getElementById("descricaoProduto").value
        ).toBe("");

        expect(elementos.preview.style.display).toBe("none");
        expect(elementos.placeholder.style.display).toBe("block");
        expect(elementos.btnRemover.style.display).toBe("none");
    });

    // =====================================================
    // FINALIZAR AÇÃO
    // =====================================================

    it("finaliza criação quando não existe ID de edição", async () => {
        await formBase.finalizarAcao("publicado");

        expect(executarCriacao).toHaveBeenCalledWith(
            expect.any(FormData)
        );

        expect(executarEdicao).not.toHaveBeenCalled();
    });

    it("finaliza edição quando existe ID de edição", async () => {
        document.getElementById("editandoNomeOriginal").value = "15";

        await formBase.finalizarAcao("rascunho");

        expect(executarEdicao).toHaveBeenCalledWith(
            expect.any(FormData)
        );

        expect(executarCriacao).not.toHaveBeenCalled();
    });

    it("não chama criação nem edição quando a validação falha", async () => {
        document.getElementById("nomeProduto").value = "";

        await formBase.finalizarAcao("publicado");

        expect(executarCriacao).not.toHaveBeenCalled();
        expect(executarEdicao).not.toHaveBeenCalled();
    });
});
