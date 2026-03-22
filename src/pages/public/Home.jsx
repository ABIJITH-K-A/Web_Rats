import { motion } from 'framer-motion';
import { ArrowRight, Laptop, FileText, Image as ImageIcon, Rocket } from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import { Link } from 'react-router-dom';

const Home = () => {
  const services = [
    {
      title: 'Websites',
      icon: <Laptop size={32} />,
      desc: 'Modern, responsive websites that perform and convert. From landing pages to full-scale web apps.'
    },
    {
      title: 'PPTs',
      icon: <FileText size={32} />,
      desc: 'Stunning presentations that captivate any audience. Custom layouts, icons, and dynamic transitions.'
    },
    {
      title: 'Posters',
      icon: <ImageIcon size={32} />,
      desc: 'Bold graphics and posters that demand attention. Perfect for events, social media, or branding.'
    }
  ];

  const portfolioItems = [
    { id: 1, title: 'Project 1', img: '/Images/Project_Preview/Project_Preview_1.png' },
    { id: 2, title: 'Project 2', img: '/Images/Project_Preview/Project_Preview_2.jpg' },
    { id: 3, title: 'Project 3', img: '/Images/Project_Preview/Project_Preview_3.png' },
    { id: 4, title: 'Project 4', img: '/Images/Project_Preview/Project_Preview_4.jpg' },
    { id: 5, title: 'Project 5', img: '/Images/Project_Preview/Project_Preview_5.jpg' },
    { id: 6, title: 'Project 6', img: '/Images/Project_Preview/Project_Preview_6.png' }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center relative overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              Design That <br />
              <span className="text-cyan-primary drop-shadow-[0_0_15px_rgba(103, 248, 29,0.3)]">Delivers!</span>
            </h1>
            <p className="text-xl text-light-gray mb-10 opacity-80 leading-relaxed max-w-xl">
              Stunning PPTs • Bold Posters • Modern Websites. From student projects to business branding,
              we create custom visuals that grab attention and get results.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/book">
                <Button className="group">
                  Book Service <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline">View Services</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              y: [0, -20, 0]
            }}
            transition={{
              duration: 1,
              ease: 'easeOut',
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-cyan-primary/20 blur-3xl rounded-full" />
            <img
              src="/Images/Icons/WebRatBanner.png"
              alt="Hero Visual"
              className="relative rounded-3xl shadow-2xl border border-white/10"
            />
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-secondary-dark/30">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Professional digital services tailored for students and creators.">
            What We Create
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Link to={`/services#${service.title === 'PPTs' ? 'ppt' : service.title.toLowerCase().slice(0, -1)}`}>
                  <Card className="flex flex-col items-center text-center group h-full cursor-pointer hover:border-cyan-primary/30 transition-all">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-primary to-teal-primary flex items-center justify-center text-primary-dark mb-6 group-hover:rotate-12 transition-transform duration-500">
                      {service.icon}
                    </div>
                    <h4 className="text-2xl font-bold text-cyan-primary mb-4">{service.title}</h4>
                    <p className="text-light-gray opacity-70 leading-relaxed">{service.desc}</p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
     

      {/* CTA Section */}
      <section className="py-32 mb-20">
        <div className="container mx-auto px-6">
          <Card hoverEffect={false} className="bg-gradient-to-r from-secondary-dark to-primary-dark border-cyan-primary/20 py-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-primary/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <h2 className="text-5xl font-black text-cyan-primary mb-6">Ready to Create?</h2>
              <p className="text-xl text-light-gray max-w-2xl mx-auto opacity-80 mb-12 leading-relaxed">
                Whether it's a presentation for tomorrow or a website for your brand,
                we're ready to bring your vision to life. Fast, professional, and built to impress.
              </p>
              <Link to="/book">
                <Button className="mx-auto group" variant="primary">
                  Get Started Today <Rocket className="ml-2 group-hover:animate-bounce" size={20} />
                </Button>
              </Link>
            </motion.div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
