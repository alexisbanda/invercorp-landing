import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="assets/images/invercoorp_logo.png"
            alt="Logo INVERCOP" 
            className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-[#4CAF50]" 
            loading="lazy"
          />
          <span className="font-bold text-xl text-[#2F4F4F]">INVERCOP</span>
        </div>
        <div>
          <a 
            href="#contacto" 
            className="bg-[#4CAF50] text-white font-semibold px-5 py-2 rounded-full cta-button focus:ring-2 focus:ring-[#4CAF50]" 
            aria-label="Ir a Asesoría Gratuita"
          >
            Asesoría Gratuita
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Header;