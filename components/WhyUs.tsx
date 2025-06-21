import React from 'react';
import Testimonials from './Testimonials'; // Import Testimonials here

interface WhyUsItem {
  iconClass: string;
  title: string;
  description: string;
}

const whyUsData: WhyUsItem[] = [
  { iconClass: "fas fa-users", title: "Atención Personalizada", description: "Cada emprendedor es único. Nos dedicamos a entender tus necesidades y a ofrecerte soluciones a medida." },
  { iconClass: "fas fa-shield-alt", title: "Respaldo Legal y Contable", description: "Trabajamos con expertos para darte la tranquilidad de que todo está en orden y conforme a la ley." },
  { iconClass: "fas fa-search", title: "Sin Letras Pequeñas", description: "Creemos en la transparencia total. Te explicamos todo de forma clara y sencilla." },
  { iconClass: "fas fa-heart", title: "Crecimiento con Valores", description: "Nuestra base es la fe y el compromiso social. Te acompañamos con honestidad y empatía." }
];

const WhyUs: React.FC = () => {
  return (
    <section className="bg-[#F7F7F7] py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-[#2F4F4F] mb-12">¿Por qué confiar en nosotros?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-5xl mx-auto">
          {whyUsData.map(item => (
            <div key={item.title} className="text-center">
              <div className="why-icon mx-auto bg-[#4CAF50] text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg cursor-pointer transition-all">
                <i className={item.iconClass} aria-hidden="true"></i>
              </div>
              <h3 className="text-xl font-bold text-[#2F4F4F] mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
        
        {/* Testimonios Carrusel moved into its own component and imported */}
        <Testimonials /> 
      </div>
    </section>
  );
};

export default WhyUs;
