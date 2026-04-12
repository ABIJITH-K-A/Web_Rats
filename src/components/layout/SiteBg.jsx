import Galaxy from "./Galaxy";

const SiteBg = () => {
  return (
    <div
      id="site-bg"
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden bg-primary-dark"
    >
      <div className="absolute inset-0 scale-[1.06] opacity-80">
        <Galaxy
          density={0.5}
          glowIntensity={0.12}
          saturation={0.18}
          hueShift={215}
          twinkleIntensity={0.3}
          rotationSpeed={0.02}
          repulsionStrength={1.8}
          starSpeed={0.3}
          speed={0.3}
          mouseInteraction={false}
          mouseRepulsion={false}
          disableAnimation={false}
          transparent
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top, rgba(255, 255, 255, 0.05), transparent 38%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-dark/10 via-primary-dark/38 to-primary-dark/88" />
    </div>
  );
};

export default SiteBg;
