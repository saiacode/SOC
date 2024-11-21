const profileLoader = require('./profileLoader');
const { handleLLMQuery } = require('./llmHandler');
const { searchInSheet } = require('./googleSheets');

export const opciones = `
¡Hola! Bienvenido al chatbot de SOC. Estas son las opciones disponibles:

1. Buscar perfil: Escribe "!buscar" seguido del nombre o habilidad que buscas.
   Ejemplo: !buscar javascript

2. Refinar búsqueda: Escribe "!refinar" seguido de criterios adicionales.
   Ejemplo: !refinar experiencia:senior

3. Ver resultados actuales: Escribe "!resultados" para ver los perfiles de la última búsqueda.

4. Ver query actual: Escribe "!query" para ver los criterios de búsqueda actuales.

5. Blanquear búsqueda: Escribe "!blanquear" para reiniciar la búsqueda.

6. Ver estadísticas: Escribe "!estadisticas" para ver información general.

7. Ayuda: Escribe "!ayuda" para ver este mensaje de nuevo.

¿En qué puedo ayudarte hoy?
`;

let conversationContext = [];

async function handleCommand(message) {
    const command = message.body.toLowerCase().split(' ')[0];

    switch (command) {
        case '!ayuda':
            return message.reply('Comandos disponibles: !ayuda, !buscar [término]');
        case '!buscar':
            // Implementa la lógica de búsqueda aquí
            break;
        default:
            // Si no es un comando, procesamos el mensaje como una consulta general
            return handleLLMQuery(message, message.body);
    }
}

async function handleSearchCommand(message) {
    const query = message.body.slice(8).trim(); // Asumiendo que el comando es "!buscar "
    
    if (!query) {
        return "Por favor, proporciona un término de búsqueda.";
    }
    
    try {
        await message.reply(`Buscando "${query}" en la base de datos...`);
        
        const results = await searchInSheet(query);
        
        if (results.length === 0) {
            return "No se encontraron resultados para tu búsqueda.";
        }
        
        let response = `Se encontraron ${results.length} resultados:\n\n`;
        results.forEach((row, index) => {
            response += `Resultado ${index + 1}:\n`;
            row.forEach((cell, cellIndex) => {
                response += `${cellIndex === 0 ? '- ' : '  '}${cell}\n`;
            });
            response += '\n';
        });
        
        return response;
    } catch (error) {
        console.error('Error al manejar el comando de búsqueda:', error);
        return "Ocurrió un error durante la búsqueda. Por favor, intenta de nuevo más tarde.";
    }
}

async function mostrarResultados(message, perfiles, titulo) {
    if (perfiles.length === 0) {
        await message.reply(`No se encontraron perfiles para: ${titulo}`);
    } else if (perfiles.length === 1) {
        const perfil = perfiles[0];
        const respuesta = `
${titulo}:
Nombre: ${perfil.nombre}
Habilidades: ${perfil.habilidades}
Experiencia: ${perfil.experiencia}
Contacto: ${perfil.contacto}
        `;
        await message.reply(respuesta);
    } else {
        const respuesta = `
${titulo}:
Se encontraron ${perfiles.length} perfiles:

${perfiles.map((perfil, index) => `${index + 1}. ${perfil.nombre} - ${perfil.habilidades.split(',')[0]}...`).join('\n')}

Para ver detalles de un perfil específico, usa !buscar seguido del nombre completo.
        `;
        await message.reply(respuesta);
    }
}

module.exports = { handleCommand, handleSearchCommand };
