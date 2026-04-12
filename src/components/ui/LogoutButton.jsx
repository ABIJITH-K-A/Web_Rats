import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

export default function LogoutButton({
  label = "Logout",
  className = "",
  onClick,
  type = "button",
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.58 }}
      onClick={onClick}
      aria-label={label}
      className={`tn-logout-btn ${className}`}
      {...props}
    >
      <span className="tn-logout-btn__sign">
        <LogOut />
      </span>
      <span className="tn-logout-btn__text">{label}</span>
    </motion.button>
  );
}
