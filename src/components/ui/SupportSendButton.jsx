import { Send, CheckCircle2 } from "lucide-react";

export default function SupportSendButton({
  status = "idle",
  idleLabel = "Send Message",
  sentLabel = "Sent",
  className = "",
  disabled = false,
  type = "submit",
  ...props
}) {
  const isSent = status === "sent";
  const label = isSent ? sentLabel : idleLabel;
  const Icon = isSent ? CheckCircle2 : Send;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`relative flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-primary px-6 py-4 text-primary-dark font-black uppercase tracking-widest shadow-2xl disabled:opacity-50 ${className}`}
      {...props}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
