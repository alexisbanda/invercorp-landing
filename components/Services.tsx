import React from 'react';

interface ServiceItem {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  points: string[];
}

const servicesData: ServiceItem[] = [
  {
    imageSrc: "https://images.pexels.com/photos/210990/pexels-photo-210990.jpeg?auto=compress&w=600&h=400&fit=crop",
    imageAlt: "Persona realizando cálculos tributarios - Asesoría Legal",
    title: "Asesoría Legal",
    description: "Acompañamiento profesional en temas legales empresariales y familiares.",
    points: ["Constitución y trámites de compañías", "Divorcios y separación de bienes", "Poderes notariales y coactivas"]
  },
  {
    imageSrc: "https://images.pexels.com/photos/4386327/pexels-photo-4386327.jpeg?auto=compress&w=600&h=400&fit=crop",
    imageAlt: "Mano recibiendo dinero - Contabilidad",
    title: "Contabilidad",
    description: "Gestión tributaria y contable para tu empresa o emprendimiento.",
    points: ["Declaraciones de impuestos y anexos", "Eliminación de multas", "Patentes y asesoría contable"]
  },
  {
    imageSrc: "https://images.unsplash.com/photo-1523289333742-be1143f6b766?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Persona firmando en una tablet - Finanzas",
    title: "Finanzas",
    description: "Soluciones financieras para tu crecimiento personal o empresarial.",
    points: ["Revisión de buró crediticio", "Micropréstamos y créditos externos", "Planificación de ahorro e inversión"]
  },
  {
    imageSrc: "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&w=600&h=400&fit=crop",
    imageAlt: "Bombilla de luz representando una idea - Psicología",
    title: "Psicología",
    description: "Bienestar personal, familiar y empresarial con apoyo profesional.",
    points: ["Psicopedagogía", "Orientación familiar", "Psicología clínica"]
  }
];

const Services: React.FC = () => {
  return (
    <section id="servicios" className="bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-[#2F4F4F] mb-4">Servicios profesionales para negocios y empresas</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          Nos encargamos de la parte compleja para que tú te concentres en crecer.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {servicesData.map(service => (
            <div key={service.title} className="bg-white rounded-2xl shadow-md overflow-hidden service-card flex flex-col h-full">
              <img src={service.imageSrc} alt={service.imageAlt} className="object-cover w-full h-40" loading="lazy" />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-[#2F4F4F] mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-3">{service.description}</p>
                <ul className="text-[#4CAF50] text-sm list-disc pl-5 text-left">
                  {service.points.map(point => <li key={point}>{point}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
