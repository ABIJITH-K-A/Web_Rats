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
  { name: "Order", path: "/book" },
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
    if (["owner", "admin", "worker"].includes(role)) {
      return "/dashboard";
    }
    return "/profile";
  };

  const navWidthClass = scrolled
    ? "w-[94%] max-w-7xl rounded-full mt-4 shadow-2xl"
    : "w-[96%] max-w-7xl rounded-[2.5rem] mt-6 shadow-xl";

  const navSurfaceClass = scrolled
    ? "border-white/20 bg-white/10 py-3 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]"
    : "border-white/10 bg-white/5 py-4 backdrop-blur-xl";

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
      <nav
        className={`border transition-[width,border-radius,background-color,border-color,padding,box-shadow,backdrop-filter,margin] duration-500 ease-out ${
          isOpen ? "w-[96%] rounded-[2rem]" : navWidthClass
        } ${navSurfaceClass} overflow-hidden`}
      >
        <div className="mx-auto grid grid-cols-3 items-center px-6">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center gap-3 justify-self-start">
            <div className="h-11 w-11 overflow-hidden rounded-full border border-white/12 bg-[#08090C]/80">
              <img
                src="/Images/Icons/logo.jpg"
                alt="Rynix"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-cyan-primary">
                RYNIX
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/38">
                We Build Your Ideas
              </div>
            </div>
          </Link>

          {/* Nav Links - Center */}
          <div className="hidden items-center justify-center gap-8 lg:flex">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[15px] font-bold transition-colors ${
                    active ? "text-cyan-primary" : "text-light-gray/78 hover:text-cyan-primary"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons - Right */}
          <div className="hidden items-center justify-self-end gap-2 lg:flex">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="rounded-full border border-cyan-primary bg-cyan-primary px-7 py-3 text-[15px] font-black text-primary-dark transition-transform hover:-translate-y-0.5 shadow-lg shadow-cyan-primary/20"
              >
                <span className="flex items-center gap-2">
                  <User size={16} /> Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/join?tab=register"
                  className="rounded-full border border-cyan-primary/50 px-5 py-2.5 text-[15px] font-bold text-cyan-primary transition-all hover:bg-cyan-primary/10"
                >
                  Join
                </Link>
                <Link
                  to="/join?login=1"
                  className="rounded-full border border-cyan-primary bg-cyan-primary px-6 py-2.5 text-[15px] font-black text-primary-dark transition-transform hover:-translate-y-0.5 shadow-lg shadow-cyan-primary/20"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="text-cyan-primary lg:hidden justify-self-end"
            onClick={() => setIsOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-white/8 bg-[#08090C]/94 lg:hidden backdrop-blur-2xl">
            <div className="mx-auto flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-lg font-bold ${
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
                  className="mt-2 rounded-2xl border border-cyan-primary bg-cyan-primary px-5 py-4 text-center text-[15px] font-black text-primary-dark"
                >
                  Open Dashboard
                </Link>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Link
                    to="/join?tab=register"
                    className="flex-1 rounded-2xl border border-cyan-primary/50 px-4 py-3.5 text-center text-[15px] font-bold text-cyan-primary transition-all hover:bg-cyan-primary/10"
                  >
                    Join
                  </Link>
                  <Link
                    to="/join?login=1"
                    className="flex-1 rounded-2xl border border-cyan-primary bg-cyan-primary px-4 py-3.5 text-center text-[15px] font-black text-primary-dark"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
