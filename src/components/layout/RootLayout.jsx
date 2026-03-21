import { ReactLenis } from 'lenis/react';
import NeuralBackground from './NeuralBackground';
import Navbar from './Navbar';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const RootLayout = ({ children }) => {
  const location = useLocation();

  return (
    <ReactLenis root>
      <div className="relative min-h-screen bg-primary-dark font-sans selection:bg-cyan-primary selection:text-primary-dark">
        <NeuralBackground />
        
        <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
          <Navbar />
          
          <AnimatePresence mode="wait">
             <motion.main 
               key={location.pathname}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.4, ease: "easeOut" }}
               className="flex-grow pt-24"
             >
               {children}
             </motion.main>
          </AnimatePresence>

          <Footer />
        </div>
      </div>
    </ReactLenis>
  );
};

export default RootLayout;
