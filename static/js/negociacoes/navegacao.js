import { getCacheNegociacoes } from "./renderizacao.js";
import { deleteOrder } from "./filtros_botao_excluir.js";
import { API } from './api.js'; 

/**
 * Exibe os detalhes de uma negociação específica
 * @param {number} id - ID da negociação
 * @param {string} tipoUsuario - 'produtor' ou 'estabelecimento'
 */

const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";


// =========================
// 🔹 FUNÇÃO PADRÃO DE FOTO (IGUAL AO ARQUIVO 2)
// =========================
function resolverCaminhoFoto(order) {
    console.log("🖼️ Foto original:", order.produto_foto);

    if (!order.produto_foto) {
        console.warn("⚠️ Sem foto, usando fallback");
        return `${API_URL}/static/uploads/produtos/foto_generica.png`;
    }

    // Se vier só nome do arquivo
    return `${API_URL}/static/${order.produto_foto}`;
}

export function showDetails(id, tipoUsuario) {
    const data = getCacheNegociacoes() || [];
    const order = data.find(o => o.id === id);
    
    if (!order) {
        console.error("Negociação não encontrada no cache.");
        return;
    }

    const container = document.getElementById('details-content');
    const statusClass = (order.status || "").toLowerCase();
    
    let botoesHTML = '';

   // Lógica para renderização dos botões baseada no estado e tipo de usuário
    if (statusClass === "pendente") {
        if (tipoUsuario === "produtor") {
            botoesHTML = `
                <button class="btn-action btn-finalize" id="btnAceitar">Aceitar Pedido</button>
                <button class="btn-action btn-cancel" id="btnRecusar">Recusar Pedido</button>
            `;
        } else {
            botoesHTML = `
                <p style="text-align: center; color: #888; width: 100%; margin-bottom: 10px;">Aguardando resposta do produtor...</p>
                <button class="btn-action btn-cancel" id="btnCancelar">Cancelar Pedido</button>
            `;
        }
    
    } else if (statusClass === "aceito" || statusClass === "entregue") {
        if (tipoUsuario === "produtor") {
            const desabilitado = order.entrega_confirmada ? 'disabled style="background-color: #ccc; cursor: not-allowed;"' : '';
            const texto = order.entrega_confirmada ? 'Entrega Confirmada' : 'Confirmar Entrega';
            botoesHTML = `<button class="btn-action btn-finalize" id="btnConfirmarAcao" ${desabilitado}>${texto}</button>`;
        } else if (tipoUsuario === "estabelecimento") {
            const desabilitado = order.recebimento_confirmado ? 'disabled style="background-color: #ccc; cursor: not-allowed;"' : '';
            const texto = order.recebimento_confirmado ? 'Recebimento Confirmado' : 'Confirmar Recebimento';
            botoesHTML = `<button class="btn-action btn-finalize" id="btnConfirmarAcao" ${desabilitado}>${texto}</button>`;
        }
    } else {
        botoesHTML = `<p style="text-align: center; font-weight: bold; width: 100%;">Este pedido está ${order.status}.</p>`;
    }

    // =========================
    // 🔹 FOTO (PADRONIZADA)
    // =========================
    const urlImagem = resolverCaminhoFoto(order);

    // Injeção do HTML
    container.innerHTML = `
    <div class="details-header">
        <h2>Detalhes do Pedido</h2>

        <span class="badge ${statusClass}" style="font-size: 14px; padding: 6px 16px;">
            ${order.status}
        </span>
    </div>
    
    <div class="details-grid">

        <div class="col-left">

            <div class="info-group">
                <span class="info-label">
                    <i data-lucide="package"></i>
                    Produto:
                </span>

                <span class="info-value">
                    ${order.produto_nome}
                </span>
            </div>
            
            <div style="display:flex; gap:40px; margin-bottom:24px;">

                <div>
                    <span class="info-label">
                        <i data-lucide="boxes"></i>
                        Quantidade:
                    </span>

                    <span class="info-text">
                        ${order.quantidade}
                    </span>
                </div>

                <div>
                    <span class="info-label">
                        <i data-lucide="badge-dollar-sign"></i>
                        Preço Unitário:
                    </span>

                    <span class="info-text">
                        R$ ${order.produto_preco}
                    </span>
                </div>

            </div>
            
            <div class="info-group">

                <span class="info-label">
                    <i data-lucide="calendar-days"></i>
                    Data de entrega:
                </span>

                <span class="info-text">
                    ${order.data_entrega || 'A combinar'}
                </span>
            </div>
            
            <div class="info-group">

                <span class="info-label">
                    <i data-lucide="file-text"></i>
                    Descrição do Pedido:
                </span>

                <textarea class="desc-box" readonly>
${order.descricao || 'Descrição adicional.'}
                </textarea>

            </div>

        </div>

        <div class="col-right">

            <img 
                src="${urlImagem}" 
                alt="${order.produto_nome}" 
                class="product-img"
                onerror="console.error('❌ Erro ao carregar imagem:', this.src); this.src='${API_URL}/static/uploads/produtos/foto_generica.png';"
            >

            <div class="info-group">

                <span class="info-label">
                    <i data-lucide="handshake"></i>
                    Negociante:
                </span>

                <span class="info-value" style="font-size:18px;">
                    ${order.negociante_nome}
                </span>
            </div>

            <div class="info-group">

                <span class="info-label">
                    <i data-lucide="phone"></i>
                    Telefone:
                </span>

                <span class="info-text">
                    ${order.negociante_telefone}
                </span>
            </div>

            <div class="info-group">

                <span class="info-label">
                    <i data-lucide="mail"></i>
                    Email:
                </span>

                <span class="info-text">
                    ${order.negociante_email}
                </span>
            </div>

        </div>

    </div>

    <div class="action-buttons" style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
        ${botoesHTML}
    </div>
`;

lucide.createIcons();

    document.getElementById('view-lista').style.display = 'none';
    document.getElementById('view-detalhes').style.display = 'block';

    // Atribuição de Eventos
    const btnAceitar = document.getElementById('btnAceitar');
    const btnRecusar = document.getElementById('btnRecusar');
    const btnConfirmarAcao = document.getElementById('btnConfirmarAcao');

    if (btnAceitar) {
        btnAceitar.onclick = async () => {
            await API.atualizarStatus(order.id, 'Aceito');
            alert("Pedido aceito!");
            location.reload();
        };
    }

    if (btnRecusar) {
        btnRecusar.onclick = async () => {
            if(confirm("Deseja realmente recusar este pedido?")) {
                await API.atualizarStatus(order.id, 'Recusado');
                alert("Pedido recusado.");
                location.reload();
            }
        };
    }

    if (btnConfirmarAcao && !btnConfirmarAcao.disabled) {
        btnConfirmarAcao.onclick = async () => {
            const acao = tipoUsuario === 'produtor' ? 'confirmar_entrega' : 'confirmar_recebimento';
            await API.registrarConfirmacao(order.id, acao);
            alert("Confirmação registrada com sucesso!");
            location.reload();
        };
    }

    window.scrollTo(0, 0);
}

/**
Oculta a vista de detalhes e volta para a lista
 */
export function hideDetails() {
    const viewDetalhes = document.getElementById('view-detalhes');
    const viewLista = document.getElementById('view-lista');
    
    if (viewDetalhes && viewLista) {
        viewDetalhes.style.display = 'none';
        viewLista.style.display = 'block';
    }
}

// Expõe para o escopo global caso o HTML use onclick="hideDetails()"
window.hideDetails = hideDetails;
