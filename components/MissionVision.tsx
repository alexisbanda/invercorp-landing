import React from 'react';

const Tooltip: React.FC<{ text: string, children: React.ReactNode }> = ({ text, children }) => (
  <span className="relative group cursor-pointer font-semibold text-[#4CAF50]">
    {children}
    <span className="opacity-0 group-hover:opacity-100 transition bg-white border border-[#4CAF50] rounded shadow-md absolute left-1/2 -translate-x-1/2 top-8 text-xs px-3 py-2 z-20 whitespace-nowrap">
      {text}
    </span>
  </span>
);

const MissionVision: React.FC = () => {
  return (
    <section className="py-12 bg-[#F7F7F7]">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-stretch gap-8 relative">
          {/* Timeline decorativo en desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 h-full w-1 bg-gradient-to-b from-[#4CAF50] to-transparent rounded-full"></div>
          
          {/* Misión */}
          <div className="relative z-10 md:w-1/2 bg-white rounded-2xl shadow p-8 flex flex-col items-center h-full">
            <span className="text-6xl mb-3 text-[#4CAF50]">🌱</span>
            <h2 className="text-2xl font-bold text-[#4CAF50] mb-3">Nuestra Misión</h2>
            <p className="text-gray-700 text-lg text-center leading-relaxed">
              Impulsar el desarrollo integral de las comunidades a través de servicios de microcrédito accesibles y responsables, promoviendo la <Tooltip text="Acceso justo y solidario a crédito y ahorro">inclusión financiera</Tooltip>, el emprendimiento local y el bienestar de nuestros socios, bajo principios de <Tooltip text="Apoyo y colaboración entre miembros">solidaridad</Tooltip>, <Tooltip text="Relaciones transparentes y honestas">confianza</Tooltip> y <Tooltip text="Impacto positivo en la comunidad">compromiso social</Tooltip>.
            </p>
          </div>

          {/* Visión */}
          <div className="relative z-10 md:w-1/2 bg-white rounded-2xl shadow p-8 flex flex-col items-center h-full">
            <span className="text-6xl mb-3 text-[#4CAF50]">🌟</span>
            <h2 className="text-2xl font-bold text-[#4CAF50] mb-3">Nuestra Visión</h2>
            <p className="text-gray-700 text-lg text-center leading-relaxed">
              Ser una cooperativa referente en inclusión financiera, reconocida por transformar vidas mediante el acceso <Tooltip text="Oportunidades iguales para todos los socios">justo y solidario</Tooltip> al microcrédito, fomentando comunidades <Tooltip text="Desarrollo económico y social a largo plazo">sostenibles</Tooltip>, empoderadas y económicamente activas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVision;
