import { Download } from "lucide-react";
import { Link } from "react-router-dom";

export default function DownloadActionButton({
  label = "Download",
  to,
  href,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  icon: Icon = Download, // eslint-disable-line no-unused-vars
  ...props
}) {
  const content = (
    <>
      <div className="absolute left-1 top-1 bottom-1 z-10 flex w-12 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-primary to-teal-primary text-primary-dark shadow-2xl">
        <Icon size={20} />
      </div>
      <span className="relative z-20 flex w-full items-center justify-center pl-14 pr-5 text-sm font-black uppercase tracking-[0.16em]">
        {label}
      </span>
    </>
  );

  const baseClassName = [
    "group relative inline-flex h-14 w-[190px] items-center overflow-hidden rounded-[1.35rem] border border-cyan-primary/18 bg-[#10161c]/94 text-white shadow-2xl",
    disabled ? "pointer-events-none opacity-45" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <div className="inline-flex">
        <Link
          to={to}
          className={baseClassName}
          aria-disabled={disabled}
          {...props}
        >
          {content}
        </Link>
      </div>
    );
  }

  if (href) {
    return (
      <div className="inline-flex">
        <a
          href={href}
          className={baseClassName}
          aria-disabled={disabled}
          {...props}
        >
          {content}
        </a>
      </div>
    );
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={baseClassName}
      disabled={disabled}
      {...props}
    >
      {content}
    </button>
  );
}
