import { useEffect } from 'react';
import Header from '../components/Header';
import PluginMarketplace from '../components/PluginMarketplace';
import Footer from '../components/Footer';

function Marketplace() {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <PluginMarketplace />
      </main>
      <Footer />
    </div>
  );
}

export default Marketplace;
