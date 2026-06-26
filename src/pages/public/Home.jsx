import { useRef } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileStack,
  Package,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, SectionHeading } from "../../components/ui/Primitives";
import { ScrollReveal, StaggerContainer, StaggerItem, GradientText, GlowText, AnimatedCounter, AnimatedText } from "../../components/ui/ScrollReveal";
import backgroundTheme from "../../config/backgroundTheme";
import {
  FEATURED_PROJECTS,
  HORIZONTAL_PROJECTS,
  SERVICE_CATEGORIES,
  STATS,
  VALUE_POINTS,
} from "../../data/siteData";
import ImageGallery from "../../components/home_items/img_gallery";

const categoryIcons = {
  "presentation-design": FileStack,
  "web-development": BriefcaseBusiness,
  "fix-optimization": Wrench,
  "templates-assets": Package,
};

const Home = () => {
  const heroRef = useRef(null);
  const heroWallpaperStyle = {
    backgroundImage: `${backgroundTheme.homeHero.overlay}`,
    backgroundPosition: backgroundTheme.homeHero.position,
    backgroundSize: backgroundTheme.homeHero.size,
    backgroundRepeat: backgroundTheme.homeHero.repeat ?? "no-repeat",
  };

  return (
    <div className="flex flex-col">
      
        <div className="w-full px-4 md:px-6 py-4">
          <div className="relative overflow-hidden rounded-3xl border-[6px] border-black shadow-2xl">
            <img
              src="/Images/Icons/landscape.png"
              alt="Rynix Landscape"
              className="w-full h-auto"
            />
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(0,0,0,0.6)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
          </div>
        </div>
      
      <section ref={heroRef} className="relative isolate overflow-hidden py-20 md:py-28">
        <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-[-8%] bg-no-repeat opacity-40"
            style={heroWallpaperStyle}
          />
          <div className="absolute inset-0 bg-black opacity-30" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-primary-dark/45 to-primary-dark" />
        </div>
        <ImageGallery/>
        <div className="container relative z-10 mx-auto flex min-h-[82vh] flex-col items-center justify-center gap-14 px-6 text-center md:min-h-[96vh]">
          <div className="flex flex-col items-center">
            
              <h1 className="max-w-4xl text-5xl font-black leading-[1.05] text-white md:text-7xl text-center">
                we{" "}<GradientText className="inline-block">build</GradientText>, we{" "}<GradientText className="inline-block">design</GradientText>, we{" "}
                <GradientText className="inline-block">deliver.</GradientText>
              </h1>
            

            
              <p className="mt-7 max-w-2xl text-lg leading-8 text-light-gray/74 md:text-xl text-center">
                we build, we design, we deliver.
                Crafted by two dedicated builders,
                we transform ideas into refined digital
                experiences — from high-performing websites
                to polished presentations and visual assets,
                all delivered with precision and speed.
              </p>
            

            
              <div className="mt-20 flex flex-wrap justify-center gap-8">
                <Link to="/services">
                  <Button variant="galaxy" className="min-w-[224px]">
                    Explore Our Services <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/projects">
                  <Button variant="galaxy" className="min-w-[224px]">See Our Projects <ArrowRight size={18} /></Button>
                </Link>
              </div>
            
          </div>
        </div>
      </section>

      <ScrollReveal>
      <section className="border-y border-white/6 bg-black/45 py-9">
        <div className="container mx-auto px-6 text-center">
          
            <p className="text-2xl font-black italic leading-snug text-white md:text-4xl">
              "Two minds. One mission.{" "}
              <GlowText color="accent">Infinite creativity.</GlowText>"
            </p>
          
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal>
      <section className="py-28">
        <div className="container mx-auto px-6">
          
            <SectionHeading subtitle="Rynix is a two-person creative powerhouse built on skill, hustle, and a shared obsession with work that actually feels considered.">
              Who We <GlowText>Are</GlowText>
            </SectionHeading>
          

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-cyan-primary/10 bg-secondary-dark/65">
              <p className="text-lg leading-8 text-light-gray/72">
                We're not a large agency — and we don't aim to be.
                We're two builders who care deeply about what we ship,
                how it looks, and whether it truly delivers value to the
                people we work with.
              </p>
              <p className="mt-6 text-lg leading-8 text-light-gray/72">
                From students to startups —
                from a single poster to a complete website
                — we create work that is clear, bold, and built to be seen.
              </p>
            </Card>

            <StaggerContainer className="grid gap-5 sm:grid-cols-2">
              {STATS.map((stat) => (
                <StaggerItem key={stat.label}>
                <Card
                  className="border-white/8 bg-black/70 text-center"
                >
                  <div className="text-4xl font-black text-cyan-primary">
                    {stat.value}
                  </div>
                  <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-light-gray/42">
                    {stat.label}
                  </div>
                </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal>
      <section className="bg-secondary-dark/35 py-28">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="What sets Rynix apart is not size. It is the amount of care packed into every handoff.">
            Why Choose <span className="text-white">Rynix</span>
          </SectionHeading>

          <StaggerContainer className="grid gap-6 lg:grid-cols-3">
            {VALUE_POINTS.map((item) => (
              <StaggerItem key={item.id}>
              <Card className="h-full border-cyan-primary/10 bg-black/75">
                <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/70">
                  0{VALUE_POINTS.indexOf(item) + 1}
                </div>
                <h3 className="mb-4 text-2xl font-black text-white">
                  <AnimatedText text={item.title} stagger={0.04} blur={4} y={12} />
                </h3>
                <p className="text-base leading-7 text-light-gray/68">
                  {item.summary}
                </p>
              </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal>
      <section className="py-28">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="The studio runs across four sharp service lanes, each built to solve a different kind of creative need.">
            What We <span className="text-white">Do</span>
          </SectionHeading>

          <StaggerContainer className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {SERVICE_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.id] || FileStack;

              return (
                <StaggerItem key={category.id}>
                <Card className="flex h-full flex-col border-white/8 bg-secondary-dark/80">
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-primary/10 text-cyan-primary">
                    <Icon size={24} />
                  </div>
                  <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/70">
                    {category.pricingHint}
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    <AnimatedText text={category.name} stagger={0.04} blur={4} y={12} />
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-light-gray/65">
                    {category.description}
                  </p>
                  <div className="mt-6 space-y-3">
                    {category.services.slice(0, 3).map((service) => (
                      <div
                        key={service.id}
                        className="px-4 py-3 rounded-xl border border-white/8 bg-black/55 hover:bg-black/72 hover:border-cyan-primary/24 transition-colors duration-300"
                      >
                        <div className="text-sm font-medium tracking-[0.01em] text-light-gray/76 hover:text-white">
                          {service.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={`/services#${category.id}`}
                    className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-primary"
                  >
                    Explore lane <ArrowRight size={16} />
                  </Link>
                </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal>
      <section className="bg-secondary-dark/35 py-28">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Every project here started with a problem and ended with something we were proud to put our name on.">
            Project <span className="text-white">Pulse</span>
          </SectionHeading>

          <StaggerContainer className="grid gap-6 lg:grid-cols-3">
            {FEATURED_PROJECTS.map((project) => (
              <StaggerItem key={project.id}>
              <Card className="flex h-full flex-col overflow-hidden border-white/8 bg-black/70 p-0">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-60 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/70">
                      {project.category}
                    </div>
                    <div className="rounded-full border border-cyan-primary/20 bg-cyan-primary/8 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-primary">
                      {project.status}
                    </div>
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-white">
                    <AnimatedText text={project.title} stagger={0.04} blur={4} y={12} />
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-light-gray/66">
                    {project.description}
                  </p>
                  <div className="mt-6 text-sm text-light-gray/58">
                    Built by: {project.builtBy}
                  </div>
                </div>
              </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <StaggerContainer className="grid gap-6 lg:grid-cols-2 place-items-center mt-6">
            {HORIZONTAL_PROJECTS.map((project) => (
              <StaggerItem key={project.id}>
              <div className="w-full">
                <Card className="relative overflow-hidden border-white/8 bg-black/70 p-0 h-64 group">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary mb-2">
                      {project.category}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">
                      <AnimatedText text={project.title} stagger={0.04} blur={4} y={12} />
                    </h3>
                    <p className="text-sm leading-relaxed text-white/70 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </Card>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
      </ScrollReveal>

      <ImageGallery />

      <ScrollReveal>
      <section className="pb-24 pt-16">
        <div className="container mx-auto px-6">
          <Card hoverEffect={false} className="overflow-hidden border-cyan-primary/15 bg-gradient-to-r from-black to-secondary-dark px-8 py-16 text-center md:px-14">
            <h2 className="text-4xl font-black text-white md:text-5xl">
              Ready to build something people will actually <span className="text-gradient-brand inline-block">notice</span> ?
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-light-gray/70">
              Start with the service lane that fits your goal, or book directly
              and tell us what you are trying to make real.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/services">
                <Button>
                  Explore Our Services <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/projects">
                <Button variant="outline">See Our Projects</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
      </ScrollReveal>
    </div>
  );
};

export default Home;
