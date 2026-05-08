import { Wallet } from "lucide-react";

export default function AnimatedPaymentButton({
  type = "button",
  onClick,
  processing = false,
  disabled = false,
  idleLabel,
  processingLabel = "Processing payment...",
  idleIcon: IdleIcon = Wallet,
  className = "",
}) {
  const isDisabled = disabled || processing;
  const activeLabel = processing ? processingLabel : idleLabel;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={processing}
      className={`relative inline-flex min-h-[68px] items-center justify-center overflow-hidden rounded-[1.55rem] border border-white/12 bg-[#0e151a]/96 px-6 py-4 text-white shadow-2xl disabled:cursor-not-allowed disabled:opacity-65 ${className}`}
    >
      <div className={`relative z-10 flex items-center justify-center gap-3 ${processing ? "text-cyan-primary" : "text-white"}`}>
        <span className="flex items-center justify-center">
          {IdleIcon ? <IdleIcon size={18} /> : <Wallet size={18} />}
        </span>
        <span className="text-sm font-black uppercase tracking-[0.16em]">{activeLabel}</span>
      </div>
    </button>
  );
}
