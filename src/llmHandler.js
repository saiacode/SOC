const OpenAI = require("openai");
const { addLog } = require('./logger');
const { searchInSheet } = require('./googleSheets');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// Definición del rol del sistema
const SYSTEM_ROLE_DESCRIPTION = 
"Eres SOC, el asistente virtual de SAIA (Sociedad Argentina de Inteligencia Artificial)especializado en ubicar perfiles de personas en la base de datos propia para ocupar puestos de trabajo en la organización. Tu función es proporcionar información y asistencia relacionada con la idoneidad de los registrados para tareas especificas y generar alternativas para reasignar tareas .";

let llmStats = {
    model: "gpt-3.5-turbo",
    status: "Activo",
    lastQuery: null,
    averageResponseTime: 0,
    totalQueries: 0,
    totalResponseTime: 0
};

async function handleLLMQuery(message, query) {
    const startTime = Date.now();
    const chat = await message.getChat();

    try {
        addLog(`Consulta recibida: "${query}"`);
        await chat.sendStateTyping();

        // Determinar si es necesario buscar en la base de datos
        const searchDecision = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: "Eres un asistente que determina si una consulta requiere buscar en una base de datos. Responde solo con 'SI' o 'NO'."},
                {role: "user", content: `¿La siguiente consulta requiere buscar en una base de datos? Consulta: "${query}"`}
            ],
            max_tokens: 5
        });

        const needsSearch = searchDecision.choices[0].message.content.trim().toUpperCase() === 'SI';
        addLog(`Decisión de búsqueda: ${needsSearch ? 'Sí' : 'No'}`);

        let contextInfo = "";
        if (needsSearch) {
            addLog("Iniciando búsqueda en la base de datos");
            try {
                const searchResults = await searchInSheet(query);
                addLog(`Resultados de la búsqueda: ${JSON.stringify(searchResults)}`);
                if (searchResults.length > 0) {
                    contextInfo = `Resultados de la búsqueda: ${JSON.stringify(searchResults)}`;
                } else {
                    contextInfo = "No se encontraron resultados en la base de datos.";
                }
            } catch (searchError) {
                addLog(`Error en la búsqueda: ${searchError.message}`);
                contextInfo = "Hubo un error al buscar en la base de datos.";
            }
        }

        // Generar respuesta final con OpenAI
        addLog("Generando respuesta final");
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: SYSTEM_ROLE_DESCRIPTION},
                {role: "user", content: query},
                {role: "assistant", content: contextInfo},
                {role: "user", content: "Por favor, responde a la consulta original basándote en la información proporcionada y tu conocimiento general."}
            ],
            max_tokens: 200
        });

        const respuesta = completion.choices[0].message.content.trim();
        addLog(`Respuesta generada: ${respuesta}`);

        await chat.clearState();
        await message.reply(respuesta);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Actualizar estadísticas
        llmStats.lastQuery = new Date().toLocaleString();
        llmStats.totalQueries++;
        llmStats.totalResponseTime += responseTime;

    } catch (error) {
        console.error("Error en handleLLMQuery:", error);
        addLog(`Error al procesar la consulta: ${error.message}`);
        await chat.clearState();
        await message.reply("Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo más tarde.");
    }
}

function getLLMStatus() {
    return {
        ...llmStats,
        averageResponseTime: llmStats.totalQueries > 0 
            ? Math.round(llmStats.totalResponseTime / llmStats.totalQueries) 
            : 0
    };
}

module.exports = { handleLLMQuery, getLLMStatus };
