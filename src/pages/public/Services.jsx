import { motion } from 'framer-motion';
import { Check, Info, ArrowRight } from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import { SERVICE_LIST } from '../../data/siteData';
import { Link } from 'react-router-dom';

const Services = () => {
  return (
    <div className="flex flex-col py-20">
      {/* Hero Shell */}
      <section className="text-center mb-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-cyan-primary/10 border border-cyan-primary/20 text-cyan-primary text-xs font-mono uppercase tracking-[0.2em] mb-6"
          >
            Live Catalog
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black mb-8 max-w-4xl mx-auto leading-tight">
            Services and pricing that now match the live booking flow.
          </h1>
          <p className="text-lg text-light-gray max-w-2xl mx-auto opacity-70 mb-12">
            This page is synced to the same package catalog used in checkout, so your public pricing, 
            delivery promises, and service details stay aligned with the actual order form.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link to="/book">
              <Button>Start Booking <ArrowRight className="ml-2" size={20} /></Button>
            </Link>
            <a href="#pricingGrid">
              <Button variant="outline">Browse All</Button>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-20">
            {SERVICE_LIST.map((service) => (
              <a 
                key={service.id} 
                href={`#${service.id}`}
                className="px-6 py-2 rounded-xl bg-secondary-dark/50 border border-white/5 text-light-gray hover:text-cyan-primary hover:border-cyan-primary/30 transition-all font-mono text-xs uppercase tracking-widest"
              >
                {service.shortName}
              </a>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Service Lanes', value: '3' },
              { label: 'Live Packages', value: '9' },
              { label: 'Shown At Checkout', value: 'GST' },
              { label: 'Aware Workflow', value: 'Role' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card hoverEffect={false} className="bg-secondary-dark/50 py-6 h-full">
                  <div className="text-3xl font-bold text-cyan-primary mb-1">{stat.value}</div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-light-gray opacity-50">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Billing Info & Main Content */}
      <section className="py-20 bg-secondary-dark/20" id="pricingGrid">
        <div className="container mx-auto px-6">
          {/* Billing Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <Card className="bg-gradient-to-r from-secondary-dark to-primary-dark border-cyan-primary/10 py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary mb-6">
                <Info size={32} />
              </div>
              <h3 className="text-3xl font-bold text-cyan-primary mb-4">How billing works</h3>
              <p className="text-light-gray opacity-70 mb-10 leading-relaxed max-w-3xl">
                The booking page calculates the final payable amount in the server before payment. 
                That means package price, referral discount, GST, and online gateway fee are shown clearly before checkout.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {[
                  'Manual WhatsApp bookings use the manual total shown in checkout.',
                  'Razorpay checkout uses the online total shown in checkout.',
                  'Registration and referrals are stored in Firestore user records.'
                ].map((note, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 px-6">
                    <div className="w-8 h-8 rounded-full bg-teal-primary/10 flex items-center justify-center text-teal-primary">
                      <Check size={18} />
                    </div>
                    <span className="text-sm italic opacity-60 leading-relaxed">{note}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* All Services */}
          <div className="flex flex-col gap-40">
            {SERVICE_LIST.map((service, sidx) => (
              <div key={sidx} id={service.id} className="flex flex-col items-center text-center scroll-mt-32">
                <div className="mb-12 flex flex-col items-center border-b border-white/5 pb-10 w-full max-w-4xl">
                  <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-primary mb-3 opacity-70">{service.shortName}</div>
                  <h3 className="text-5xl font-black mb-4">{service.name}</h3>
                  <p className="text-xl text-light-gray opacity-60 max-w-2xl mx-auto leading-relaxed">{service.summary}</p>
                  <div className="text-sm font-mono uppercase tracking-widest text-light-gray/40 mt-8">
                    Starting from <span className="text-cyan-primary text-2xl font-bold">₹{Math.min(...service.packages.map(p => p.price)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
                  {service.packages.map((pkg, pidx) => (
                    <motion.div
                      key={pidx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: pidx * 0.1 }}
                      className="h-full"
                    >
                      <Card className={`flex flex-col relative group h-full max-w-sm mx-auto w-full transition-all duration-500 hover:border-cyan-primary/40 ${pkg.badge === 'Most Popular' ? 'border-cyan-primary/30 ring-1 ring-cyan-primary/20 scale-[1.03] shadow-[0_0_40px_rgba(103, 248, 29,0.1)]' : ''}`}>
                        <div className="absolute top-4 right-4 text-[10px] font-mono px-3 py-1 rounded-full bg-cyan-primary/10 border border-cyan-primary/20 text-cyan-primary uppercase tracking-tighter">
                          {pkg.badge}
                        </div>
                        <h4 className="text-xl font-bold mb-2 opacity-60 uppercase tracking-wide">{pkg.label}</h4>
                        <div className="text-5xl font-black text-cyan-primary mb-6">₹{pkg.price.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-light-gray/40 mb-10 border-t border-white/5 pt-6">
                          Delivery: <span className="text-light-gray/80">{pkg.delivery}</span>
                        </div>
                        <ul className="space-y-5 flex-grow text-left">
                          {pkg.features.map((feature, fidx) => (
                            <li key={fidx} className="flex gap-4 text-base text-light-gray/80">
                              <Check size={18} className="text-teal-primary shrink-0 mt-1" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Link to="/book" className="mt-10">
                          <Button variant={pkg.badge === 'Most Popular' ? 'primary' : 'outline'} className="w-full py-4 text-base font-bold">
                            Select Plan
                          </Button>
                        </Link>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Scope CTA */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-to-br from-secondary-dark to-primary-dark border-cyan-primary/10 py-20 text-center">
            <h2 className="text-4xl font-black text-cyan-primary mb-6">Need custom scope?</h2>
            <p className="text-lg text-light-gray max-w-2xl mx-auto opacity-70 mb-10 leading-relaxed">
               If your job needs multiple deliverables, multiple workers, or a custom workflow, 
               start from booking and we will route it through the right team.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/help">
                <Button variant="outline">Read Help</Button>
              </Link>
              <Link to="/book">
                <Button>Go To Booking</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Services;
