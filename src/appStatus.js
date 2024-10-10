const { getClientStatus } = require('./whatsappClient');
const { getSheetStatus } = require('./googleSheets');

function getAppStatus() {
    let whatsappStatus, googleSheetsStatus;

    try {
        whatsappStatus = getClientStatus();
    } catch (error) {
        console.error('Error al obtener el estado de WhatsApp:', error);
        whatsappStatus = 'Error';
    }

    try {
        googleSheetsStatus = getSheetStatus();
    } catch (error) {
        console.error('Error al obtener el estado de Google Sheets:', error);
        googleSheetsStatus = 'Error';
    }

    return {
        whatsappStatus: whatsappStatus || 'No disponible',
        googleSheetsStatus: googleSheetsStatus || 'No disponible',
        webServerStatus: 'Activo',
        lastUpdate: new Date().toLocaleString(),
        appVersion: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };
}

module.exports = { getAppStatus };
