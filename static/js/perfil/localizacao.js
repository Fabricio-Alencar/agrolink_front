import { DOM } from './dom.js';

export async function carregarEstados() {
    if (!DOM.state) return;

    try {
        DOM.state.innerHTML = '<option value="">Selecione o estado</option>';

        const response = await fetch(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
        );

        if (!response.ok) throw new Error("Erro ao carregar estados.");

        const estados = await response.json();

        estados.forEach(estado => {
            const option = document.createElement("option");
            option.value = estado.sigla;
            option.textContent = estado.nome;
            DOM.state.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar estados:", error);
        DOM.state.innerHTML = '<option value="">Erro ao carregar estados</option>';
    }
}

export async function carregarCidades(uf, cidadeSelecionada = "") {
    if (!DOM.city || !uf) return;

    try {
        DOM.city.disabled = false;
        DOM.city.innerHTML = '<option value="">Carregando cidades...</option>';

        const response = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );

        if (!response.ok) throw new Error("Erro ao carregar cidades.");

        const cidades = await response.json();

        DOM.city.innerHTML = '<option value="">Selecione a cidade</option>';

        cidades.forEach(cidade => {
            const option = document.createElement("option");
            option.value = cidade.nome;
            option.textContent = cidade.nome;

            if (cidade.nome === cidadeSelecionada) {
                option.selected = true;
            }

            DOM.city.appendChild(option);
        });

        DOM.city.disabled = false;
    } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        DOM.city.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        DOM.city.disabled = true;
    }
}

export function configurarLocalizacao() {
    if (!DOM.state || !DOM.city) return;

    DOM.state.addEventListener("change", async () => {
        const uf = DOM.state.value;

        DOM.city.innerHTML = '<option value="">Selecione o estado primeiro</option>';
        DOM.city.value = "";
        DOM.city.disabled = true;

        if (!uf) return;

        await carregarCidades(uf);
    });
}

export async function preencherLocalizacao(estado, cidade) {
    if (!DOM.state || !DOM.city) return;

    await carregarEstados();

    if (!estado) {
        DOM.state.value = "";
        DOM.state.disabled = true;
        DOM.city.disabled = true;
        DOM.city.innerHTML = '<option value="">Selecione o estado primeiro</option>';
        return;
    }

    DOM.state.value = estado;
    await carregarCidades(estado, cidade);

    DOM.state.disabled = true;
    DOM.city.disabled = true;
}