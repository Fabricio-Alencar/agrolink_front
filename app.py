from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

# 🔹 Página inicial redireciona para login
@app.route('/')
def index():
    return redirect(url_for('login'))

# 🔹 Página de login
@app.route('/login')
def login():
    return render_template('login.html')

# 🔹 Página de cadastro
@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')
    
# 🔹 Página de Marketplace
@app.route('/marketplace')
def marketplace():
    return render_template('marketplace_estabelecimento.html')

# 🔹 Página de Meus Produtos
@app.route('/meus_produtos')
def meus_produtos():
    return render_template('produtos_produtor.html')

# 🔹 Página de Negociação (Produtor)
@app.route('/negociacoes_produtor')
def negociacao_produtor():
    return render_template('negociacoes_produtor.html')

# 🔹 Página de Negociação (Estabelecimento)
@app.route('/negociacoes_estabelecimento')
def negociacao_estabelecimento():
    return render_template('negociacoes_estabelecimento.html')

# 🔹 Página de Perfil
@app.route('/perfil')
def perfil():
    return render_template('perfil.html')

if __name__ == "__main__":
   print("🚀 Servidor Flask rodando em modo DEBUG...")
   app.run(debug=True, port=8000)