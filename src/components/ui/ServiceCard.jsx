import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./Primitives";

const formatPrice = (price) => `Rs ${price.toLocaleString("en-IN")}`;

const ServiceCard = ({ service }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/8 bg-secondary-dark/80 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute left-5 top-5 rounded-full border border-cyan-primary/25 bg-black/55 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary">
          {service.categoryShortName}
        </div>
        <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/75">
          From {formatPrice(service.startingPrice)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="mb-4">
          <h3 className="mb-2 text-2xl font-black text-white">{service.name}</h3>
          <p className="text-sm leading-6 text-light-gray/72">{service.summary}</p>
        </div>

        <div className="mb-8 space-y-3">
          {service.deliverables.slice(0, 3).map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 text-sm leading-6 text-light-gray/70"
            >
              <CheckCircle2
                size={16}
                className="mt-1 shrink-0 text-cyan-primary"
              />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row">
          <Link to={`/service/${service.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          <Link
            to={`/book?category=${service.categoryId}&service=${service.id}`}
            className="flex-1"
          >
            <Button className="w-full">
              Book Now <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default ServiceCard;
