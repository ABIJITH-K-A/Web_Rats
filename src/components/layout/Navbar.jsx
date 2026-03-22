import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Projects', path: '/projects' },
    { name: 'About', path: '/about' },
    { name: 'Book Service', path: '/book' },
    { name: 'Help', path: '/help' },
  ];

  const getDashboardPath = () => {
    if (!role) return '/join?login=1';
    if (['owner', 'superadmin', 'admin', 'manager', 'worker'].includes(role)) return '/dashboard';
    return '/profile';
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-secondary-dark/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'
      }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-primary overflow-hidden transition-transform group-hover:scale-110">
            <img src="/Images/Icons/WebRatTransparentLight.png" alt="TN WEB RATS" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-bold text-cyan-primary tracking-tight">
            TN WEB RATS
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-semibold tracking-wide transition-colors ${location.pathname === link.path ? 'text-cyan-primary' : 'text-light-gray hover:text-cyan-primary'
                }`}
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <Link
              to={getDashboardPath()}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-primary text-primary-dark font-bold hover:shadow-[0_0_15px_#67F81D] transition-all"
            >
              <User size={18} />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/signup"
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-primary text-primary-dark font-bold hover:shadow-[0_0_15px_#66FCF1] transition-all"
            >
              Sign Up
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-cyan-primary"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-secondary-dark border-t border-cyan-primary/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-lg font-semibold text-light-gray hover:text-cyan-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-cyan-primary/10" />
              {user ? (
                <Link
                  to={getDashboardPath()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-primary text-primary-dark font-bold"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={20} />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/join?login=1"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-cyan-primary text-cyan-primary font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn size={20} />
                    Sign In
                  </Link>
                  <Link
                    to="/join"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-primary text-primary-dark font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
