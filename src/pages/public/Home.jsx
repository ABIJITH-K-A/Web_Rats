import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  FileStack,
  Package,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import BorderGlow from "../../components/ui/BorderGlow";
import { Button, Card, SectionHeading } from "../../components/ui/Primitives";
import SpotlightCard from "../../components/ui/SpotlightCard";
import {
  FEATURED_PROJECTS,
  PORTFOLIO_GALLERY,
  SERVICE_CATEGORIES,
  STATS,
  VALUE_POINTS,
} from "../../data/siteData";

const categoryIcons = {
  "presentation-design": FileStack,
  "web-development": BriefcaseBusiness,
  "fix-optimization": Wrench,
  "templates-assets": Package,
};

const categorySpotlightColors = {
  "presentation-design": "rgba(103, 248, 29, 0.18)",
  "web-development": "rgba(98, 203, 44, 0.2)",
  "fix-optimization": "rgba(103, 248, 29, 0.22)",
  "templates-assets": "rgba(98, 203, 44, 0.18)",
};

const Home = () => {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="container mx-auto grid items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-cyan-primary/20 bg-cyan-primary/8 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary">
              TNWebRats We Build
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.05] text-white md:text-7xl">
              We Build. We Design. We{" "}
              <span className="text-cyan-primary">Deliver.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-light-gray/74 md:text-xl">
              Welcome to TNWebRats - a creative studio run by two builders who
              turn ideas into polished digital experiences. Websites,
              presentations, posters, and quick-turn digital support all live in
              one place.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/services">
                <Button>
                  Explore Our Services <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/projects">
                <Button variant="outline">See Our Projects</Button>
              </Link>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Direct Collaboration",
                  detail: "You work with the actual makers.",
                  icon: Users,
                },
                {
                  label: "Fast Turnaround",
                  detail: "Deadlines stay visible from day one.",
                  icon: Clock3,
                },
                {
                  label: "Intentional Output",
                  detail: "Custom work instead of recycled templates.",
                  icon: FileStack,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/8 bg-secondary-dark/70 p-5"
                  >
                    <Icon size={18} className="mb-3 text-cyan-primary" />
                    <div className="text-sm font-semibold text-white">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-light-gray/58">
                      {item.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute left-1/2 top-6 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-primary/10 blur-3xl" />
            <BorderGlow
              backgroundColor="rgba(0,0,0,0.75)"
              glowColor="103 248 29"
              colors={["#67F81D", "#62CB2C", "#0B0C10"]}
              borderRadius={32}
              className="overflow-hidden"
            >
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <img
                  src="/Images/Icons/WebRatBannerDark.png"
                  alt="TNWebRats hero banner"
                  className="h-full min-h-[320px] w-full object-cover"
                />
                <div className="flex flex-col justify-between gap-6 bg-black/85 p-8">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/75">
                      Studio Snapshot
                    </div>
                    <h2 className="mt-3 text-3xl font-black text-white">
                      Two minds. One mission. Infinite creativity.
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-light-gray/65">
                      From student portfolios to startup launch assets, we help
                      people show up like they mean it.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {SERVICE_CATEGORIES.slice(0, 3).map((category) => (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-white/8 bg-white/3 p-4"
                      >
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/70">
                          {category.shortName}
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {category.name}
                        </div>
                        <div className="mt-1 text-sm text-light-gray/55">
                          {category.pricingHint}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/6 bg-black/45 py-9">
        <div className="container mx-auto px-6 text-center">
          <p className="text-2xl font-black italic leading-snug text-white md:text-4xl">
            "Two minds. One mission.{" "}
            <span className="text-cyan-primary">Infinite creativity.</span>"
          </p>
        </div>
      </section>

      <section className="py-28">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="TNWebRats is a two-person creative powerhouse built on skill, hustle, and a shared obsession with work that actually feels considered.">
            Who We <span className="text-white">Are</span>
          </SectionHeading>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-cyan-primary/10 bg-secondary-dark/65">
              <p className="text-lg leading-8 text-light-gray/72">
                We are not a giant agency and we are not trying to sound like
                one. We are two people who care about what gets shipped, how it
                looks, and whether it actually helps the person who asked for
                it.
              </p>
              <p className="mt-6 text-lg leading-8 text-light-gray/72">
                From students to startups, from a single poster to a full
                website, we help you show up with work that feels clear, bold,
                and ready to be seen.
              </p>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
              {STATS.map((stat) => (
                <Card
                  key={stat.label}
                  className="border-white/8 bg-black/70 text-center"
                >
                  <div className="text-4xl font-black text-cyan-primary">
                    {stat.value}
                  </div>
                  <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-light-gray/42">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary-dark/35 py-28">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="What sets TNWebRats apart is not size. It is the amount of care packed into every handoff.">
            Why Choose <span className="text-white">TNWebRats</span>
          </SectionHeading>

          <div className="grid gap-6 lg:grid-cols-3">
            {VALUE_POINTS.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Card className="h-full border-cyan-primary/10 bg-black/75">
                  <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/70">
                    0{index + 1}
                  </div>
                  <h3 className="mb-4 text-2xl font-black text-white">
                    {item.title}
                  </h3>
                  <p className="text-base leading-7 text-light-gray/68">
                    {item.summary}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="The studio runs across four sharp service lanes, each built to solve a different kind of creative need.">
            What We <span className="text-white">Do</span>
          </SectionHeading>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {SERVICE_CATEGORIES.map((category, index) => {
              const Icon = categoryIcons[category.id] || FileStack;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  <Card className="flex h-full flex-col border-white/8 bg-secondary-dark/80">
                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-primary/10 text-cyan-primary">
                      <Icon size={24} />
                    </div>
                    <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/70">
                      {category.pricingHint}
                    </div>
                    <h3 className="text-2xl font-black text-white">
                      {category.name}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-light-gray/65">
                      {category.description}
                    </p>
                    <div className="mt-6 space-y-3">
                      {category.services.slice(0, 3).map((service) => (
                        <SpotlightCard
                          key={service.id}
                          spotlightColor={
                            categorySpotlightColors[category.id] ??
                            "rgba(103, 248, 29, 0.2)"
                          }
                          className="px-4 py-3"
                        >
                          <div className="text-sm font-medium tracking-[0.01em] text-light-gray/76 transition-colors duration-300 group-hover:text-white">
                            {service.name}
                          </div>
                        </SpotlightCard>
                      ))}
                    </div>
                    <Link
                      to={`/services#${category.id}`}
                      className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-primary"
                    >
                      Explore lane <ArrowRight size={16} />
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-secondary-dark/35 py-28">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Every project here started with a problem and ended with something we were proud to put our name on.">
            Project <span className="text-white">Pulse</span>
          </SectionHeading>

          <div className="grid gap-6 lg:grid-cols-3">
            {FEATURED_PROJECTS.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
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
                      {project.title}
                    </h3>
                    <p className="mt-4 flex-1 text-sm leading-7 text-light-gray/66">
                      {project.description}
                    </p>
                    <div className="mt-6 text-sm text-light-gray/58">
                      Built by: {project.builtBy}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {PORTFOLIO_GALLERY.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="group relative overflow-hidden rounded-[24px] border border-white/8"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">
                  {item.title}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 pt-16">
        <div className="container mx-auto px-6">
          <Card hoverEffect={false} className="overflow-hidden border-cyan-primary/15 bg-gradient-to-r from-black to-secondary-dark px-8 py-16 text-center md:px-14">
            <h2 className="text-4xl font-black text-white md:text-5xl">
              Ready to build something people will actually notice?
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
    </div>
  );
};

export default Home;
