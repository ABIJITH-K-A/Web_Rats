import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
  { name: "Projects", path: "/projects" },
  { name: "Templates", path: "/templates" },
  { name: "About", path: "/about" },
  { name: "Book Service", path: "/book" },
  { name: "Help", path: "/help" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const getDashboardPath = () => {
    if (!role) return "/join";
    if (["owner", "superadmin", "admin", "manager", "worker"].includes(role)) {
      return "/dashboard";
    }
    return "/profile";
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full border-b transition-[background-color,border-color,padding,box-shadow,backdrop-filter] duration-300 ${
        scrolled
          ? "border-cyan-primary/10 bg-secondary-dark/92 py-3 shadow-lg backdrop-blur-xl"
          : "border-transparent bg-transparent py-5 shadow-none backdrop-blur-0"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-full border border-cyan-primary/40 bg-black/60">
            <img
              src="/Images/Icons/WebRatTransparentLight.png"
              alt="TNWebRats"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-cyan-primary">
              TN WEB RATS
            </div>
            <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-light-gray/38">
              We Build Your Ideas
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors ${
                  active ? "text-cyan-primary" : "text-light-gray/78 hover:text-cyan-primary"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {user ? (
            <Link
              to={getDashboardPath()}
              className="rounded-full border border-cyan-primary bg-cyan-primary px-6 py-2.5 text-sm font-bold text-primary-dark transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <User size={16} /> Dashboard
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/join?tab=register"
                className="rounded-full border border-cyan-primary/50 px-4 py-2 text-sm font-semibold text-cyan-primary transition-all hover:bg-cyan-primary/10"
              >
                Join
              </Link>
              <Link
                to="/join?login=1"
                className="rounded-full border border-cyan-primary bg-cyan-primary px-4 py-2 text-sm font-bold text-primary-dark transition-transform hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="text-cyan-primary lg:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/8 bg-secondary-dark/96 lg:hidden">
          <div className="container mx-auto flex flex-col gap-4 px-6 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-base font-semibold ${
                  location.pathname === link.path
                    ? "text-cyan-primary"
                    : "text-light-gray/80"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <Link
                to={getDashboardPath()}
                className="mt-2 rounded-2xl border border-cyan-primary bg-cyan-primary px-5 py-3 text-center text-sm font-bold text-primary-dark"
              >
                Open Dashboard
              </Link>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link
                  to="/join?tab=register"
                  className="flex-1 rounded-2xl border border-cyan-primary/50 px-4 py-3 text-center text-sm font-semibold text-cyan-primary transition-all hover:bg-cyan-primary/10"
                >
                  Join
                </Link>
                <Link
                  to="/join?login=1"
                  className="flex-1 rounded-2xl border border-cyan-primary bg-cyan-primary px-4 py-3 text-center text-sm font-bold text-primary-dark"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
