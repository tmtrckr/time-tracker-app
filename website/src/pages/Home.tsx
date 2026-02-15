import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import KeyBenefits from '../components/KeyBenefits';
import WhyChoose from '../components/WhyChoose';
import Features from '../components/Features';
import Plugins from '../components/Plugins';
import UseCases from '../components/UseCases';
import Screenshots from '../components/Screenshots';
import Trust from '../components/Trust';
import Download from '../components/Download';
import Docs from '../components/Docs';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

function Home() {
  const location = useLocation();

  useEffect(() => {
    // Handle hash navigation when coming from other pages
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Stats />
        <KeyBenefits />
        <WhyChoose />
        <Features />
        <Plugins />
        <UseCases />
        <Screenshots />
        <Trust />
        <Download />
        <Docs />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
