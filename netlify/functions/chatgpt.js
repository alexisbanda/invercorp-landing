const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({error: 'Método no permitido'})
        };
    }

    const OPENAI_KEY = process.env.OPENAI_KEY;
    const { messages } = JSON.parse(event.body);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 300
        })
    });

    const data = await response.json();

    if (!response.ok) {
        return {
            statusCode: response.status,
            body: JSON.stringify({error: data.error?.message || "Error en OpenAI"})
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({answer: data.choices[0].message.content})
    };
};
