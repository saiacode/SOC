const OpenAI = require("openai");
const { Logger } = require('../logger');
const { Socket } = require('../socket')
const { googleSheetsInstance } = require('../googleSheets');
const { parseConversation } = require("../utils");
const { updateLastQuery, updateAverageResponseTime, updateTotalQueries } = require("./events");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const KEY_CONCEPTS = `'Nombre Completo', 'Apellido Paterno', 'Apellido Materno', 'Correo Electrónico', 'Teléfono', 'Profesión', 'Años de Experiencia', 'Habilidades Clave', 'Fecha de Nacimiento', 'Ciudad', 'País', 'Estado Civil', 'Intereses', 'Disponibilidad'`

const SHEET_COLUMNS =`'Respondent ID', 'santan', 'Nombre', 'Apellido', 'Pronombres', 'Email', 'WhatsApp', 'Clasificacion', 'status', 'Comentarios', 'Reglamento convivencia etico', 
'Cumpleaños', 'País', 'País actual', 'Provincia', 'Instagram', 'TikTok', 'Facebook', 'Twitter', 'Tu canal de youtube', 
'Perfil', 'Compartinos tu CV',	'Compartinos tu perfil de LinkedIn', 'Contanos brevemente sobre tu trabajo y en qué industria te desempe ñás', 'Contanos brevemente qué estás aprendiendo	Sobre tu emprendimiento', 'Tu actividad', 'Disponibilidad: Elegí la opción que mejor se ajuste a tu situación actual.', 'Actividades: Seleccioná todas las que te interesen', 'Actividades: Seleccioná todas las que te interesen (Consultoría)', 'Actividades: Seleccioná todas las que te interesen (Desarrollo)', 'Actividades: Seleccioná todas las que te interesen (Mentoría)', 'Actividades: Seleccioná todas las que te interesen (Dictado de charlas)', 'Actividades: Seleccioná todas las que te interesen (Generación de contenido)', 'Actividades: Seleccioná todas las que te interesen (Investigación)', 'Actividades: Seleccioná todas las que te interesen (Administración y gestión)', 'Actividades: Seleccioná todas las que te interesen (Marketing y ventas)', 'Disponibilidad de voluntariado: Seleccioná la opción que mejor se ajuste a tu situación actual', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Comunicación)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Expansión federal)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Eventos)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Contenidos)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Desarrollo)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Vinculación empresaria)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Vinculación gubernamental)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Vinculación académica)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Investigación)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Gestión)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Administración)', 'Areas de SAIA: Seleccioná todas las áreas en las que te gustaría colaborar (Otros)', 'Membresía : Seleccioná la opción que mejor se ajuste a tus expectativas, todos los niveles incluyen los accesos del nivel anterior.'`

// Definición del rol del sistema
const SYSTEM_ROLE_DESCRIPTION = 
"Eres SOC, el asistente virtual de SAIA (Sociedad Argentina de Inteligencia Artificial) especializado en ubicar perfiles de personas en la base de datos propia para ocupar puestos de trabajo en la organización. Tu función es proporcionar información y asistencia relacionada con la idoneidad de los registrados para tareas especificas y generar alternativas para reasignar tareas.";

const SYSTEM_ROLE_SEARCH_DECISION = `Eres un asistente virtual especializado en recursos humanos y gestión de talento. Tu tarea es ayudar a los usuarios a obtener información sobre perfiles de trabajo almacenados en un Google Sheets. Este Sheets contiene datos personales, experiencia previa, habilidades blandas y duras de diversas personas.

Cuando un usuario envíe un mensaje, debes analizar el contenido para determinar si requiere que busques información en el Google Sheets. Aquí hay algunas pautas para ayudarte:
Los datos presentes en la base de datos son los siguientes (separados por coma y entre comillas simples): 
${SHEET_COLUMNS}
aunque pueden ser más datos o pueden aparecer en inglés también.

1. **Preguntas sobre habilidades o experiencia**: Si un usuario pregunta sobre las habilidades específicas o la experiencia de una persona en particular, necesitas buscar en el Sheets.
   
2. **Solicitudes de perfiles específicos**: Si el usuario solicita información sobre un perfil o un conjunto de perfiles, debes acceder al Sheets.

3. **Consultas generales sobre trabajo**: Si el usuario hace preguntas generales sobre el trabajo o el proceso de selección que no se relacionan con perfiles específicos, no es necesario buscar en el Sheets.

Ejemplos de mensajes que requieren búsqueda:
- "¿Qué habilidades tiene Juan Pérez?"
- "Muéstrame el perfil de Ana Gómez."
- "Brindame informacion sobre candidatos que tengan experiencia en desarrollo web"
  
Ejemplos de mensajes que no requieren búsqueda:
- "¿Qué consejos tienes para entrevistas de trabajo?"
- "¿Cuáles son las tendencias en habilidades blandas?"

Responde utilizando solo 'SI' o 'NO'
`

