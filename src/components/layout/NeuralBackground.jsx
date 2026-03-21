import { useEffect, useRef } from 'react';

const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <iframe 
        src="/neural-bg.html" 
        className="w-full h-full border-none opacity-40 scale-125 pointer-events-none"
        title="Neural Background"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/20 via-transparent to-primary-dark/80" />
    </div>
  );
};

export default NeuralBackground;
