import React from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    question: "¿Cuánto cuesta la asesoría inicial?",
    answer: "La primera asesoría es totalmente gratuita y sin compromiso."
  },
  {
    question: "¿Debo tener un negocio ya formalizado?",
    answer: "No es necesario. Te ayudamos desde la etapa de idea hasta la formalización y crecimiento."
  },
  {
    question: "¿Cuánto tiempo tardan los trámites?",
    answer: "Depende del trámite, pero siempre buscamos agilizar el proceso y mantenerte informado/a."
  },
  {
    question: "¿Qué documentos necesito?",
    answer: "Te asesoramos y guiamos sobre los documentos necesarios según tu caso."
  }
];

const FAQ: React.FC = () => {
  return (
    <section className="bg-white py-14" itemScope itemType="https://schema.org/FAQPage">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-2xl font-bold text-[#2F4F4F] mb-7 text-center">Preguntas frecuentes</h2>
        <div className="space-y-6">
          {faqData.map(item => (
            <div key={item.question} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <h4 itemProp="name" className="font-semibold text-[#4CAF50] mb-1">{item.question}</h4>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-gray-600">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
