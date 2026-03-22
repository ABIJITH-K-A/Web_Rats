import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from './Primitives';
import { ArrowRight } from 'lucide-react';

const ServiceCard = ({ service }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-secondary-dark rounded-2xl border border-white/5 shadow-xl overflow-hidden"
    >
      <div className="h-60 bg-primary-dark flex items-center justify-center">
        {/* Using a placeholder for the image */}
        <img
          src={`https://via.placeholder.com/400x240.png/0A0A0A/FFFFFF?text=${service.shortName}`}
          alt={service.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-bold text-cyan-primary mb-2">{service.name}</h3>
        <p className="text-light-gray opacity-70 mb-6 h-24">{service.summary}</p>
        <Link to={`/service/${service.id}`}>
          <Button className="w-full font-bold">
            View Details <ArrowRight className="ml-2" size={20} />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
