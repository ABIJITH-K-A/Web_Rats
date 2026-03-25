import { motion } from "framer-motion";
import { ArrowRight, FolderOpenDot } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, SectionHeading } from "../../components/ui/Primitives";
import {
  FEATURED_PROJECTS,
  PORTFOLIO_GALLERY,
} from "../../data/siteData";

const Projects = () => {
  return (
    <div className="flex flex-col py-20">
      <section className="pb-18">
        <div className="container mx-auto grid items-center gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex rounded-full border border-cyan-primary/20 bg-cyan-primary/8 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary">
              Our Work
            </div>
            <h1 className="text-5xl font-black leading-[1.05] text-white md:text-6xl">
              We let the work do the talking.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-light-gray/68">
              Every project here started with a problem and ended with
              something we were genuinely proud to ship. Real briefs, real
              builds, and a lot more currently in the pipeline.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#featured-projects">
                <Button>
                  View Projects <ArrowRight size={16} />
                </Button>
              </a>
              <Link to="/book">
                <Button variant="outline">Start A Project With Us</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {PORTFOLIO_GALLERY.slice(0, 4).map((item) => (
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
                  className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">
                  {item.title}
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="featured-projects" className="bg-secondary-dark/28 py-20">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Current featured builds and active project slots.">
            Featured <span className="text-white">Projects</span>
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
                <Card className="flex h-full flex-col overflow-hidden border-white/8 bg-black/72 p-0">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-64 w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                        {project.category}
                      </div>
                      <div className="rounded-full border border-cyan-primary/18 bg-cyan-primary/8 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-primary">
                        {project.status}
                      </div>
                    </div>
                    <h3 className="mt-4 text-2xl font-black text-white">
                      {project.title}
                    </h3>
                    <p className="mt-4 flex-1 text-sm leading-7 text-light-gray/66">
                      {project.description}
                    </p>
                    <div className="mt-6 text-sm text-light-gray/56">
                      Built by: {project.builtBy}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mb-10">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Portfolio Vault
            </div>
            <h2 className="mt-3 text-4xl font-black text-white">
              Past work, snapshots, and public-ready previews
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PORTFOLIO_GALLERY.map((item) => (
              <motion.a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4 }}
                className="group overflow-hidden rounded-[26px] border border-white/8 bg-black/70"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-60 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                    <FolderOpenDot size={14} /> Google Drive
                  </div>
                  <div className="mt-3 text-lg font-bold text-white">
                    {item.title}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-10 pt-4">
        <div className="container mx-auto px-6">
          <Card className="border-cyan-primary/12 bg-black/75 py-14 text-center">
            <h2 className="text-4xl font-black text-white">
              We are always building.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-light-gray/68">
              Check back for updates, or skip the waiting and start a project
              with us now.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/book">
                <Button>
                  Start A Project <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline">See Service Options</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Projects;
