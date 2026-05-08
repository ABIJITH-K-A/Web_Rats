import { useRef } from 'react';

// Scroll-triggered reveal wrapper - simplified to static
export const ScrollReveal = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Stagger children reveal - simplified to static
export const StaggerContainer = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Stagger item - simplified to static
export const StaggerItem = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Animated gradient text - simplified to static
export const GradientText = ({ children, className = '' }) => {
  return (
    <span className={`bg-gradient-to-r from-[#9BFF57] via-[#2F5E22] to-[#9BFF57] bg-clip-text text-transparent bg-[length:200%_auto] ${className}`}>
      {children}
    </span>
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
    <span className={`${colors[safeColor]} ${className}`}>
      {children}
    </span>
  );
};

// Reveal text character by character - simplified to static
export const RevealText = ({ text, className = '' }) => {
  return (
    <span className={className}>
      {text}
    </span>
  );
};

// Floating animation - simplified to static
export const FloatingElement = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Scale on hover card - simplified to static
export const HoverLift = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Magnetic button effect - simplified to static
export const MagneticButton = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Parallax scroll effect - simplified to static
export const ParallaxElement = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Animated counter - simplified to static
export const AnimatedCounter = ({ target, suffix = '', prefix = '' }) => {
  return (
    <span>
      {prefix}{target.toLocaleString()}{suffix}
    </span>
  );
};
