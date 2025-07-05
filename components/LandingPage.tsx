import React from 'react';

// --- Tus importaciones actuales ---
import Header from './Header';
import Hero from './Hero';
import Services from './Services';
import WhyUs from './WhyUs';
import FAQ from './FAQ';
import Footer from './Footer';
import Chatbot from './Chatbot';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';

export const LandingPage: React.FC = () => {
    const { isChatbotEnabled } = useFeatureFlags();

    return (
        <>
            <Header />
            <main>
                <Hero />
                <Services />
                <WhyUs />
                <FAQ />
            </main>
            <Footer />

            {/* --- INICIO DE LA CORRECCIÓN --- */}
            {/* Añadimos de nuevo el botón flotante de WhatsApp */}
            <a
                href="https://wa.me/593999942309?text=Hola,%20necesito%20asesoría%20para%20mi%20emprendimiento."
                className="whatsapp-float"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
            >
                <i className="fab fa-whatsapp"></i>
            </a>
            {/* --- FIN DE LA CORRECCIÓN --- */}

            {isChatbotEnabled && <Chatbot />}
        </>
    );
};