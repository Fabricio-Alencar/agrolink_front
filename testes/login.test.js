
import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    afterEach,
    vi
} from "vitest";

describe("Login do Agrolink", () => {
    let loginForm;
    let btnProdutor;
    let btnEstabelecimento;
    let toastFire;
    let authSave;

    beforeAll(async () => {
        // Cria o HTML antes de carregar a lógica do login.
        document.body.innerHTML = `
            <button id="btn-produtor" class="active">
                Produtor
            </button>

            <button id="btn-estabelecimento">
                Estabelecimento
            </button>

            <form id="login-form">
                <input id="email" type="email">
                <input id="password" type="password">
                <button type="submit">Entrar</button>
            </form>
        `;

        // Disponibiliza a configuração global.
        globalThis.CONFIG = {
            API_URL: "http://localhost:5000"
        };

        window.CONFIG = globalThis.CONFIG;

        // Simula o Toast do SweetAlert.
        toastFire = vi.fn().mockResolvedValue({});

        window.Swal = {
            mixin: vi.fn(() => ({
                fire: toastFire
            }))
        };

        // Simula o serviço de autenticação.
        authSave = vi.fn();

        window.Auth = {
            save: authSave
        };

        // Importa o script somente depois de preparar o ambiente.
        await import("../static/js/login/lógica.js");

        // Recupera os elementos do DOM.
        loginForm = document.getElementById("login-form");
        btnProdutor = document.getElementById("btn-produtor");

        btnEstabelecimento = document.getElementById(
            "btn-estabelecimento"
        );
    });

    beforeEach(() => {
        vi.clearAllMocks();

        document.getElementById("email").value =
            "teste@email.com";

        document.getElementById("password").value =
            "senha123";

        // Restaura o perfil inicial.
        btnProdutor.click();

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    user: {
                        id: 1,
                        nome: "Maria",
                        tipo: "produtor"
                    }
                })
            })
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    async function enviarFormulario() {
        loginForm.dispatchEvent(
            new Event("submit", {
                bubbles: true,
                cancelable: true
            })
        );

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });
    }

    it("deve iniciar com o perfil produtor ativo", () => {
        expect(
            btnProdutor.classList.contains("active")
        ).toBe(true);

        expect(
            btnEstabelecimento.classList.contains("active")
        ).toBe(false);
    });

    it("deve alternar para estabelecimento", () => {
        btnEstabelecimento.click();

        expect(
            btnEstabelecimento.classList.contains("active")
        ).toBe(true);

        expect(
            btnProdutor.classList.contains("active")
        ).toBe(false);
    });

    it("deve voltar para o perfil produtor", () => {
        btnEstabelecimento.click();
        btnProdutor.click();

        expect(
            btnProdutor.classList.contains("active")
        ).toBe(true);

        expect(
            btnEstabelecimento.classList.contains("active")
        ).toBe(false);
    });

    it("deve enviar os dados corretos para a API", async () => {
        await enviarFormulario();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/login",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: "teste@email.com",
                    senha: "senha123",
                    tipo: "produtor"
                })
            })
        );
    });

    it("deve salvar o usuário após login válido", async () => {
        await enviarFormulario();

        await vi.waitFor(() => {
            expect(authSave).toHaveBeenCalledWith({
                id: 1,
                nome: "Maria",
                tipo: "produtor"
            });
        });
    });

    it("deve mostrar mensagem de sucesso", async () => {
        await enviarFormulario();

        await vi.waitFor(() => {
            expect(toastFire).toHaveBeenCalledWith({
                icon: "success",
                title: "Login realizado com sucesso!"
            });
        });
    });

    it("deve enviar o perfil estabelecimento", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    user: {
                        id: 2,
                        nome: "Mercado Central",
                        tipo: "estabelecimento"
                    }
                })
            })
        );

        btnEstabelecimento.click();

        await enviarFormulario();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/login",
            expect.objectContaining({
                body: JSON.stringify({
                    email: "teste@email.com",
                    senha: "senha123",
                    tipo: "estabelecimento"
                })
            })
        );

        expect(authSave).toHaveBeenCalledWith({
            id: 2,
            nome: "Mercado Central",
            tipo: "estabelecimento"
        });
    });

    it("deve mostrar erro quando a API rejeitar o login", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({
                    erro: "Email ou senha incorretos"
                })
            })
        );

        await enviarFormulario();

        await vi.waitFor(() => {
            expect(toastFire).toHaveBeenCalledWith({
                icon: "error",
                title: "Email ou senha incorretos"
            });
        });

        expect(authSave).not.toHaveBeenCalled();
    });

    it("deve usar a mensagem padrão quando a API não informar o erro", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({})
            })
        );

        await enviarFormulario();

        await vi.waitFor(() => {
            expect(toastFire).toHaveBeenCalledWith({
                icon: "error",
                title: "Erro no login"
            });
        });

        expect(authSave).not.toHaveBeenCalled();
    });

    it("deve mostrar erro quando a resposta não tiver usuário", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({})
            })
        );

        await enviarFormulario();

        await vi.waitFor(() => {
            expect(toastFire).toHaveBeenCalledWith({
                icon: "error",
                title: "Dados do usuário não foram recebidos."
            });
        });

        expect(authSave).not.toHaveBeenCalled();
    });

    it("deve tratar falhas de comunicação", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(
                new Error("Falha de conexão")
            )
        );

        await enviarFormulario();

        await vi.waitFor(() => {
            expect(toastFire).toHaveBeenCalledWith({
                icon: "error",
                title: "Falha de conexão"
            });
        });

        expect(authSave).not.toHaveBeenCalled();
    });

    it("deve funcionar sem Auth disponível", async () => {
        delete window.Auth;

        await enviarFormulario();

        await vi.waitFor(() => {
            expect(toastFire).toHaveBeenCalledWith({
                icon: "success",
                title: "Login realizado com sucesso!"
            });
        });

        window.Auth = {
            save: authSave
        };
    });
});
