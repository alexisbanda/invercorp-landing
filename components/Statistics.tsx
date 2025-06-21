import React, { useState, useEffect, useRef } from 'react';

interface StatItem {
  id: string;
  finalValue: number;
  label: string;
  hasPlus?: boolean;
}

const statsData: StatItem[] = [
  { id: 'negocios', finalValue: 200, label: 'negocios formalizados', hasPlus: true },
  { id: 'asesorias', finalValue: 500, label: 'asesorías brindadas', hasPlus: false },
  { id: 'experiencia', finalValue: 7, label: 'años de experiencia', hasPlus: false },
];

const Statistics: React.FC = () => {
  const [animatedStats, setAnimatedStats] = useState<Record<string, number>>(
    statsData.reduce((acc, stat) => ({ ...acc, [stat.id]: 0 }), {})
  );
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the element is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    statsData.forEach(stat => {
      let startValue = 0;
      const duration = 2000; // 2 seconds
      const increment = Math.ceil(stat.finalValue / (duration / 50)); // Update every 50ms

      const timer = setInterval(() => {
        startValue += increment;
        if (startValue >= stat.finalValue) {
          clearInterval(timer);
          setAnimatedStats(prev => ({ ...prev, [stat.id]: stat.finalValue }));
        } else {
          setAnimatedStats(prev => ({ ...prev, [stat.id]: startValue }));
        }
      }, 50);
    });
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="bg-[#4CAF50] py-12 text-white shadow-lg">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {statsData.map((stat, index) => (
            <div 
              key={stat.id} 
              className={`p-4 transform hover:scale-105 transition-transform duration-300 ${
                index === 1 ? 'border-t md:border-t-0 md:border-l md:border-r border-white/30 my-2 md:my-0 py-6 md:py-4' : ''
              }`}
            >
              <div className={`text-5xl font-bold mb-3 stat-number ${isVisible ? 'animated' : ''}`}>
                {stat.hasPlus ? '+' : ''}{animatedStats[stat.id]}
              </div>
              <div className="text-lg font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
