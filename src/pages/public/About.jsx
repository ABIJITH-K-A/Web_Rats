import { motion } from 'framer-motion';
import { Shield, CreditCard, Users, Cloud, ArrowRight } from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import { ABOUT_POINTS, SERVICE_LIST } from '../../data/siteData';
import { Link } from 'react-router-dom';

const About = () => {
  const icons = [<Shield />, <CreditCard />, <Users />, <Cloud />];

  return (
    <div className="flex flex-col py-20">
      {/* Hero Section */}
      <section className="mb-32">
        <div className="container mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-primary mb-6">Studio To Platform</div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              className="lg:col-span-7"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-5xl md:text-6xl font-black leading-tight mb-8">
                TN WEB RATS is no longer just a portfolio site. It is becoming a <span className="text-cyan-primary">production workflow</span> for design delivery.
              </h1>
              <p className="text-xl text-light-gray opacity-70 leading-relaxed max-w-2xl mb-12">
                We started as a fast-moving creative team for PPTs, posters, and websites. 
                The product has now grown into a role-based system with customer accounts, 
                staff dashboards, referrals, reporting, payouts, and backend-verified billing.
              </p>
              <div className="flex gap-4">
                <Link to="/book">
                  <Button>Book A Project</Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline">See Live Packages</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              className="lg:col-span-5"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users size={120} />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary mb-4 opacity-70">Now Active</div>
                  <h3 className="text-2xl font-bold mb-8">What this platform is built around</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Full Control', value: 'Owner' },
                      { label: 'Role Dashboards', value: 'Staff' },
                      { label: 'Visible Billing', value: 'GST' },
                      { label: 'Launch Ready', value: 'Cloud' },
                    ].map((item, i) => (
                      <div key={i} className="bg-primary-dark/50 p-4 rounded-xl border border-white/5 text-center">
                        <div className="text-lg font-bold text-cyan-primary">{item.value}</div>
                        <div className="text-[9px] uppercase font-mono tracking-widest text-light-gray/40">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { label: 'Core Services', value: '3' },
              { label: 'Package Tiers', value: '9' },
              { label: 'Staff Roles', value: '5+' },
              { label: 'Tracked Workflow', value: '24/7' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-8 border-x border-white/5">
                <div className="text-5xl font-black text-white/90 mb-2">{stat.value}</div>
                <div className="text-xs font-mono uppercase tracking-widest text-cyan-primary opacity-60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-32 bg-secondary-dark/20 relative">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="relative p-12">
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-primary mb-6">Story</div>
            <h2 className="text-4xl font-black mb-8">Why we are rebuilding</h2>
            <div className="space-y-6 text-light-gray opacity-70 leading-relaxed text-lg">
              <p>
                The original static pages were written quickly, which made them easy to launch but hard to keep in sync. 
                Booking, pricing, help, and role flows started drifting apart. 
                We are now centralizing the live service catalog and auth behavior so every page reflects the real platform state.
              </p>
              <p>
                That matters because this project is moving toward real-money operations, cloud deployment, 
                staff payroll tracking, and safer approval flows. A marketing page can no longer say 
                something different from the checkout or dashboard.
              </p>
            </div>
          </Card>

          <Card className="relative p-12 overflow-hidden">
             <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-primary mb-6">Direction</div>
             <h2 className="text-4xl font-black mb-8">Where it's heading</h2>
             <p className="text-light-gray opacity-70 mb-10 text-lg leading-relaxed">
               The next stage is a maintainable application structure with shared content, 
               trusted backend payment verification, and a modern React + Tailwind frontend.
             </p>
             <div className="flex flex-col gap-4">
               {ABOUT_POINTS.map((point, i) => (
                 <div key={i} className="flex gap-4 items-start p-4 bg-primary-dark/40 rounded-2xl border border-white/5 group hover:border-cyan-primary/20 transition-colors">
                   <div className="w-10 h-10 shrink-0 bg-cyan-primary/10 rounded-xl flex items-center justify-center text-cyan-primary group-hover:bg-cyan-primary transition-colors group-hover:text-primary-dark">
                     {icons[i] || <ArrowRight size={20} />}
                   </div>
                   <p className="text-sm opacity-80 leading-snug">{point}</p>
                 </div>
               ))}
             </div>
          </Card>
        </div>
      </section>

      {/* Live Services Snapshot */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="The same live services exposed through the booking page.">
            What we deliver today
          </SectionHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICE_LIST.map((service, i) => (
              <Card key={i} className="text-center group overflow-hidden border-cyan-primary/5 hover:border-cyan-primary/20">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-primary mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  {service.shortName}
                </div>
                <h3 className="text-3xl font-black mb-4 group-hover:text-white transition-colors">{service.name}</h3>
                <p className="text-light-gray opacity-60 mb-8 max-w-xs mx-auto text-sm">{service.summary}</p>
                <div className="text-xl font-bold text-cyan-primary border-t border-white/5 pt-6 group-hover:scale-110 transition-transform">
                  Starts at ₹{Math.min(...service.packages.map(p => p.price)).toLocaleString('en-IN')}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black text-cyan-primary mb-8">Need project help?</h2>
            <p className="text-xl text-light-gray opacity-70 max-w-2xl mx-auto mb-12">
              Use booking for new work, help for support, and profile or dashboards once you are signed in.
            </p>
            <div className="flex justify-center gap-6">
              <Link to="/help">
                <Button variant="outline">Open Help</Button>
              </Link>
              <Link to="/signup">
                <Button>Create Account</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
