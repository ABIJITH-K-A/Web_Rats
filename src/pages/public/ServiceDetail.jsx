import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import { Button, Card } from '../../components/ui/Primitives';
import { SERVICE_MAP } from '../../data/siteData';
import { Link, useParams } from 'react-router-dom';

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const service = SERVICE_MAP[serviceId];

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Service not found</h1>
        <p className="text-lg text-light-gray opacity-70 mb-8">
          The service you are looking for does not exist.
        </p>
        <Link to="/services">
          <Button variant="outline">
            <ArrowLeft className="mr-2" size={20} />
            Back to Services
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-20">
      <section className="text-center mb-24">
        <div className="container mx-auto px-6">
          <Link to="/services" className="text-cyan-primary hover:underline mb-8 inline-block">
            <Button variant="ghost">
              <ArrowLeft className="mr-2" size={20} />
              Back to Services
            </Button>
          </Link>
          <div className="mb-12 flex flex-col items-center border-b border-white/5 pb-10 w-full max-w-4xl mx-auto">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-primary mb-3 opacity-70">{service.shortName}</div>
            <h3 className="text-5xl font-black mb-4">{service.name}</h3>
            <p className="text-xl text-light-gray opacity-60 max-w-2xl mx-auto leading-relaxed">{service.summary}</p>
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
      </section>
    </div>
  );
};

export default ServiceDetail;
