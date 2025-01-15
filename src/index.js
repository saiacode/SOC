/**
 * SOC - Software de Onboarding y Clasificación
 * @author César Briatore
 * @license MIT
 */

require('dotenv').config();

const { WebServer } = require('./webServer');
const { googleSheetsInstance } = require('./googleSheets');
const { processEvents } = require('./processEvents');


async function main() {
    console.log('Iniciando aplicación SOC...');
    const webServer = new WebServer()    
    webServer.start();
    
    try {
        await googleSheetsInstance.initializeGoogleSheets();
        console.log('Google Sheets inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar Google Sheets:', error);
        // Decide si quieres continuar con la ejecución o detener la aplicación aquí
    }
    
    // initializeWhatsAppClient(handleLLMQuery);
    
    
    // ... resto de tu código de inicialización ...
}

main().catch(console.error);

processEvents()

