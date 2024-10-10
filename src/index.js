/**
 * SOC - Software de Onboarding y Clasificación
 * @author César Briatore
 * @license MIT
 */

require('dotenv').config();
const { initializeWhatsAppClient } = require('./whatsappClient');
const { handleLLMQuery } = require('./llmHandler');
const { startWebServer } = require('./webServer');
const { initializeGoogleSheets } = require('./googleSheets');

let server;

async function main() {
    console.log('Iniciando aplicación SOC...');
    
    try {
        await initializeGoogleSheets();
        console.log('Google Sheets inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar Google Sheets:', error);
        // Decide si quieres continuar con la ejecución o detener la aplicación aquí
    }

    initializeWhatsAppClient(handleLLMQuery);
    
    startWebServer();
    
    // ... resto de tu código de inicialización ...
}

main().catch(console.error);

process.on('SIGINT', () => {
    console.log('Cerrando el servidor...');
    if (server) {
        server.close(() => {
            console.log('Servidor cerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Manejadores para cerrar el servidor correctamente
process.on('SIGTERM', gracefulShutdown);

function gracefulShutdown() {
    console.log('Cerrando el servidor...');
    if (server) {
        server.close(() => {
            console.log('Servidor cerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

// Manejadores de errores globales
process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa no manejada rechazada:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Excepción no capturada:', error);
});
