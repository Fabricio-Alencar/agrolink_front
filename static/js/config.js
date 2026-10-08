const CONFIG = {
    API_URL:
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
            ? "http://127.0.0.1:5500"
            : "https://backagrolinkbr-hfb4cpdvctheeycm.brazilsouth-01.azurewebsites.net"
};