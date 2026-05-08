import { CircleX } from "lucide-react";

export default function DeniedActionButton({
  label = "Not Allowed",
  className = "",
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      aria-disabled="true"
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      className={`relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border border-[#ff715e]/25 bg-[#11161c] px-5 py-3 text-sm font-black text-white shadow-2xl ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-3">
        <span>{label}</span>
        <CircleX size={20} className="text-[#ff8c79]" />
      </span>
    </button>
  );
}
