import { useRef } from "react";

const SpotlightCard = ({
  children,
  className = "",
  spotlightColor = "rgba(103, 248, 29, 0.2)",
  ...props
}) => {
  const cardRef = useRef(null);

  const updateSpotlightPosition = (clientX, clientY) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spotlight-x", `${clientX - rect.left}px`);
    card.style.setProperty("--spotlight-y", `${clientY - rect.top}px`);
  };

  const handlePointerEnter = (event) => {
    updateSpotlightPosition(event.clientX, event.clientY);
    cardRef.current?.style.setProperty("--spotlight-opacity", "0.7");
  };

  const handlePointerMove = (event) => {
    updateSpotlightPosition(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    cardRef.current?.style.setProperty("--spotlight-opacity", "0");
  };

  const handleFocus = () => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spotlight-x", `${rect.width / 2}px`);
    card.style.setProperty("--spotlight-y", `${rect.height / 2}px`);
    card.style.setProperty("--spotlight-opacity", "0.58");
  };

  const handleBlur = () => {
    cardRef.current?.style.setProperty("--spotlight-opacity", "0");
  };

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-black/55 transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-cyan-primary/24 hover:bg-black/72 hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)] ${className}`}
      style={{
        "--spotlight-color": spotlightColor,
        "--spotlight-opacity": "0",
        "--spotlight-x": "50%",
        "--spotlight-y": "50%",
      }}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: "var(--spotlight-opacity)",
          transition: "opacity 500ms ease",
          background:
            "radial-gradient(circle 180px at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent 72%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[15px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 34%, transparent 68%, rgba(103, 248, 29, 0.05))",
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

export default SpotlightCard;
