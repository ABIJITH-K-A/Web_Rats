import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button, Card } from '../../components/ui/Primitives';
import { SERVICE_LIST } from '../../data/siteData';
import { Link } from 'react-router-dom';
import ServiceCard from '../../components/ui/ServiceCard';

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
        </div>
      </section>

      {/* All Services Grid */}
      <section className="py-20 bg-secondary-dark/20" id="pricingGrid">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
            {SERVICE_LIST.map((service) => (
              <ServiceCard key={service.id} service={service} />
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
