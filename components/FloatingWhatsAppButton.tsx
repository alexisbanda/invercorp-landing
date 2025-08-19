import React from 'react';

const FloatingWhatsAppButton: React.FC = () => {
  return (
    <a 
      href="https://wa.me/593993845713?text=Hola,%20quiero%20más%20información%20sobre%20INVERCOP%20y%20cómo%20pueden%20ayudarme%20a%20crecer."
      className="whatsapp-float" 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <i className="fab fa-whatsapp"></i>
    </a>
  );
};

export default FloatingWhatsAppButton;
