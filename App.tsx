import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Statistics from './components/Statistics';
import MissionVision from './components/MissionVision';
import Services from './components/Services';
import WhyUs from './components/WhyUs';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import JsonLD from './components/JsonLD';


function App() {
  return (
    <>
      <JsonLD />
      <Header />
      <main>
        <Hero />
        <Statistics />
        <MissionVision />
        <Services />
        <WhyUs />
        <FAQ />
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}

export default App;
