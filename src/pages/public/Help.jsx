import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, UserCircle, ChevronDown, ShieldCheck, FileText, LifeBuoy } from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import { CLIENT_FAQS, WORKER_FAQS, CONTACT_INFO } from '../../data/siteData';
import { Link } from 'react-router-dom';

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden mb-4 bg-secondary-dark/30">
      <button
        onClick={onClick}
        className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-white/5"
      >
        <span className="font-bold text-light-gray">{question}</span>
        <ChevronDown 
          className={`text-cyan-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          size={20} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-sm text-light-gray/60 leading-relaxed border-t border-white/5 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Help = () => {
  const [openClientFaq, setOpenClientFaq] = useState(null);
  const [openWorkerFaq, setOpenWorkerFaq] = useState(null);

  return (
    <div className="flex flex-col py-20">
      {/* Hero Section */}
      <section className="text-center mb-32">
        <div className="container mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-primary mb-6">Support Center</div>
          <h1 className="text-5xl md:text-6xl font-black mb-8 max-w-4xl mx-auto leading-tight">
             Questions for clients, workers, and staff now live in one place.
          </h1>
          <p className="text-lg text-light-gray max-w-2xl mx-auto opacity-70 mb-12">
            This help page is aligned with the current booking system, referral model, 
            payout workflows, and role-based dashboards so people get answers that match the real product.
          </p>
        </div>
      </section>

      {/* Support Cards */}
      <section className="mb-32">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: 'Email support', 
              icon: <Mail size={28} />, 
              desc: 'Best for detailed project scope, billing questions, and records.', 
              action: `mailto:${CONTACT_INFO.email}?subject=TN WEB RATS Support`,
              btn: 'Email Us',
              variant: 'outline'
            },
            { 
              title: 'WhatsApp support', 
              icon: <Phone size={28} />, 
              desc: 'Best for manual bookings, urgent delivery follow-up, and quick clarifications.', 
              action: `https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent("Hi TN WEB RATS, I need help with my account or project.")}`,
              btn: 'Chat on WhatsApp',
              variant: 'primary'
            },
            { 
              title: 'Account support', 
              icon: <UserCircle size={28} />, 
              desc: 'Use your profile and dashboard pages once signed in to track orders, payouts, and reports.', 
              action: '/signup',
              btn: 'Open Sign In',
              variant: 'outline'
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="flex flex-col items-center text-center group h-full">
                <div className="w-16 h-16 rounded-2xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary mb-6 group-hover:bg-cyan-primary group-hover:text-primary-dark transition-all">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-4 text-cyan-primary">{item.title}</h4>
                <p className="text-sm text-light-gray opacity-60 mb-8 flex-grow">{item.desc}</p>
                {item.action.startsWith('/') ? (
                  <Link to={item.action} className="w-full">
                    <Button variant={item.variant} className="w-full">{item.btn}</Button>
                  </Link>
                ) : (
                  <a href={item.action} className="w-full" target="_blank" rel="noreferrer">
                    <Button variant={item.variant} className="w-full">{item.btn}</Button>
                  </a>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-24 bg-secondary-dark/20">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-primary mb-4 opacity-70">Client FAQ</div>
            <h2 className="text-4xl font-black mb-10">For customers and buyers</h2>
            <div className="flex flex-col">
              {CLIENT_FAQS.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  {...faq} 
                  isOpen={openClientFaq === i} 
                  onClick={() => setOpenClientFaq(openClientFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-primary mb-4 opacity-70">Worker FAQ</div>
            <h2 className="text-4xl font-black mb-10">For workers and team members</h2>
            <div className="flex flex-col">
              {WORKER_FAQS.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  {...faq} 
                  isOpen={openWorkerFaq === i} 
                  onClick={() => setOpenWorkerFaq(openWorkerFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Policy Snippets */}
      <section className="py-32">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { title: 'Login behavior', icon: <ShieldCheck />, text: 'Signed-in sessions are tied to the active browser session and expire after inactivity for safety.' },
             { title: 'User records', icon: <FileText />, text: 'Registrations are stored with role-based metadata to ensure your dashboard works correctly.' },
             { title: 'Escalation', icon: <LifeBuoy />, text: 'If you have issues with payment or payroll, message support with your Order ID for rapid tracing.' },
           ].map((item, i) => (
             <div key={i} className="p-8 border-l border-cyan-primary/20">
               <div className="text-cyan-primary mb-4">{item.icon}</div>
               <h4 className="text-xl font-bold mb-4">{item.title}</h4>
               <p className="text-sm text-light-gray opacity-60 leading-relaxed">{item.text}</p>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default Help;
