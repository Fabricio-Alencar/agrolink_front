const estadoSelect = document.getElementById("filterEstado");
const cidadeSelect = document.getElementById("filterCidade");

// 🔹 Carregar estados
async function carregarEstados() {
    estadoSelect.innerHTML = '<option value="">Todos</option>';

    const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
    const estados = await response.json();

    estados.forEach(estado => {
        const option = document.createElement("option");
        option.value = estado.sigla;
        option.textContent = `${estado.nome} (${estado.sigla})`;
        estadoSelect.appendChild(option);
    });
}

// 🔹 Carregar cidades
estadoSelect.addEventListener("change", async () => {
    const uf = estadoSelect.value;

    if (!uf) {
        cidadeSelect.innerHTML = '<option value="">Todos</option>';
        return;
    }

    cidadeSelect.innerHTML = '<option value="">Carregando...</option>';
    
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    const cidades = await response.json();

    cidadeSelect.innerHTML = '<option value="">Todos</option>';

    cidades.forEach(cidade => {
        const option = document.createElement("option");
        option.value = cidade.nome;
        option.textContent = cidade.nome;
        cidadeSelect.appendChild(option);
    });
});

// Inicializa
carregarEstados();
