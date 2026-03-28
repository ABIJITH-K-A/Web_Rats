import { ReactLenis } from 'lenis/react';
import NeuralBackground from './NeuralBackground';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const RootLayout = ({ children }) => {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname === '/dashboard' || location.pathname === '/profile';

  return (
    <ReactLenis root>
      <div className="relative min-h-screen bg-primary-dark font-sans selection:bg-cyan-primary selection:text-primary-dark">
        <NeuralBackground />
        
        <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
          {!isDashboardRoute && <Navbar />}
          
          <main 
            key={location.pathname}
            className={`flex-grow ${isDashboardRoute ? '' : 'pt-24'}`}
          >
            {children}
          </main>

          {!isDashboardRoute && <Footer />}
        </div>
      </div>
    </ReactLenis>
  );
};

export default RootLayout;
