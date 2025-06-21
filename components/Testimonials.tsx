import React, { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  location: string;
  image: string;
  date: string;
}

const testimonialsData: Testimonial[] = [
  {
    id: 1,
    quote: "Gracias a INVERCOP mi emprendimiento pasó de ser solo una idea a un negocio formal y rentable. ¡Te acompañan de verdad!",
    author: "Andrea P.",
    location: "Quito",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    date: "2023-12-01"
  },
  {
    id: 2,
    quote: "El apoyo financiero y la asesoría contable que recibí de INVERCOP transformaron mi pequeño negocio. Ahora tengo todo en regla y estoy creciendo.",
    author: "Carlos M.",
    location: "Guayaquil",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    date: "2023-11-15"
  },
  {
    id: 3,
    quote: "Como emprendedora, siempre tuve miedo de los trámites legales. INVERCOP me guió paso a paso y ahora mi negocio está completamente formalizado.",
    author: "Lucía T.",
    location: "Cuenca",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    date: "2023-10-20"
  },
  {
    id: 4,
    quote: "La asesoría psicológica para mi equipo ha mejorado notablemente el ambiente laboral. INVERCOP ofrece un servicio integral que va más allá de lo financiero.",
    author: "Roberto J.",
    location: "Manta",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    date: "2023-09-05"
  }
];

const Testimonials: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prevSlide => (prevSlide + 1) % testimonialsData.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const selectSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="mt-16 max-w-2xl mx-auto" itemScope itemType="https://schema.org/Product">
      <meta itemProp="name" content="Servicios INVERCOP" />
      <h3 className="text-2xl font-bold text-center text-[#2F4F4F] mb-6">Lo que dicen nuestros clientes</h3>
      <div className="testimonial-carousel relative">
        {testimonialsData.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className={`testimonial-slide bg-white p-8 rounded-2xl shadow-md ${index === currentSlide ? '' : 'hidden'}`}
            itemProp="review"
            itemScope
            itemType="https://schema.org/Review"
          >
            <meta itemProp="datePublished" content={testimonial.date} />
            <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
              <meta itemProp="ratingValue" content="5" />
              <meta itemProp="bestRating" content="5" />
            </div>
            <blockquote itemProp="reviewBody" className="text-[#2F4F4F] italic text-lg mb-3">
              "{testimonial.quote}"
            </blockquote>
            <div className="flex items-center justify-center">
              <img 
                src={testimonial.image} 
                alt={`Testimonio cliente ${testimonial.author}`}
                className="h-12 w-12 rounded-full mr-3" 
                loading="lazy" 
              />
              <span itemProp="author" itemScope itemType="https://schema.org/Person" className="font-semibold text-[#4CAF50]">
                <span itemProp="name">{testimonial.author} - {testimonial.location}</span>
              </span>
            </div>
          </div>
        ))}
        <div className="testimonial-indicators flex justify-center mt-6 space-x-2">
          {testimonialsData.map((_, index) => (
            <button
              key={index}
              onClick={() => selectSlide(index)}
              className={`w-3 h-3 rounded-full bg-[#4CAF50] ${index === currentSlide ? 'opacity-100' : 'opacity-40'}`}
              aria-label={`Testimonio ${index + 1}`}
              aria-current={index === currentSlide ? 'true' : 'false'}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
