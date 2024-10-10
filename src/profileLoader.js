const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');
const creds = require(path.join(process.cwd(), 'credentials.json'));

class ProfileLoader {
    constructor() {
        this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
        this.sheetLoaded = false;
        this.currentSearch = null;
        this.currentQuery = null;
        this.additionalCriteria = {};
    }

    async loadSheet() {
        if (!this.sheetLoaded) {
            await this.doc.useServiceAccountAuth(creds);
            await this.doc.loadInfo();
            this.sheet = this.doc.sheetsByIndex[0];
            this.sheetLoaded = true;
            console.log('Hoja de Google cargada correctamente');
        }
    }

    async searchProfiles(query, additionalCriteria = {}) {
        await this.loadSheet();
        const rows = await this.sheet.getRows();
        
        this.currentQuery = query;
        this.additionalCriteria = { ...this.additionalCriteria, ...additionalCriteria };
        
        const lowercaseQuery = query.toLowerCase();
        
        this.currentSearch = rows.filter(row => {
            const matchesMainQuery = 
                row.nombre.toLowerCase().includes(lowercaseQuery) ||
                row.habilidades.toLowerCase().includes(lowercaseQuery);

            if (!matchesMainQuery) return false;

            // Verificar criterios adicionales
            for (const [key, value] of Object.entries(this.additionalCriteria)) {
                if (row[key] && !row[key].toLowerCase().includes(value.toLowerCase())) {
                    return false;
                }
            }

            return true;
        }).map(row => ({
            nombre: row.nombre,
            habilidades: row.habilidades,
            experiencia: row.experiencia,
            contacto: row.contacto
        }));

        return this.currentSearch;
    }

    getCurrentSearchResults() {
        return this.currentSearch || [];
    }

    getCurrentQuery() {
        return {
            mainQuery: this.currentQuery,
            additionalCriteria: this.additionalCriteria
        };
    }

    clearSearch() {
        this.currentSearch = null;
        this.currentQuery = null;
        this.additionalCriteria = {};
    }

    // ... (otros métodos como getStatistics) ...
}

const profileLoader = new ProfileLoader();

module.exports = {
    profileLoader,
    loadGoogleSheet: () => profileLoader.loadSheet()
};
