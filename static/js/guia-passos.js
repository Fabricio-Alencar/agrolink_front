class GuiaPassosComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  static get observedAttributes() {
    return ['titulo', 'subtitulo', 'passos', 'imagem'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.render();
      this.setupListeners();
    }
  }

render() {

    const titulo = this.getAttribute('titulo') || 'Como usar esta página';
    const subtitulo = this.getAttribute('subtitulo') || 'Veja como manter sua página organizada em poucos passos.';
    
    // Pega o caminho da imagem passado pelo atributo ou usa um padrão
    const imagemSrc = this.getAttribute('imagem') || '../static/assets/login/minhoca_pequena.png';
    
    let passos = [];
    try {
      passos = JSON.parse(this.getAttribute('passos') || '[]');
    } catch (e) {
      passos = [];
    }

    this.shadowRoot.innerHTML =  `
      <link rel="stylesheet" href="../static/css2/geral/guia-passos.css">

      <!-- Botão flutuante da minhoca -->
      <div class="guia-flutuante-container">
        <div class="tooltip-ajuda">Precisa de ajuda?</div>
        <div class="minhoca-trigger" id="abrirModal" title="Precisa de ajuda?">
          <img src="${imagemSrc}" alt="Minhoca Guia">
          <div class="badge-duvida">?</div>
        </div>
      </div>

      <!-- Estrutura do Modal -->
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal-card">
          <div class="modal-header">
            <div class="header-content">
              <div class="header-icon">
                <img src="${imagemSrc}" alt="Ícone Guia" style="width: 45px; height: 45px; object-fit: contain;">
              </div>
              <div class="header-text">
                <span>Guia Rápido</span>
                <h2>${titulo}</h2>
                <p>${subtitulo}</p>
              </div>
            </div>
            <button class="btn-fechar" id="fecharModalX">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M13 1L1 13M1 1L13 13" stroke="#333" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>

          <div class="grid-passos">
            ${passos.map(p => `
              <div class="card-passo">
                <div class="passo-numero">${p.numero}</div>
                <div class="passo-conteudo">
                  <h4>${p.titulo}</h4>
                  <p>${p.descricao}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="modal-footer">
            <div class="footer-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Abra este guia sempre que precisar.
            </div>
            <button class="btn-entendi" id="fecharModalBtn">Entendi</button>
          </div>
        </div>
      </div>
    `;
}



setupListeners() {
  const shadow = this.shadowRoot;
  const abrir = shadow.getElementById('abrirModal');
  const fecharX = shadow.getElementById('fecharModalX');
  const fecharBtn = shadow.getElementById('fecharModalBtn');
  const overlay = shadow.getElementById('modalOverlay');

  const toggleModal = (ativo) => {
    if (ativo) overlay.classList.add('ativo');
    else overlay.classList.remove('ativo');
  };

  abrir.addEventListener('click', () => toggleModal(true));
  fecharX.addEventListener('click', () => toggleModal(false));
  fecharBtn.addEventListener('click', () => toggleModal(false));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) toggleModal(false);
  });
}

}

customElements.define('guia-passos', GuiaPassosComponent);