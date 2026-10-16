// Rodando o front no próprio computador (localhost), usa o backend local.
// No Azure, continua usando o backend publicado.
const RODANDO_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const CONFIG = {
    API_URL: RODANDO_LOCAL
        ? "http://127.0.0.1:5500"
        : "https://backagrolinkbr-hfb4cpdvctheeycm.brazilsouth-01.azurewebsites.net"
};
