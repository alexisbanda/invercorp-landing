import React, { useState, useEffect, useRef } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// --- Constantes para la nueva funcionalidad ---
const suggestedQuestions = [
    "¿Qué servicios ofrecen?",
    "¿Cómo funciona la asesoría?",
    "Quiero simular un crédito"
];

// 1. Palabras clave para activar la captura de leads (en minúsculas)
const LEAD_CAPTURE_KEYWORDS = ['crédito', 'prestamo', 'préstamo', 'asesoría', 'legal', 'ayuda', 'financiamiento', 'contable'];

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy Inver, tu asesor virtual de INVERCOP. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // 2. Nuevo estado para controlar el modo de captura de leads
    const [isLeadCaptureMode, setIsLeadCaptureMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    // --- Lógica de la API (sin cambios) ---
    const fetchBotResponse = async (currentMessages: Message[]) => {
        setIsLoading(true);
        try {
            const response = await fetch('/.netlify/functions/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: currentMessages }),
            });

            if (!response.ok) {
                throw new Error('La respuesta del servidor no fue exitosa.');
            }

            const data = await response.json();
            const botMessage = data.message;
            setMessages(prevMessages => [...prevMessages, botMessage]);

            // 3. ¡AQUÍ LA MAGIA! Revisa el último mensaje del usuario después de recibir la respuesta del bot
            const lastUserMessage = currentMessages[currentMessages.length - 1]?.content.toLowerCase();
            const shouldCaptureLead = LEAD_CAPTURE_KEYWORDS.some(keyword => lastUserMessage.includes(keyword));

            if (shouldCaptureLead && !isLeadCaptureMode) {
                // Espera un poco para que se sienta más natural
                setTimeout(() => {
                    const leadCaptureMessage: Message = {
                        role: 'assistant',
                        content: '¡Claro que sí! Para darte información personalizada, uno de nuestros asesores expertos puede contactarte. Si gustas, déjame tu nombre y número de WhatsApp.'
                    };
                    setMessages(prev => [...prev, leadCaptureMessage]);
                    setIsLeadCaptureMode(true); // Activa el modo de captura
                }, 700);
            }

        } catch (error) {
            console.error('Error al contactar al chatbot:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo más tarde.'
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Función para enviar los datos del lead a un formulario de Netlify
    const handleLeadSubmit = async (contactInfo: string) => {
        const formData = new FormData();
        formData.append('form-name', 'chatbot-leads');
        formData.append('contact_info', contactInfo);

        try {
            await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData as any).toString(),
            });

            const thankYouMessage: Message = {
                role: 'assistant',
                content: '¡Gracias! Hemos recibido tus datos. Un asesor se pondrá en contacto contigo muy pronto. ¿Hay algo más en lo que pueda ayudarte?'
            };
            setMessages(prev => [...prev, thankYouMessage]);

        } catch (error) {
            console.error('Error al enviar el lead:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Lo siento, hubo un problema al guardar tus datos. Por favor, contáctanos directamente por WhatsApp.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLeadCaptureMode(false); // Vuelve al modo normal
            setInputValue('');
        }
    };

    // 5. El manejador de envío ahora decide qué hacer según el modo
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        if (isLeadCaptureMode) {
            // Si estamos en modo captura, envía el lead
            const userMessage: Message = { role: 'user', content: inputValue };
            setMessages(prev => [...prev, userMessage]);
            await handleLeadSubmit(inputValue);
        } else {
            // Si no, es una conversación normal
            const userMessage: Message = { role: 'user', content: inputValue };
            const newMessages = [...messages, userMessage];
            setMessages(newMessages);
            setInputValue('');
            await fetchBotResponse(newMessages);
        }
    };

    const handleSuggestionClick = async (question: string) => {
        if (isLoading) return;
        const userMessage: Message = { role: 'user', content: question };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        await fetchBotResponse(newMessages);
    };

    return (
        <>
            {/* 6. Formulario oculto para que Netlify detecte y procese los leads del chatbot */}
            <form name="chatbot-leads" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
                <input type="text" name="contact_info" />
            </form>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-5 sm:right-10 w-[calc(100%-2.5rem)] sm:w-96 h-[70vh] sm:h-[60vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-[#4CAF50] text-white p-4 rounded-t-2xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <img src="/assets/images/invercoorp_logo.png" alt="Invercop Logo" className="w-10 h-10 rounded-full bg-white p-0.5" />
                            <div>
                                <h3 className="font-bold">Inver, tu Asesor Virtual</h3>
                                <p className="text-xs opacity-80">En línea</p>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="text-2xl hover:opacity-75" aria-label="Cerrar chat">&times;</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        <div className="flex flex-col gap-3">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-[#4CAF50] text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {/* Preguntas sugeridas (se ocultan en modo captura) */}
                            {messages.length === 1 && !isLoading && !isLeadCaptureMode && (
                                <div className="mt-2 flex flex-wrap gap-2 justify-start">
                                    {suggestedQuestions.map(q => (
                                        <button
                                            key={q}
                                            onClick={() => handleSuggestionClick(q)}
                                            className="bg-white border border-gray-300 text-sm text-[#4CAF50] px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none p-3">
                                        <span className="animate-pulse">Escribiendo...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input (ahora es dinámico) */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                // 7. El placeholder cambia según el modo
                                placeholder={isLeadCaptureMode ? "Tu nombre y WhatsApp..." : "Escribe tu pregunta..."}
                                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                                disabled={isLoading}
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#4CAF50] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-600 disabled:bg-gray-400" disabled={isLoading || !inputValue.trim()}>
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className="fixed bottom-[110px] right-10 bg-[#4CAF50] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl z-40 hover:bg-green-600 transition-transform hover:scale-110"
                aria-label="Abrir chat de ayuda"
            >
                <i className="fas fa-robot"></i>
            </button>
        </>
    );
};

export default Chatbot;