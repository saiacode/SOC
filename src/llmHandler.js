const OpenAI = require("openai");
const { addLog } = require('./logger');
const { searchInSheet } = require('./googleSheets');
const utils = require('util')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const KEY_CONCEPTS = `'Nombre Completo', 'Apellido Paterno', 'Apellido Materno', 'Correo Electrónico', 'Teléfono', 'Profesión', 'Años de Experiencia', 'Habilidades Clave', 'Fecha de Nacimiento', 'Ciudad', 'País', 'Estado Civil', 'Intereses', 'Disponibilidad'`

// Definición del rol del sistema
const SYSTEM_ROLE_DESCRIPTION = 
"Eres SOC, el asistente virtual de SAIA (Sociedad Argentina de Inteligencia Artificial) especializado en ubicar perfiles de personas en la base de datos propia para ocupar puestos de trabajo en la organización. Tu función es proporcionar información y asistencia relacionada con la idoneidad de los registrados para tareas especificas y generar alternativas para reasignar tareas.";

const SYSTEM_ROLE_SEARCH_DECISION = `Eres un asistente virtual especializado en recursos humanos y gestión de talento. Tu tarea es ayudar a los usuarios a obtener información sobre perfiles de trabajo almacenados en un Google Sheets. Este Sheets contiene datos personales, experiencia previa, habilidades blandas y duras de diversas personas.

Cuando un usuario envíe un mensaje, debes analizar el contenido para determinar si requiere que busques información en el Google Sheets. Aquí hay algunas pautas para ayudarte:
Los datos presentes en la base de datos son los siguientes (separados por coma y entre comillas simples): 'Nombre Completo', 'Apellido Paterno', 'Apellido Materno', 'Correo Electrónico', 'Teléfono', 'Profesión', 'Años de Experiencia', 'Habilidades Clave', 'Fecha de Nacimiento', 'Ciudad', 'País', 'Estado Civil', 'Intereses', 'Disponibilidad'
aunque pueden ser más datos.

1. **Preguntas sobre habilidades o experiencia**: Si un usuario pregunta sobre las habilidades específicas o la experiencia de una persona en particular, necesitas buscar en el Sheets.
   
2. **Solicitudes de perfiles específicos**: Si el usuario solicita información sobre un perfil o un conjunto de perfiles, debes acceder al Sheets.

3. **Consultas generales sobre trabajo**: Si el usuario hace preguntas generales sobre el trabajo o el proceso de selección que no se relacionan con perfiles específicos, no es necesario buscar en el Sheets.

Ejemplos de mensajes que requieren búsqueda:
- "¿Qué habilidades tiene Juan Pérez?"
- "Muéstrame el perfil de Ana Gómez."
  
Ejemplos de mensajes que no requieren búsqueda:
- "¿Qué consejos tienes para entrevistas de trabajo?"
- "¿Cuáles son las tendencias en habilidades blandas?"

Responde utilizando solo 'SI' o 'NO'
`

const SYSTEM_ROLE_EXTRACT_KEYWORDS = `Eres un asistente que extrae palabras clave relevantes de una consulta. Solo devuelve palabras clave que representen los temas principales o conceptos importantes de la consulta dada.
Estos son algunos de los conceptos alrededor de los cuales se encuentran las palabras clave: ${KEY_CONCEPTS}
Responde con una lista de palabras clave, incluyendo variantes de esta palabra clave según género y subdividiendo una palabra completa en sus componentes. Por ejemplo, si la palabra clave es Desarrollador Web, entonces las palabras claves extendidas son 'Desarrollador', 'Desarrolladora', 'Web', 'Programador', 'Programadora', 'Informático', 'Informática'
El formato de la lista debe ser: 'PALABRA_CLAVE1, PALABRA_CLAVE2, PALABRA_CLAVE3' etc.` // detallando el concepto al que pertenece y las poalabras clave separadas por coma, seperando conceptos y palabras clave con otro caracter

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
                {role: "system", content: `${SYSTEM_ROLE_SEARCH_DECISION}`},
                {role: "user", content: `¿La siguiente consulta requiere buscar en una base de datos? Consulta: "${query}"`}
            ],
            max_tokens: 5,
        });

        const needsSearch = searchDecision.choices[0].message.content.trim().toUpperCase() === 'SI';
        addLog(`Decisión de búsqueda: ${needsSearch ? 'Sí' : 'No'}`);

        let contextInfo = "";
        if (needsSearch) {
            const chatKeywordExtractionResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: `${SYSTEM_ROLE_DESCRIPTION}. ${SYSTEM_ROLE_EXTRACT_KEYWORDS}`},
                    {role: "user", content: `Consulta: "${query}"`}
                ],
                max_tokens: 20,
            });
            const keywordExtraction = chatKeywordExtractionResponse.choices[0].message.content.trim()
            const keywords = keywordExtraction.split(',').map((word) => word.trim())
            addLog(`Palabras clave: ${keywordExtraction}`)
            addLog("Iniciando búsqueda en la base de datos");
            try {
                const searchResults = await searchInSheet(keywords);
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
