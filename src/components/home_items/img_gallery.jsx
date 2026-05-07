import React from 'react';  
import { motion } from 'framer-motion';

const images = [
  { id: 1, src: '/Images/Project_Preview/Project_Preview_1.png', alt: 'Rynix Creative Work 1' },
  { id: 2, src: '/Images/Project_Preview/Project_Preview_2.jpg', alt: 'Rynix Creative Work 2' },
  { id: 3, src: '/Images/Project_Preview/Project_Preview_3.png', alt: 'Rynix Creative Work 3' },
  { id: 4, src: '/Images/Project_Preview/Project_Preview_4.jpg', alt: 'Rynix Creative Work 4' },
];

const ImageGallery = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section className="w-full py-20 overflow-hidden bg-transparent">
      <div className="container mx-auto px-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {images.map((img) => (
            <motion.div
              key={img.id}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="relative group"
            >
              {/* Glassy Frame */}
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2.5 backdrop-blur-md shadow-2xl transition-all duration-500 group-hover:border-cyan-primary/30 group-hover:bg-white/10">
                
                {/* Image Container */}
                <div className="relative h-72 w-full overflow-hidden rounded-[1.6rem]">
                  <img 
                    src={img.src} 
                    alt={img.alt} 
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />
                  
                  {/* Reflection Effect */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Hover Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="h-px w-12 bg-cyan-primary mb-3" />
                    <h4 className="text-white font-black text-lg tracking-tight uppercase">Featured Work</h4>
                    <p className="text-cyan-primary/80 text-[10px] font-mono tracking-widest uppercase mt-1">Project 0{img.id}</p>
                  </div>
                </div>

                {/* Outer Glass Shine */}
                <div className="absolute -inset-full top-0 block w-1/2 -skew-x-12 z-5 group-hover:animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ImageGallery;