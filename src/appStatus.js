const { whatsappClientInstance } = require('./whatsapp/whatsappClient');
const { googleSheetsInstance } = require('./googleSheets');

function getAppStatus() {
    // let whatsappStatus, googleSheetsStatus;

    // try {
    //     whatsappStatus = whatsappClientInstance.getClientStatus();
    // } catch (error) {
    //     console.error('Error al obtener el estado de WhatsApp:', error);
    //     whatsappStatus = 'Error';
    // }

    // try {
    //     googleSheetsStatus = googleSheetsInstance.getSheetStatus();
    // } catch (error) {
    //     console.error('Error al obtener el estado de Google Sheets:', error);
    //     googleSheetsStatus = 'Error';
    // }

    return {
        whatsappStatus: whatsappClientInstance.getClientStatus(), // whatsappStatus || 'No disponible',
        googleSheetsStatus: googleSheetsInstance.getSheetStatus(),// googleSheetsStatus || 'No disponible',
        webServerStatus: 'Activo',
        lastUpdate: new Date().toLocaleString(),
        appVersion: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };
}

module.exports = { getAppStatus };
