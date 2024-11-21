const { Client } = require('whatsapp-web.js');
// Removemos esta importación para evitar la dependencia circular
// const { handleLLMQuery } = require('./llmHandler');

let client = null;
let qrCode = null;
let messageHandler = null;

function initializeWhatsAppClient(handleLLMQuery) {
    if (!client) {
        client = new Client({
            // Tus opciones de configuración aquí
        });

        messageHandler = handleLLMQuery;

        client.on('qr', (qr) => {
            qrCode = qr;
            console.log('Nuevo código QR recibido');
        });

        client.on('ready', () => {
            console.log('Cliente de WhatsApp listo');
        });

        client.on('message', async (message) => {
            console.log('Mensaje recibido:', message.body);
            if (messageHandler) {
                try {
                    await messageHandler(message, message.body);
                } catch (error) {
                    console.error('Error al manejar el mensaje:', error);
                    message.reply('Lo siento, ocurrió un error al procesar tu mensaje.');
                }
            } else {
                console.error('No se ha configurado un manejador de mensajes');
            }
        });
        client.initialize();
    }
}

function getWhatsAppClient() {
    return client;
}

function getClientStatus() {
    if (!client) return 'No inicializado';
    if (qrCode) return 'Esperando escaneo de QR';
    return client.info ? 'Conectado' : 'Desconectado';
}

function getQRCode() {
    return qrCode;
}

module.exports = {
    initializeWhatsAppClient,
    getWhatsAppClient,
    getClientStatus,
    getQRCode
};
