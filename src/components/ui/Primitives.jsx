import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-cyan-primary text-primary-dark hover:shadow-[0_0_15px_#66FCF1] active:scale-95',
    outline: 'border border-cyan-primary text-cyan-primary hover:bg-cyan-primary/10 active:scale-95',
    ghost: 'text-light-gray hover:text-cyan-primary active:scale-95',
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const Card = ({ children, className = '', hoverEffect = true, ...props }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -10, transition: { duration: 0.3 } } : {}}
      className={`bg-secondary-dark p-8 rounded-2xl border border-white/5 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const SectionHeading = ({ children, subtitle, centered = true }) => {
  return (
    <div className={`mb-16 ${centered ? 'text-center' : ''}`}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl md:text-5xl font-black text-cyan-primary mb-4"
      >
        {children}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-light-gray text-lg max-w-2xl mx-auto opacity-70"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};

export { Button, Card, SectionHeading };
