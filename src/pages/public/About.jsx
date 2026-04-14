import { motion } from "framer-motion";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, SectionHeading } from "../../components/ui/Primitives";
import {
  ABOUT_POINTS,
  CONTACT_INFO,
  SERVICE_CATEGORIES,
  STATS,
  TEAM_MEMBERS,
} from "../../data/siteData";

const About = () => {
  return (
    <div className="flex flex-col py-20">
      <section className="pb-18">
        <div className="container mx-auto grid items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex rounded-full border border-cyan-primary/20 bg-cyan-primary/8 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary">
              About TNWebRats
            </div>
            <h1 className="text-5xl font-black leading-[1.05] text-white md:text-6xl">
              Two developers. Two designers. One shared drive to{" "}
              <span className="text-gradient-brand inline-block">
                build things that actually matter.
              </span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-light-gray/68">
              TNWebRats started as a simple conversation between two friends who
              realised they were already doing the work - building things,
              designing things, solving problems - so it made sense to make it
              official.
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-light-gray/68">
              What began as side energy turned into a proper creative studio for
              students, startups, and small businesses who want quality without
              agency bloat or impersonal handoffs.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/book">
                <Button>
                  Let's Talk <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline">See What We Build</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
          >
            <Card className="border-cyan-primary/10 bg-black/72 p-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
                Brand Story
              </div>
              <h2 className="mt-4 text-3xl font-black text-white">
                The name is bold. The work is bolder.
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/8 bg-white/3 p-5 text-center"
                  >
                    <div className="text-3xl font-black text-cyan-primary">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="bg-secondary-dark/28 py-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <Card className="border-white/8 bg-black/72">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/72">
                What We Are Building
              </div>
              <div className="mt-6 space-y-4">
                {ABOUT_POINTS.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 text-sm leading-7 text-light-gray/68"
                  >
                    <Sparkles
                      size={16}
                      className="mt-1 shrink-0 text-cyan-primary"
                    />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/8 bg-secondary-dark/72">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/72">
                Closing Note
              </div>
              <h2 className="mt-4 text-3xl font-black text-white">
                TNWebRats is not just a service - it is a creative duo that
                genuinely loves the work.
              </h2>
              <p className="mt-5 text-base leading-8 text-light-gray/68">
                If you have an idea, a deadline, or even a rough thought you
                want made real, we are happy to help shape it. The goal is not
                to oversell the process. The goal is to build something solid
                with you.
              </p>

              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {SERVICE_CATEGORIES.slice(0, 4).map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-white/8 bg-black/55 p-4"
                  >
                    <div className="font-semibold text-white">{category.name}</div>
                    <div className="mt-2 text-sm text-light-gray/58">
                      {category.pricingHint}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="The people behind the pixels.">
            Meet The <span className="text-white">Studio</span>
          </SectionHeading>

          <div className="grid gap-8 lg:grid-cols-2">
            {TEAM_MEMBERS.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Card className="h-full border-white/8 bg-black/72">
                  <div className="flex flex-col gap-8 md:flex-row md:items-start">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-32 w-32 rounded-[28px] border border-cyan-primary/15 bg-secondary-dark/70 object-cover p-3"
                    />
                    <div className="flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                        {member.role}
                      </div>
                      <h3 className="mt-3 text-3xl font-black text-white">
                        {member.name}
                      </h3>
                      <p className="mt-4 text-base leading-8 text-light-gray/68">
                        {member.intro}
                      </p>

                      <div className="mt-6 grid gap-3">
                        {member.skills.map((skill) => (
                          <div
                            key={skill}
                            className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-light-gray/72"
                          >
                            {skill}
                          </div>
                        ))}
                      </div>

                      <a
                        href={`mailto:${CONTACT_INFO.email}`}
                        className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-primary"
                      >
                        <Mail size={16} /> Contact via studio email
                      </a>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-10 pt-4">
        <div className="container mx-auto px-6">
          <Card className="border-cyan-primary/12 bg-black/75 py-14 text-center">
            <h2 className="text-4xl font-black text-white">
              If you have got an idea, we are ready to help build it.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-light-gray/68">
              Start from booking if you know what you need. Start from services
              if you want to compare options first.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/book">
                <Button>
                  Let's Talk <ArrowRight size={16} />
                </Button>
              </Link>
              <a href={`mailto:${CONTACT_INFO.email}`}>
                <Button variant="outline">Email The Studio</Button>
              </a>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default About;
