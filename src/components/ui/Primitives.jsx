import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-primary-dark border border-cyan-primary/80 text-cyan-primary btn-dark-hover active:scale-95',
    outline: 'bg-black/25 border border-cyan-primary/55 text-cyan-primary btn-dark-outline-hover active:scale-95',
    ghost: 'text-light-gray hover:text-cyan-primary active:scale-95',
  };

  return (
    <motion.button
      whileHover={{ y: -3, boxShadow: '0 0 20px rgba(103, 248, 29, 0.4)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'tween', duration: 0.14, ease: 'easeOut' }}
      className={`relative isolate overflow-hidden px-8 py-3 rounded-full font-bold transition-all duration-150 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-[1] flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

const Card = ({ children, className = '', hoverEffect = true, ...props }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -8, transition: { duration: 0.3 } } : {}}
      className={`group relative overflow-hidden p-8 rounded-2xl border border-white/15 shadow-2xl backdrop-blur-2xl bg-[#08090C]/95 ${className.replace(/bg-[a-zA-Z0-9/-]+/g, '')}`} /* Stripped inline opacity overrides here */
      {...props}
    >
      {/* Dynamic Lighting Glow Base */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/[0.035] via-transparent to-transparent opacity-35" />
      
      {/* Dynamic Hover Glow */}
      {hoverEffect && (
        <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/25 via-transparent to-teal-primary/20 blur-[20px]" />
        </div>
      )}

      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};

const SectionHeading = ({ children, subtitle, centered = true }) => {
  return (
    <div className={`relative mb-16 ${centered ? 'text-center' : ''}`}>
      {/* Abstract Head Glow */}
      <div className={`absolute top-0 w-32 h-32 bg-cyan-primary/20 rounded-full blur-[60px] pointer-events-none ${centered ? 'left-1/2 -translate-x-1/2' : 'left-0'}`} />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-gradient-brand relative mb-4 text-4xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(103,248,29,0.4)] md:text-5xl"
      >
        {children}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="relative text-light-gray text-lg max-w-2xl mx-auto opacity-80"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};

export { Button, Card, SectionHeading };
