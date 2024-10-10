const express = require('express');
const { getQRCode } = require('./whatsappClient');
const { getSheetInfo } = require('./googleSheets');

const app = express();
const port = process.env.PORT || 3001;

// Configura Express para servir archivos estáticos
app.use(express.static('public'));

function startWebServer() {
    app.get('/', (req, res) => {
        console.log('Solicitud recibida para la página principal');
        res.send(`
            <html>
                <head>
                    <title>SOC - Sistema de Operación del Chatbot</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                        h1 { color: #333; }
                        pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; }
                        .logo { max-width: 200px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <img src="/images/saia-logo.png" alt="Logo de SAIA" class="logo">
                    <h1>SOC - Sistema de Operación del Chatbot</h1>
                    <h2>Escanea el código QR para conectar WhatsApp</h2>
                    ${getQRCode() ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getQRCode())}">` : 'Esperando código QR...'}
                    <h2>Información de la hoja de cálculo</h2>
                    <pre>${getSheetInfo()}</pre>
                </body>
            </html>
        `);
    });

    app.listen(port, () => {
        console.log(`Servidor web iniciado en http://localhost:${port}`);
    }).on('error', (error) => {
        console.error('Error al iniciar el servidor:', error);
    });
}

module.exports = { startWebServer };
