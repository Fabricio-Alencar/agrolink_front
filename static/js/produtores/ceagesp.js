document.addEventListener("DOMContentLoaded", function() {
    
    const btnCeagesp = document.getElementById('btnCeagesp');
    const dropdownCeagesp = document.getElementById('dropdownCeagesp');
    const inputNomeProduto = document.getElementById('nomeProduto');
    const inputCategoriaProduto = document.getElementById('categoriaProduto'); 

    // Função ASSÍNCRONA para buscar os dados reais no seu servidor Python
    async function abrirDropdownCeagesp() {
        const nomeDigitado = inputNomeProduto.value.trim().toLowerCase();
        const categoriaSelecionada = inputCategoriaProduto ? inputCategoriaProduto.value : "frutas";
        
        dropdownCeagesp.innerHTML = ''; 

        if (!nomeDigitado) {
            renderizarAviso("Digite um produto primeiro", "Você precisa digitar o nome do produto no campo acima para buscar sugestões.");
            mostrarDropdown();
            return;
        }

        // Mostra estado de carregamento
        dropdownCeagesp.innerHTML = `
            <div class="ceagesp-aviso" style="background-color: #F3F4F6; border-left-color: #6B7280;">
                <strong>Buscando cotações...</strong>
                <p>Conectando via Selenium aos servidores da CEAGESP. Isso pode levar alguns segundos.</p>
            </div>
        `;
        mostrarDropdown();

        try {
            // Se o seu Flask estiver rodando em outra porta (ex: 5000), ajuste aqui embaixo:
            const urlBackend = `https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net//api/cotacoes-ceagesp?produto=${encodeURIComponent(nomeDigitado)}&categoria=${encodeURIComponent(categoriaSelecionada)}`;
            
            // Fazemos uma requisição simples, sem headers customizados para evitar problemas com o CORS global
            const resposta = await fetch(urlBackend, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!resposta.ok) {
                if (resposta.status === 404) {
                    throw new Error("Rota não encontrada no backend. Verifique se o Blueprint registrou '/api/cotacoes-ceagesp'.");
                }
                throw new Error("Erro ao buscar dados do servidor.");
            }

            const dadosProduto = await resposta.json(); 

            if (dadosProduto && dadosProduto.length > 0) {
                renderizarLista(nomeDigitado, dadosProduto);
            } else {
                renderizarAviso("Produto não encontrado na base CEAGESP", "Não encontramos cotações recentes para este produto nesta categoria. Verifique a grafia.");
            }

        } catch (erro) {
            console.error("Erro na busca da CEAGESP:", erro);
            renderizarAviso("Erro de Conexão", "Não foi possível obter os dados. Certifique-se de que o servidor Python está rodando na porta 5000 e a rota existe.");
        }
        
        if (window.lucide) {
            lucide.createIcons(); 
        }
    }

    function renderizarLista(nome, dados) {
        const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1);
        
        let htmlLista = `
            <div class="ceagesp-header">
                <h3>${nomeFormatado}</h3>
                <p>Cotações obtidas via raspagem automatizada</p>
            </div>
            <div class="ceagesp-lista">
        `;

        dados.forEach(item => {
            htmlLista += `
                <div class="ceagesp-item" onclick="selecionarPrecoCeagesp(${item.preco})">
                    <span class="ceagesp-classificacao">${item.classificacao}</span>
                    <span class="ceagesp-preco">R$ ${item.preco.toFixed(2).replace('.', ',')}/kg</span>
                </div>
            `;
        });

        htmlLista += `
            </div>
            <div class="ceagesp-footer">
                <i data-lucide="bar-chart-2" style="width: 14px; height: 14px;"></i> 
                Valores sincronizados via Selenium
            </div>
        `;

        dropdownCeagesp.innerHTML = htmlLista;
    }

    function renderizarAviso(titulo, mensagem) {
        dropdownCeagesp.innerHTML = `
            <div class="ceagesp-aviso">
                <strong>${titulo}</strong>
                <p>${mensagem}</p>
            </div>
        `;
    }

    function mostrarDropdown() {
        dropdownCeagesp.classList.remove('oculto');
    }

    if (btnCeagesp) {
        btnCeagesp.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdownCeagesp.classList.contains('oculto')) {
                abrirDropdownCeagesp();
            } else {
                dropdownCeagesp.classList.add('oculto');
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (btnCeagesp && !btnCeagesp.contains(e.target) && dropdownCeagesp && !dropdownCeagesp.contains(e.target)) {
            dropdownCeagesp.classList.add('oculto');
        }
    });
});

window.selecionarPrecoCeagesp = function(valor) {
    const inputPrecoProduto = document.getElementById('precoProduto');
    const dropdownCeagesp = document.getElementById('dropdownCeagesp');
    if (inputPrecoProduto) inputPrecoProduto.value = valor.toFixed(2);
    if (dropdownCeagesp) dropdownCeagesp.classList.add('oculto');
};
