import { motion } from "framer-motion";

export default function AccordionToggleIcon({ open = false }) {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
      <motion.span
        className="absolute h-[2px] w-4 rounded-full bg-cyan-primary"
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />
      <motion.span
        className="absolute h-4 w-[2px] rounded-full bg-cyan-primary"
        animate={{ rotate: open ? 90 : 0, opacity: open ? 0 : 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />
    </span>
  );
}
