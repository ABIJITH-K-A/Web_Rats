export default function AccordionToggleIcon({ open = false }) {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
      <span className="absolute h-[2px] w-4 rounded-full bg-cyan-primary" />
      <span
        className="absolute h-4 w-[2px] rounded-full bg-cyan-primary transition-all duration-200"
        style={{ opacity: open ? 0 : 1, transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
      />
    </span>
  );
}
