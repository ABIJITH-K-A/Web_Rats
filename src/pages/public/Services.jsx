import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "../../components/ui/Primitives";
import ServiceCard from "../../components/ui/ServiceCard";
import {
  CONTACT_INFO,
  SERVICE_CATEGORIES,
  WHY_CHOOSE_US,
} from "../../data/siteData";

const Services = () => {
  return (
    <div className="flex flex-col py-20">
      <section className="pb-18">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-6 inline-flex rounded-full border border-cyan-primary/20 bg-cyan-primary/8 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary">
            Our Services
          </div>
          <h1 className="mx-auto max-w-5xl text-5xl font-black leading-[1.05] text-white md:text-6xl">
            Affordable{" "}
            <span className="text-gradient-brand inline-block">
              digital solutions
            </span>{" "}
            for students, creators, and small businesses.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-light-gray/70">
            We keep our focus sharp and our output sharper. Here is exactly what
            TNWebRats brings to the table - nothing bloated, nothing vague.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/book">
              <Button>
                View Services <ArrowRight size={16} />
              </Button>
            </Link>
            <a
              href={`https://wa.me/${CONTACT_INFO.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline">Contact Us</Button>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {SERVICE_CATEGORIES.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-light-gray/65 transition-colors hover:border-cyan-primary/20 hover:text-cyan-primary"
              >
                {category.navLabel}
              </a>
            ))}
          </div>
        </div>
      </section>

      {SERVICE_CATEGORIES.map((category, categoryIndex) => (
        <section
          key={category.id}
          id={category.id}
          className={`py-16 ${
            categoryIndex % 2 === 1 ? "bg-secondary-dark/30" : ""
          }`}
        >
          <div className="container mx-auto px-6">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                <Card className="sticky top-28 flex h-full flex-col border-cyan-primary/10 bg-black/70 lg:min-h-[38rem] xl:min-h-[42rem]">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary/70">
                    {category.pricingHint}
                  </div>
                  <h2 className="mt-4 text-4xl font-black text-white">
                    {category.name}
                  </h2>
                  <p className="mt-5 text-base leading-8 text-light-gray/68">
                    {category.description}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-light-gray/58">
                    {category.heroDescription}
                  </p>

                  <div className="mt-8 space-y-3">
                    {category.bestFor.map((point) => (
                      <div
                        key={point}
                        className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm leading-6 text-light-gray/68"
                      >
                        {point}
                      </div>
                    ))}
                  </div>

                  <Link
                    to={`/book?category=${category.id}`}
                    className="mt-auto block pt-8"
                  >
                    <Button className="w-full">
                      {category.cta} <ArrowRight size={16} />
                    </Button>
                  </Link>
                </Card>
              </motion.div>

              <div className="grid gap-6 xl:grid-cols-2">
                {category.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={{
                      ...service,
                      categoryId: category.id,
                      categoryShortName: category.shortName,
                      startingPrice: Math.min(
                        ...service.plans.map((plan) => plan.price)
                      ),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="border-white/8 bg-secondary-dark/70 p-10">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {WHY_CHOOSE_US.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-black/55 p-6"
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/70">
                    Why Us
                  </div>
                  <div className="mt-3 text-xl font-bold text-white">{item}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="pb-12 pt-4">
        <div className="container mx-auto px-6">
          <Card className="border-cyan-primary/12 bg-black/75 py-14 text-center">
            <h2 className="text-4xl font-black text-white">
              Not sure what you need exactly?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-light-gray/68">
              Talk to us and we will help shape the right category, service, and
              plan together.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(
                  "Hi TNWebRats, I need help choosing the right service."
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button>
                  <MessageCircle size={16} /> Talk To Us
                </Button>
              </a>
              <Link to="/book">
                <Button variant="outline">Open Booking Flow</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Services;
