const { GoogleSpreadsheet } = require('google-spreadsheet');
const { addLog } = require('./logger');
const path = require('path');

// Usar la variable de entorno que ya tenías
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
// Si no tienes una variable para el nombre de la hoja, podemos usar un valor por defecto
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Hoja1';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json'); // Ajusta la ruta según sea necesario

let doc;

async function initializeGoogleSheets() {
    try {
        doc = new GoogleSpreadsheet(SHEET_ID);
        const creds = require(CREDENTIALS_PATH);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        addLog('Google Sheets inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar Google Sheets:', error);
        addLog(`Error al inicializar Google Sheets: ${error.message}`);
        throw error;
    }
}

function checkIfValueIncludesWord(value, keyWords){
    let response = false
    for(const word of keyWords){
        if(value.toString().toLowerCase().includes(word.toLowerCase())){
            response = response || true
        }
        response = response || false
    }
    return response
}

async function searchInSheet(keyWords) {
    if (!doc) {
        await initializeGoogleSheets();
    }

    try {
        const sheet = doc.sheetsByIndex[0]; // Usa la primera hoja por defecto
        await sheet.loadCells();

        const rows = await sheet.getRows();
        const results = rows.filter(row => 
            Object.values(row).some(value => {
                if(value){
                    return checkIfValueIncludesWord(value, keyWords)
                }
                return false
            })
        );

        addLog(`Búsqueda completada. Se encontraron ${results.length} resultados.`);
        return results.map(row => Object.values(row._rawData));
    } catch (error) {
        console.error('Error al buscar en la hoja de cálculo:', error);
        addLog(`Error en la búsqueda: ${error.message}`);
        throw error;
    }
}

function getSheetInfo() {
    if (!doc) return { title: 'No inicializado', sheetId: SHEET_ID };
    const sheet = doc.sheetsByIndex[0];
    return {
        title: sheet.title,
        sheetId: SHEET_ID,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount
    };
}

function getSheetStatus() {
    return doc ? 'Conectado' : 'No inicializado';
}

module.exports = {
    initializeGoogleSheets,
    searchInSheet,
    getSheetInfo,
    getSheetStatus,
};
