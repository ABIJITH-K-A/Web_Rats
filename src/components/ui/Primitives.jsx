import { Children, isValidElement } from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const isGalaxy = variant === 'galaxy';
  const isCardCta = variant === 'cardCta';
  const isStartProject = variant === 'startProject';
  const variants = {
    primary: 'bg-primary-dark border border-cyan-primary/80 text-cyan-primary btn-dark-hover active:scale-95',
    outline: 'bg-black/25 border border-cyan-primary/55 text-cyan-primary btn-dark-outline-hover active:scale-95',
    ghost: 'text-light-gray hover:text-cyan-primary active:scale-95',
    galaxy: 'tn-galaxy-btn min-h-[58px] px-8 py-4 text-white',
    cardCta: 'tn-card-cta-btn text-white rounded-[0.95rem]',
    startProject: 'tn-start-btn min-h-[3.1rem] text-white',
  };
  const childNodes = Children.toArray(children);
  const lastChild = childNodes[childNodes.length - 1];
  const startProjectIcon = isStartProject && isValidElement(lastChild) ? childNodes.pop() : null;
  const startProjectText = childNodes.length > 0 ? childNodes : children;

  return (
    <button
      className={`relative isolate overflow-hidden font-bold transition-all duration-150 flex items-center justify-center gap-2 ${isGalaxy || isCardCta || isStartProject ? '' : 'px-8 py-3 rounded-full'} ${variants[variant]} ${className}`}
      {...props}
    >
      {isGalaxy ? (
        <>
          <span className="tn-galaxy-btn__glow" />
          <span className="tn-galaxy-btn__stars" />
          <span className="tn-galaxy-btn__content">{children}</span>
        </>
      ) : isCardCta ? (
        <>
          <span className="tn-card-cta-btn__glow" />
          <span className="tn-card-cta-btn__content">{children}</span>
        </>
      ) : isStartProject ? (
        <>
          <span className="tn-start-btn__text">{startProjectText}</span>
          <span className="tn-start-btn__icon">
            {startProjectIcon}
          </span>
        </>
      ) : (
        <span className="relative z-[1] flex items-center justify-center gap-2">
          {children}
        </span>
      )}
    </button>
  );
};

const Card = ({ children, className = '', hoverEffect = true, ...props }) => {
  return (
    <div
      className={`group relative overflow-hidden p-8 rounded-2xl border border-white/15 shadow-2xl backdrop-blur-2xl bg-[#0B120C]/95 ${className.replace(/bg-[a-zA-Z0-9/-]+/g, '')}`}
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
    </div>
  );
};

const SectionHeading = ({ children, subtitle, centered = true }) => {
  return (
    <div className={`relative mb-16 ${centered ? 'text-center' : ''}`}>
      {/* Abstract Head Glow */}
      <div className={`absolute top-0 w-32 h-32 bg-cyan-primary/20 rounded-full blur-[60px] pointer-events-none ${centered ? 'left-1/2 -translate-x-1/2' : 'left-0'}`} />
      <h2
        className="text-gradient-brand relative mb-4 text-4xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(155,255,87,0.4)] md:text-5xl"
      >
        {children}
      </h2>
      {subtitle && (
        <p
          className="relative text-light-gray text-lg max-w-2xl mx-auto opacity-80"
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export { Button, Card, SectionHeading };
