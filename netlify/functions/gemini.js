// 1. ARCHIVO: netlify/functions/gemini.js

// Usamos la sintaxis moderna de importación de ES Modules.
// Esto requiere la configuración en package.json ("type": "module")
import fetch from 'node-fetch';

// La función principal de Netlify.
exports.handler = async function(event, context) {
    // 1. Validar que la petición sea POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido. Usa POST.' })
        };
    }

    // 2. Obtener y validar el historial de mensajes del body
    let messages;
    try {
        messages = JSON.parse(event.body).messages;
        if (!messages || !Array.isArray(messages)) {
            throw new Error("El body debe contener un array 'messages'.");
        }
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Body inválido: ${e.message}` })
        };
    }

    // 3. Preparar la petición para la API de Gemini
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Instrucción del sistema para darle personalidad al bot.
    // Gemini no tiene un rol 'system' explícito, se lo pasamos como parte del primer turno del usuario.
    const systemInstruction = `Eres 'Inver', un asesor experto y muy amigable de INVERCOOP Semillas de Fe. Tu misión es ayudar a emprendedores de Ecuador con un tono cercano y profesional. Responde de forma clara y sencilla. Si no sabes algo, dilo honestamente y sugiere hablar con un asesor humano. Eres un bot, pero con mucha empatía.`;

    // **LA CORRECCIÓN MÁS IMPORTANTE ESTÁ AQUÍ**
    // Transformamos el historial de mensajes al formato que Gemini espera.
    // Mantenemos el historial de roles (user/model).
    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user', // Gemini usa 'model' en lugar de 'assistant'
        parts: [{ text: msg.content }]
    }));

    // Añadimos la instrucción de sistema al principio del primer mensaje del usuario
    if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = systemInstruction + "\n\n" + contents[0].parts[0].text;
    }


    try {
        // 4. Llamar a la API de Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents }) // Enviamos el historial formateado
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error desde la API de Gemini:", errorData);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorData.error?.message || "Ocurrió un error al contactar a Gemini." })
            };
        }

        const data = await response.json();

        // 5. Devolver la respuesta de la IA
        // Navegación segura para evitar errores si la respuesta no tiene la estructura esperada
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar esa respuesta. Inténtalo de nuevo.";

        return {
            statusCode: 200,
            // Es buena práctica devolver el objeto de mensaje completo
            body: JSON.stringify({
                message: {
                    role: 'assistant',
                    content: botResponse
                }
            })
        };

    } catch (e) {
        console.error("Error en la función serverless:", e);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Error interno del servidor: ${e.message}` })
        };
    }
};
