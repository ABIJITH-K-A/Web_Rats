import { motion } from 'framer-motion';
import { ExternalLink, ArrowDown, Rocket } from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import { Link } from 'react-router-dom';

const Projects = () => {
  const portfolioItems = [
    { 
      id: 1, 
      title: 'PPT Design', 
      img: '/Images/Project_Preview/Project_Preview_1.png', 
      drive: 'https://drive.google.com/drive/folders/1aO3Z-mfWXL7PXlot4fbmJ2K49iyyp8tQ?usp=sharing' 
    },
    { 
      id: 2, 
      title: 'Web Design', 
      img: '/Images/Project_Preview/Project_Preview_5.jpg', 
      drive: 'https://drive.google.com/drive/folders/1aO3Z-mfWXL7PXlot4fbmJ2K49iyyp8tQ?usp=sharing' 
    },
    { 
      id: 3, 
      title: 'Poster Design', 
      img: '/Images/Project_Preview/Project_Preview_7.png', 
      drive: 'https://drive.google.com/drive/folders/1aO3Z-mfWXL7PXlot4fbmJ2K49iyyp8tQ?usp=sharing' 
    },
    { 
      id: 4, 
      title: 'Corporate Design', 
      img: '/Images/Project_Preview/Project_Preview_2.jpg', 
      drive: 'https://drive.google.com/drive/folders/1aO3Z-mfWXL7PXlot4fbmJ2K49iyyp8tQ?usp=sharing' 
    },
    { 
      id: 5, 
      title: 'Restaurant Design', 
      img: '/Images/Project_Preview/Project_Preview_3.png', 
      drive: 'https://drive.google.com/drive/folders/1aO3Z-mfWXL7PXlot4fbmJ2K49iyyp8tQ?usp=sharing' 
    },
    { 
      id: 6, 
      title: 'Education Design', 
      img: '/Images/Project_Preview/Project_Preview_4.jpg', 
      drive: 'https://drive.google.com/drive/folders/1aO3Z-mfWXL7PXlot4fbmJ2K49iyyp8tQ?usp=sharing' 
    }
  ];

  return (
    <div className="flex flex-col py-20">
      {/* Projects Hero */}
      <section className="min-h-[80vh] flex items-center mb-20">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              Our <span className="text-cyan-primary">Portfolio</span>
            </h1>
            <p className="text-xl text-light-gray mb-10 opacity-70 leading-relaxed max-w-xl">
              Click any project image below to visit our complete portfolio folder on Google Drive. 
              We take pride in every pixel we craft.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#projects-grid">
                <Button className="group">
                  View Projects <ArrowDown className="ml-2 group-hover:translate-y-1 transition-transform" />
                </Button>
              </a>
              <Link to="/book">
                <Button variant="outline">Book Your Project</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="hidden lg:block relative"
          >
            <div className="absolute -inset-4 bg-cyan-primary/10 blur-3xl rounded-full" />
            <img 
              src="/1920X1080.png" 
              alt="Portfolio Preview" 
              className="relative rounded-3xl shadow-2xl border border-white/5"
            />
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20 bg-secondary-dark/20" id="projects-grid">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="A curated collection of our best work across various domains.">
            Portfolio Showcase
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: idx * 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98] 
                }}
                className="group relative overflow-hidden rounded-3xl aspect-[4/3] cursor-pointer border border-white/5"
              >
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                />
                <a 
                  href={item.drive} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute inset-0 bg-primary-dark/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h4 className="text-3xl font-black text-cyan-primary mb-2 tracking-tight">{item.title}</h4>
                    <p className="text-light-gray text-sm mb-6 opacity-80 italic font-mono uppercase tracking-widest text-[10px]">Vault Content // Google Drive</p>
                    <div className="mx-auto w-fit px-8 py-3 rounded-2xl border-2 border-cyan-primary text-cyan-primary flex items-center gap-3 group-hover:bg-cyan-primary group-hover:text-primary-dark transition-all font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(103, 248, 29,0.2)]">
                      <ExternalLink size={18} />
                      Access Project
                    </div>
                  </motion.div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <Card className="text-center py-20 bg-gradient-to-tr from-secondary-dark to-primary-dark border-cyan-primary/5">
             <h2 className="text-4xl md:text-5xl font-black text-cyan-primary mb-6">Ready For Your Project?</h2>
             <p className="text-xl text-light-gray opacity-70 mb-10">
               All portfolio files available in the Google Drive folder above. 
               Let's build something amazing together.
             </p>
             <Link to="/book">
               <Button className="mx-auto group">
                 Get Your Quote <Rocket className="ml-2 group-hover:animate-bounce" size={20} />
               </Button>
             </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Projects;
