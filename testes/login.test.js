
import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    vi
} from "vitest";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Login do Agrolink", () => {
    let loginForm;
    let btnProdutor;
    let btnEstabelecimento;
    let toastFire;
    let authSave;

    beforeAll(() => {
        // Simula o HTML necessário para executar o login
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

        // Simula a configuração da API
        window.CONFIG = {
            API_URL: "http://localhost:5000"
        };

        // Simula as notificações do SweetAlert
        toastFire = vi.fn().mockResolvedValue({});

        window.Swal = {
            mixin: vi.fn(() => ({
                fire: toastFire
            }))
        };

        // Simula o armazenamento do usuário
        authSave = vi.fn();

        window.Auth = {
            save: authSave
        };

        // Carrega o login.js original, sem modificá-lo
        const caminho = resolve(
            process.cwd(),
            "static/js/login/lógica.js"
        );

        const codigo = readFileSync(caminho, "utf8");
        window.eval(codigo);

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

    it("deve salvar o usuário quando o login funcionar", async () => {
        await enviarFormulario();

        await vi.waitFor(() => {
            expect(authSave).toHaveBeenCalledWith({
                id: 1,
                nome: "Maria",
                tipo: "produtor"
            });
        });
    });

    it("deve mostrar sucesso após um login válido", async () => {
        await enviarFormulario();

        await vi.waitFor(() => {
            expect(toastFire).toHaveBeenCalledWith({
                icon: "success",
                title: "Login realizado com sucesso!"
            });
        });
    });

    it("deve enviar o perfil estabelecimento quando selecionado", async () => {
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

        expect(authSave).toHaveBeenCalledWith(
            expect.objectContaining({
                tipo: "estabelecimento"
            })
        );
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
});
