const estadoSelect = document.getElementById("estado");
const cidadeSelect = document.getElementById("cidade");

// 🔹 Carregar estados
async function carregarEstados() {
    estadoSelect.innerHTML = '<option value="">Selecione o estado</option>';

    const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
    const estados = await response.json();

    estados.forEach(estado => {
        const option = document.createElement("option");
        option.value = estado.sigla;
        option.textContent = estado.nome;
        estadoSelect.appendChild(option);
    });
}

// 🔹 Carregar cidades
estadoSelect.addEventListener("change", async () => {
    const uf = estadoSelect.value;

    if (!uf) return;

    cidadeSelect.innerHTML = '<option>Carregando...</option>';

    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    const cidades = await response.json();

    cidadeSelect.innerHTML = '<option value="">Selecione a cidade</option>';

    cidades.forEach(cidade => {
        const option = document.createElement("option");
        option.value = cidade.nome;
        option.textContent = cidade.nome;
        cidadeSelect.appendChild(option);
    });
});


carregarEstados();