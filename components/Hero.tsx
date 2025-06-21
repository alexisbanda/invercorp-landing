import React, { useState } from 'react';

const Hero: React.FC = () => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; whatsapp?: string; email?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; whatsapp?: string; email?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Por favor, ingresa tu nombre completo.';
    }
    if (!/^\d{9,13}$/.test(whatsapp.trim())) {
      newErrors.whatsapp = 'Ingresa un número de WhatsApp válido.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!validate()) {
      event.preventDefault(); // Prevent submission if validation fails
    }
    // If validation passes, Netlify will handle the form submission
  };

  return (
    <section className="bg-hero relative">
      <div className="container mx-auto px-6 py-20 md:py-28 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-last md:order-first"></div>
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2F4F4F] leading-tight mb-3 text-center">
              La semilla de tu emprendimiento, <span className="text-[#4CAF50]">en tierra fértil.</span>
            </h1>
            <p className="text-md text-gray-600 mb-6 text-center">
              Te ayudamos a crecer con fe, orden y el apoyo financiero que necesitas.
            </p>
            <form 
              id="contactForm" 
              name="contact" 
              method="POST" 
              action="thanks.html"
              data-netlify="true" 
              data-netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="form-name" value="contact" />
              <p className="hidden">
                <label>No llenar este campo <input name="bot-field" /></label>
              </p>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50] ${errors.name ? 'input-error' : ''}`} 
                  placeholder="Ej: Andrea Pérez" 
                  required 
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>
              <div className="mb-4">
                <label htmlFor="whatsapp" className="block text-gray-700 font-medium mb-2">Número de WhatsApp</label>
                <input 
                  type="tel" 
                  id="whatsapp" 
                  name="whatsapp" 
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50] ${errors.whatsapp ? 'input-error' : ''}`} 
                  placeholder="Ej: 0991234567" 
                  required 
                />
                {errors.whatsapp && <div className="error-text">{errors.whatsapp}</div>}
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50] ${errors.email ? 'input-error' : ''}`} 
                  placeholder="tu@correo.com" 
                  required 
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>
              <button type="submit" className="w-full bg-[#4CAF50] text-white font-bold py-3 px-6 rounded-full cta-button text-lg flex items-center justify-center gap-2">
                <span>🌱</span> Quiero mi asesoría gratuita
              </button>
              <p className="text-gray-500 mt-2 text-center text-sm">Respondemos en menos de 24h</p>
              <a 
                href="https://wa.me/593963386031?text=Hola,%20quiero%20más%20información%20sobre%20INVERCOP%20y%20cómo%20pueden%20ayudarme%20a%20crecer."
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 w-full bg-[#25D366] text-white font-bold py-3 px-6 rounded-full cta-button flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#25D366]" 
                aria-label="Habla ahora por WhatsApp"
              >
                <i className="fab fa-whatsapp"></i> Habla ahora por WhatsApp
              </a>
              {/* <div id="formSuccess" className="hidden text-green-700 text-center mt-3 font-semibold"></div> Netlify handles success page */}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
