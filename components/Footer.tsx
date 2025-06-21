import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="contacto" className="bg-[#2F4F4F] text-white pt-16 pb-8 mt-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <img 
              src="assets/images/invercoorp_logo.png"
              alt="Logo INVERCOP Blanco" 
              className="h-16 w-16 mb-4 bg-white rounded-full p-1 object-cover" 
              loading="lazy" 
            />
            <p className="text-gray-300">Somos tu aliado estratégico para el crecimiento y la formalización de tu emprendimiento en Ecuador.</p>
          </div>
          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Información de Contacto</h4>
            <ul className="space-y-2 text-gray-300">
              <li><i className="fas fa-map-marker-alt mr-2 text-[#4CAF50]"></i>PICHINCHA - QUITO, ECUADOR</li>
              <li><i className="fas fa-phone-alt mr-2 text-[#4CAF50]"></i>(593) 9XX-XXX-XXX</li>
              <li><i className="fas fa-envelope mr-2 text-[#4CAF50]"></i>contacto@invercop.com</li>
              <li><i className="fas fa-file-contract mr-2 text-[#4CAF50]"></i>RUC: 1793227553001</li>
            </ul>
            <p className="text-gray-400 text-sm mt-3">Horario: Lunes a Viernes, 9:00am - 6:00pm</p>
          </div>
          {/* Social Media */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Síguenos en Redes</h4>
            <div className="flex space-x-4">
              <a href="https://facebook.com/invercop" className="text-gray-300 hover:text-[#4CAF50] text-2xl" target="_blank" rel="noopener noreferrer" aria-label="Facebook de INVERCOP"><i className="fab fa-facebook-f"></i></a>
              <a href="https://instagram.com/invercop" className="text-gray-300 hover:text-[#4CAF50] text-2xl" target="_blank" rel="noopener noreferrer" aria-label="Instagram de INVERCOP"><i className="fab fa-instagram"></i></a>
              <a href="https://linkedin.com/company/invercop" className="text-gray-300 hover:text-[#4CAF50] text-2xl" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de INVERCOP"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} INVERCOP Semillas de Fe S.A.S. Todos los derechos reservados.<br />
            Desarrollado con ❤️ por <a className="text-gray-300 hover:text-[#4CAF50]" href="https://vancouver-landings.netlify.app/"><b>Vancouver Landings</b></a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;