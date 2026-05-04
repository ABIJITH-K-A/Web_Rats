
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import BackButton from "../../components/ui/BackButton";
import ServiceCard from "../../components/ui/ServiceCard";
import { Button, Card } from "../../components/ui/Primitives";
import { ScrollReveal, StaggerContainer, StaggerItem, GradientText } from "../../components/ui/ScrollReveal";
import {
  getCategoryById,
  getServiceById,
  SERVICE_LIST,
} from "../../data/siteData";

const formatPrice = (price) => `Rs ${price.toLocaleString("en-IN")}`;

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const service = getServiceById(serviceId);

  if (!service) {
    return (
      <div className="py-28 text-center">
        <h1 className="text-4xl font-black text-white">Service not found</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-light-gray/65">
          The service you opened is not part of the current public catalog.
        </p>
        <BackButton to="/services" label="Back to services" className="mt-8" />
      </div>
    );
  }

  const category = getCategoryById(service.categoryId);
  const relatedServices = SERVICE_LIST.filter(
    (item) => item.categoryId === service.categoryId && item.id !== service.id
  );

  return (
    <div className="flex flex-col py-20">
      <section className="pb-14">
        <div className="container mx-auto px-6">
          <BackButton to="/services" label="Back to services" className="mb-8" />

          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <ScrollReveal direction="up" delay={0.1}>
              <div className="mb-5 inline-flex rounded-full border border-cyan-primary/18 bg-cyan-primary/8 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary">
                {category?.name}
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={0.2}>
              <h1 className="text-5xl font-black leading-[1.05] text-white md:text-6xl">
                <GradientText>{service.name}</GradientText>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={0.3}>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-light-gray/70">
                {service.summary}
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={`/book?category=${service.categoryId}&service=${service.id}`}
                >
                  <Button>
                    Book This Service <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to={`/book?category=${service.categoryId}`}>
                  <Button variant="outline">Compare Within Category</Button>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.5}>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <Card className="border-white/8 bg-secondary-dark/70">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/70">
                    Best For
                  </div>
                  <p className="mt-3 text-base leading-7 text-light-gray/68">
                    {service.bestFor}
                  </p>
                </Card>
                <Card className="border-white/8 bg-secondary-dark/70">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/70">
                    Starting Price
                  </div>
                  <div className="mt-3 text-3xl font-black text-cyan-primary">
                    {formatPrice(service.startingPrice)}
                  </div>
                  <p className="mt-2 text-sm text-light-gray/55">
                    Plans below scale from starter to premium delivery.
                  </p>
                </Card>
              </div>
            </ScrollReveal>
          </div>

          <div>
              <div className="overflow-hidden rounded-[32px] border border-white/8 bg-black/70">
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-[420px] w-full object-cover"
                />
              </div>
          </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <Card className="border-cyan-primary/10 bg-black/72">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/70">
                What You Get
              </div>
              <div className="mt-6 space-y-4">
                {service.deliverables.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm leading-7 text-light-gray/68"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-1 shrink-0 text-cyan-primary"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-3">
              {service.plans.map((plan) => (
                <div key={plan.id}>
                  <Card
                    className={`flex h-full flex-col border-white/8 bg-secondary-dark/75 ${
                      plan.label === "Standard"
                        ? "ring-1 ring-cyan-primary/30"
                        : ""
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                      {plan.badge}
                    </div>
                    <h2 className="mt-3 text-3xl font-black text-white">
                      {plan.label}
                    </h2>
                    <div className="mt-4 text-4xl font-black text-cyan-primary">
                      {formatPrice(plan.price)}
                    </div>
                    <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                      Delivery {plan.delivery}
                    </div>
                    <div className="mt-8 space-y-4">
                      {plan.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-3 text-sm leading-7 text-light-gray/68"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-1 shrink-0 text-cyan-primary"
                          />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      to={`/book?category=${service.categoryId}&service=${service.id}&plan=${plan.id}`}
                      className="mt-8"
                    >
                      <Button
                        variant={plan.label === "Standard" ? "primary" : "outline"}
                        className="w-full"
                      >
                        Choose {plan.label}
                      </Button>
                    </Link>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {relatedServices.length > 0 && (
        <section className="bg-secondary-dark/28 py-20">
          <div className="container mx-auto px-6">
            <div className="mb-10">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/70">
                Same Category
              </div>
              <h2 className="mt-3 text-4xl font-black text-white">
                Related services in {category?.name}
              </h2>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {relatedServices.map((item) => (
                <ServiceCard key={item.id} service={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ServiceDetail;
