import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, MousePointer2, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary-dark/50 backdrop-blur-md border-t border-cyan-primary/10 pt-16 pb-8 mt-auto relative z-10 transition-colors">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <MousePointer2 className="text-cyan-primary" size={28} />
              <h3 className="text-2xl font-bold text-cyan-primary tracking-tight">TN WEB RATS</h3>
            </div>
            <p className="text-light-gray leading-relaxed opacity-80">
              Your student-powered powerhouse for stunning PPTs, bold posters, and modern websites. 
              We deliver quality design that helps you stand out.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-cyan-primary font-bold text-lg mb-6 tracking-wide uppercase">Contact Us</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:unofficials113@gmail.com" className="flex items-center gap-3 text-light-gray hover:text-cyan-primary transition-all">
                  <Mail size={18} className="text-cyan-primary" />
                  <span>unofficials113@gmail.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+918300920680" className="flex items-center gap-3 text-light-gray hover:text-cyan-primary transition-all">
                  <Phone size={18} className="text-cyan-primary" />
                  <span>+91 8300920680</span>
                </a>
              </li>
              <li>
                <a href="https://instagram.com/tn_web_rats" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-light-gray hover:text-cyan-primary transition-all">
                  <Instagram size={18} className="text-cyan-primary" />
                  <span>@tn_web_rats</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-cyan-primary font-bold text-lg mb-6 tracking-wide uppercase">Explore</h4>
            <ul className="grid grid-cols-2 gap-4">
              <li>
                <Link to="/services" className="text-light-gray hover:text-cyan-primary transition-all flex items-center gap-1 group">
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all font-bold" />
                  Services
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-light-gray hover:text-cyan-primary transition-all flex items-center gap-1 group">
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/book" className="text-light-gray hover:text-cyan-primary transition-all flex items-center gap-1 group">
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  Book Now
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-light-gray hover:text-cyan-primary transition-all flex items-center gap-1 group">
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-cyan-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 text-sm opacity-60">
          <p>© 2026 TN WEB RATS. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-cyan-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-cyan-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