const SYSTEM_ROLE_EXTRACT_KEYWORDS = `Eres un asistente que extrae palabras clave relevantes de una consulta. Solo devuelve palabras clave que representen los temas principales o conceptos importantes de la consulta dada.
Estos son algunos de los conceptos alrededor de los cuales se encuentran las palabras clave: ${KEY_CONCEPTS}
Responde con una lista de palabras clave, incluyendo variantes de esta palabra clave según género y subdividiendo una palabra completa en sus componentes si es una palabra clave compuesta, como por ejemplo 'desarrollador web' o 'community manager'. 
Si la palabra clave está en inglés también incluye su traducción al español, si está en español incluye su traducción al inglés. Genera las variantes de esta palabra clave traducida.
Caso de ejemplo 1: La palabra clave es 'Desarrollador Web', esta es una palabra clave compuesta entonces las palabras claves que la componen son 'Desarrollador', 'Desarrolladora', 'Web', 'Programador', 'Programadora', 'Informático', 'Informática', 'Developer', 'Programmer', 'Informatics'.
Caso de ejemplo 2: La palabra clave es 'Diseñador Web', esta es una palabra clave compuesta entonces las palabras claves que la componen son 'Diseñador', 'Diseñadora', 'Web', 'Designer'.
Caso de ejemplo 3: La palabra clave es 'Programador', esta es una palabra clave simple entonces las palabras clave relacionadas son 'Desarrollador', 'Desarrolladora', 'Programador', 'Programadora', 'Informático', 'Informática', 'Developer', 'Programmer', 'Informatics'.
El formato de la lista debe ser: 'PALABRA_CLAVE1, PALABRA_CLAVE2, PALABRA_CLAVE3' etc.` // detallando el concepto al que pertenece y las poalabras clave separadas por coma, seperando conceptos y palabras clave con otro caracter

const CHAT_GPT_API_MODEL = "gpt-3.5-turbo"
let llmStats = {
    model: CHAT_GPT_API_MODEL,
    status: "Activo",
    lastQuery: null,
    averageResponseTime: 0,
    totalQueries: 0,
    totalResponseTime: 0
};

async function handleLLMQuery(message, query, messages) {
  const startTime = Date.now();
  const chat = await message.getChat();
  const previusChat = parseConversation(messages)

  const logger = new Logger()
  try {
    logger.addLog(`Consulta recibida: "${query}"`);
    await chat.sendStateTyping();

    // Determinar si es necesario buscar en la base de datos
    const searchDecision = await openai.chat.completions.create({
      model:CHAT_GPT_API_MODEL,
      messages: [
        {role: "system", content: `${SYSTEM_ROLE_SEARCH_DECISION}`},
        {role: "user", content: `¿La siguiente consulta requiere buscar en una base de datos? Consulta: "${query}"`}
      ],
      max_tokens: 5,
    });

    const needsSearch = searchDecision.choices[0].message.content.trim().toUpperCase() === 'SI';
    logger.addLog(`Decisión de búsqueda: ${needsSearch ? 'Sí' : 'No'}`);

    const contextInfo = [
      ...(needsSearch ? previusChat : []),
      {role: "user", content: query},
    ]
    if (needsSearch) {
      const chatKeywordExtractionResponse = await openai.chat.completions.create({
        model: CHAT_GPT_API_MODEL,
        messages: [
          {role: "system", content: `${SYSTEM_ROLE_DESCRIPTION}. ${SYSTEM_ROLE_EXTRACT_KEYWORDS}`},
          {role: "user", content: `Consulta: "${query}"`}
        ],
        max_tokens: 50,
      });
      const keywordExtraction = chatKeywordExtractionResponse.choices[0].message.content.trim()
      const keywords = keywordExtraction.split(',').map((word) => word.trim())
      logger.addLog(`Palabras clave: ${keywordExtraction}`)
      logger.addLog("Iniciando búsqueda en la base de datos");
      try {
        const searchResults = await googleSheetsInstance.searchInSheet(keywords);
        logger.addLog(`Resultados de la búsqueda: ${JSON.stringify(searchResults)}`);
        if (searchResults.length > 0) {
          contextInfo.push(
            { role: "assistant", content: `Resultados de la búsqueda: ${JSON.stringify(searchResults)}` }
          )
        } else {
          contextInfo.push(
            { role: "assistant", content: "No se encontraron resultados en la base de datos." }
          )
        }
      } catch (searchError) {
        logger.addLog(`Error en la búsqueda: ${searchError.message}`);
        contextInfo.push(
          { role: "assistant", content: "Hubo un error al buscar en la base de datos." }
        )
      }
    }

    // Generar respuesta final con OpenAI
    logger.addLog("Generando respuesta final");
    const completion = await openai.chat.completions.create({
      model: CHAT_GPT_API_MODEL,
      messages: [
          {role: "system", content: SYSTEM_ROLE_DESCRIPTION},
          ...contextInfo,
          {role: "user", content: "Por favor, responde a la consulta original basándote en la información proporcionada y tu conocimiento general."}
      ],
      max_tokens: 500
    });

    const respuesta = completion.choices[0].message.content.trim();
    logger.addLog(`Respuesta generada: ${respuesta}`);

    await chat.clearState();
    await message.reply(respuesta);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Actualizar estadísticas
    const socket = new Socket()
    const io = socket.getSocketIO()

    llmStats.lastQuery = new Date().toLocaleString();
    updateLastQuery(io)
    llmStats.totalQueries++;
    llmStats.totalResponseTime += responseTime;
    updateAverageResponseTime(io, getAverageResponseTime())
    updateTotalQueries(io, llmStats.totalQueries)

  } catch (error) {
    console.error("Error en handleLLMQuery:", error);
    logger.addLog(`Error al procesar la consulta: ${error.message}`);
    await chat.clearState();
    await message.reply("Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo más tarde.");
  }
}

function getAverageResponseTime() {
  return llmStats.totalQueries > 0 
            ? Math.round(llmStats.totalResponseTime / llmStats.totalQueries) 
            : 0
}

function getLLMStatus() {
    return {
        ...llmStats,
        averageResponseTime: getAverageResponseTime()
    };
}

module.exports = { handleLLMQuery, getLLMStatus };
