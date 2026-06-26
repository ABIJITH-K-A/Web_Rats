import { useRef, useEffect, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion'; // eslint-disable-line no-unused-vars

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const transitionDefaults = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94],
};

// Scroll-triggered reveal wrapper
export const ScrollReveal = ({
  children,
  className = '',
  delay = 0,
  y = 24,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ ...transitionDefaults, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger children reveal
export const StaggerContainer = ({
  children,
  className = '',
  staggerDelay = 0.08,
  delayChildren = 0,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger item
export const StaggerItem = ({ children, className = '' }) => {
  return (
    <motion.div variants={fadeUpVariants} transition={transitionDefaults} className={className}>
      {children}
    </motion.div>
  );
};

// Animated gradient text with shimmer
export const GradientText = ({ children, className = '' }) => {
  return (
    <motion.span
      className={`bg-gradient-to-r from-[#9BFF57] via-[#2F5E22] to-[#9BFF57] bg-clip-text text-transparent bg-[length:200%_auto] ${className}`}
      animate={{ backgroundPosition: ['0% 50%', '200% 50%', '0% 50%'] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      style={{ backgroundSize: '200% auto' }}
    >
      {children}
    </motion.span>
  );
};

// Glow text effect - using website theme colors
export const GlowText = ({ children, className = '', color = 'primary' }) => {
  const colors = {
    primary: 'text-[#9BFF57] drop-shadow-[0_0_10px_rgba(155,255,87,0.8)]',
    secondary: 'text-[#2F5E22] drop-shadow-[0_0_10px_rgba(47,94,34,0.8)]',
    accent: 'text-[#9BFF57] drop-shadow-[0_0_10px_rgba(155,255,87,0.8)]',
    font: 'text-[#F4FFF1] drop-shadow-[0_0_10px_rgba(244,255,241,0.5)]',
  };

  const safeColor = colors[color] ? color : 'primary';

  return (
    <motion.span
      className={`${colors[safeColor]} ${className}`}
      animate={{ opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.span>
  );
};

// Reveal text character by character
export const RevealText = ({ text, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.span ref={ref} className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: i * 0.02, duration: 0.3 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Best-in-class heading animation: blur-to-focus word reveal on scroll
export const AnimatedText = ({
  text,
  className = '',
  stagger = 0.06,
  delay = 0,
  blur = 8,
  y = 20,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const words = text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y, filter: `blur(${blur}px)` },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <span ref={ref} className={className} aria-label={text}>
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={wordVariants}
            className="inline-block mr-[0.25em] will-change-transform"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </span>
  );
};

// Floating animation
export const FloatingElement = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// Scale on hover card
export const HoverLift = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
};

// Magnetic button effect - simplified to hover scale
export const MagneticButton = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Parallax scroll effect - subtle vertical float based on scroll
export const ParallaxElement = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// Animated counter
export const AnimatedCounter = ({ target, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (value) => setCount(Math.round(value)),
    });
    return () => controls.stop();
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};
