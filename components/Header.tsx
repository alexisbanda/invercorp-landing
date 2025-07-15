import React, { useState } from 'react';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import WorkWithUsModal from './WorkWithUsModal';

const Header: React.FC = () => {
  const { isClientPortalEnabled } = useFeatureFlags();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="/assets/images/invercoorp_logo.png"
            alt="Logo INVERCOP" 
            className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-[#4CAF50]" 
            loading="lazy"
          />
          <span className="font-bold text-xl text-[#2F4F4F]">INVERCOP</span>
        </div>
        {/* Menú horizontal siempre, iconos en móvil */}
        <div className="flex flex-row gap-2 md:gap-4 items-center">
          <a 
            href="#contacto" 
            className="bg-[#4CAF50] text-white font-semibold px-5 py-2 rounded-full cta-button focus:ring-2 focus:ring-[#4CAF50] flex items-center justify-center"
            aria-label="Ir a Asesoría Gratuita"
          >
            {/* Icono de chat mejorado */}
            <svg className="h-6 w-6 md:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h8M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden md:inline">Asesoría Gratuita</span>
          </a>
          {isClientPortalEnabled && (
            <a
              href="/portal/login"
              className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center"
              aria-label="Portal Clientes"
            >
              {/* Icono de usuario mejorado */}
              <svg className="h-6 w-6 md:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span className="hidden md:inline">Portal Clientes</span>
            </a>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
            aria-label="Trabaja con nosotros"
          >
            <svg className="h-6 w-6 md:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="13" rx="2" ry="2"></rect>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span className="hidden md:inline">Trabaja con nosotros</span>
          </button>
        </div>
      </nav>
      <WorkWithUsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
};

export default Header;