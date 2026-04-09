import { motion } from "framer-motion";
import { CircleX } from "lucide-react";

export default function DeniedActionButton({
  label = "Not Allowed",
  className = "",
  onClick,
  type = "button",
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      aria-disabled="true"
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      className={`tn-denied-btn group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border border-[#ff715e]/25 bg-[#11161c] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.22)] transition-[border-color,transform] duration-300 hover:border-[#ff715e]/55 ${className}`}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 translate-y-full bg-[#ff715e] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0" />
      <span className="relative z-10 flex items-center gap-3">
        <span>{label}</span>
        <CircleX size={20} className="text-[#ff8c79] transition-colors duration-300 group-hover:text-white" />
      </span>
    </motion.button>
  );
}
