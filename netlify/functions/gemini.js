import fetch from 'node-fetch';

// --- RECOMENDACIÓN 1: Definir constantes para un fácil ajuste ---
// Limita el historial a los últimos 6 turnos (3 del usuario, 3 del bot).
// Esto evita que el costo y la latencia se disparen en conversaciones largas.
const MAX_HISTORY_TURNS = 6;

// --- RECOMENDACIÓN 2: Definir la configuración de generación ---
// Controla directamente el costo y la creatividad de la respuesta.
const generationConfig = {
    "temperature": 0.7, // Un valor balanceado para creatividad y coherencia.
    "maxOutputTokens": 300, // ¡CRÍTICO! Limita la respuesta a 300 tokens para controlar costos.
};

// --- BUENA PRÁCTICA: Añadir filtros de seguridad ---
const safetySettings = [
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
];

const systemInstruction = {
    role: "user",
    parts: [{
        text: `Eres 'Inver', un asesor experto y muy amigable de INVERCOOP Semillas de Fe. Tu misión es ayudar a emprendedores de Ecuador con un tono cercano y profesional. Responde de forma clara y sencilla. Si no sabes algo, dilo honestamente y sugiere hablar con un asesor humano. Eres un bot, pero con mucha empatía.`
    }]
};

// Las constantes para los mensajes iniciales y sugerencias se han eliminado de aquí.
// Deben estar en tu componente de React (Chatbot.tsx).

export const handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido. Usa POST.' }) };
    }

    let incomingMessages;
    try {
        incomingMessages = JSON.parse(event.body).messages;
        if (!incomingMessages || !Array.isArray(incomingMessages)) {
            throw new Error("El body debe contener un array 'messages'.");
        }
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: `Body inválido: ${e.message}` }) };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // --- Aplicación de RECOMENDACIÓN 1: Aplicar la ventana deslizante al historial ---
    const conversationHistory = incomingMessages.slice(-MAX_HISTORY_TURNS);

    // Transformamos el historial al formato de Gemini
    const contents = conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // --- RECOMENDACIÓN 3: Inyectar la instrucción del sistema de forma eficiente ---
    // Solo se añade la instrucción del sistema al principio de la conversación.
    const finalContents = [systemInstruction, ...contents];

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: finalContents,
                    generationConfig, // <-- Aplicación de RECOMENDACIÓN 2
                    safetySettings    // <-- Aplicación de RECOMENDACIÓN 4
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error desde la API de Gemini:", errorData);
            const errorMessage = errorData.error?.message || "Ocurrió un error al contactar a Gemini.";
            if (errorData.promptFeedback?.blockReason) {
                return { statusCode: 200, body: JSON.stringify({ message: { role: 'assistant', content: 'Lo siento, tu pregunta infringe nuestras políticas de seguridad. ¿Puedo ayudarte con otra cosa?' } }) };
            }
            return { statusCode: response.status, body: JSON.stringify({ error: errorMessage }) };
        }

        const data = await response.json();
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta. Por favor, intenta reformular tu pregunta.";

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: {
                    role: 'assistant',
                    content: botResponse
                }
            })
        };

    } catch (e) {
        console.error("Error en la función serverless:", e);
        return { statusCode: 500, body: JSON.stringify({ error: `Error interno del servidor: ${e.message}` }) };
    }
};