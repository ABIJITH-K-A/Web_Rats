import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Laptop, FileText, Image as ImageIcon, ArrowRight, ArrowLeft, 
  Check, Lock, Smartphone, Send, Calendar, Folder, Link as LinkIcon, 
  AlignLeft, User, Mail, ShieldCheck, Rocket, Trash2
} from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import WizardProgress from '../../components/ui/WizardProgress';
import Stepper, { Step } from '../../components/ui/Stepper';
import BorderGlow from '../../components/ui/BorderGlow';
import { SERVICE_MAP, CONTACT_INFO } from '../../data/siteData';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BookService = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service');
  
  const [step, setStep] = React.useState(initialServiceId && SERVICE_MAP[initialServiceId] ? 2 : 1);
  const [direction, setDirection] = React.useState(1);
  const [selectedService, setSelectedService] = React.useState(initialServiceId && SERVICE_MAP[initialServiceId] ? SERVICE_MAP[initialServiceId] : null);
  const [selectedPackage, setSelectedPackage] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    projectName: '',
    deadline: '',
    driveLink: '',
    instructions: '',
    // Dynamic fields
    slides: '',
    posterSize: '',
    posterType: '',
    pages: '',
    businessType: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderConfirmed, setOrderConfirmed] = React.useState(false);
  const [orderId, setOrderId] = React.useState('');

  const steps = ['Service', 'Package', 'Details', 'Confirm'];

  const services = [
    { id: 'ppt', name: 'PowerPoint Presentations', icon: <FileText />, desc: 'Slides that win pitches & pass exams' },
    { id: 'poster', name: 'Posters & Graphics', icon: <ImageIcon />, desc: 'Designs that get noticed everywhere' },
    { id: 'website', name: 'Website Development', icon: <Laptop />, desc: 'Websites that work while you sleep' },
  ];

  const handleNext = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleServiceSelect = (id) => {
    setSelectedService(SERVICE_MAP[id]);
    setSelectedPackage(null);
    handleNext();
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    handleNext();
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { name, email, phone, projectName, deadline, instructions } = formData;
    const baseValid = name && email && phone && projectName && deadline && instructions?.length >= 20;
    
    if (selectedService?.id === 'ppt') return baseValid && formData.slides;
    if (selectedService?.id === 'poster') return baseValid && formData.posterSize && formData.posterType;
    if (selectedService?.id === 'website') return baseValid && formData.pages;
    
    return baseValid;
  };

  const handleSubmit = async (method) => {
    setIsSubmitting(true);
    try {
      const orderData = {
        ...formData,
        service: selectedService?.name || 'Unknown',
        serviceId: selectedService?.id || 'unknown',
        package: selectedPackage?.label || 'Unknown',
        price: selectedPackage?.price || 0,
        status: 'pending',
        userId: user?.uid || 'guest',
        paymentMethod: method,
        createdAt: serverTimestamp(),
      };

      // Clean up irrelevant dynamic fields before saving
      if (selectedService.id !== 'ppt') delete orderData.slides;
      if (selectedService.id !== 'poster') {
        delete orderData.posterSize;
        delete orderData.posterType;
      }
      if (selectedService.id !== 'website') {
        delete orderData.pages;
        delete orderData.businessType;
      }

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Create notification for admin
      await addDoc(collection(db, 'notifications'), {
        recipientId: 'admin', // Matches staff roles in DashboardContext
        title: 'New Order Received',
        message: `${orderData.name} just booked a ${orderData.package} ${selectedService.shortName}.`,
        type: 'order',
        orderId: docRef.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      if (method === 'whatsapp') {
        const text = `Hi TN WEB RATS! I'd like to book a project.\n\nService: ${orderData.service}\nPackage: ${orderData.package}\nPrice: ₹${orderData.price}\nProject: ${orderData.projectName}\nDeadline: ${orderData.deadline}\nOrder ID: ${docRef.id}`;
        window.open(`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
      }

      setOrderId(docRef.id);
      setOrderConfirmed(true);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 500 : -500, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 500 : -500, opacity: 0 }),
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <motion.div
           initial={{ scale: 0.9, opacity: 0, y: 30 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="max-w-xl mx-auto"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-24 h-24 rounded-full border-2 border-cyan-primary flex items-center justify-center text-cyan-primary mx-auto mb-8 shadow-[0_0_50px_rgba(102,252,241,0.4)] bg-cyan-primary/10"
          >
            <Check size={40} />
          </motion.div>
          <h2 className="text-5xl font-black text-cyan-primary mb-4 tracking-tighter text-glow uppercase italic">Protocol <span className="not-italic text-white underline decoration-cyan-primary/30">Locked</span></h2>
          <p className="text-lg text-light-gray opacity-70 mb-10 leading-relaxed">
            Your booking is locked in. We'll get started right away!<br />
            Questions? Contact us at <span className="text-white font-bold">{CONTACT_INFO.whatsappDisplay}</span>
          </p>
          <div className="bg-secondary-dark p-6 rounded-2xl border border-cyan-primary/20 font-mono text-cyan-primary tracking-widest mb-12">
            ORDER ID: {orderId.toUpperCase()}
          </div>
          <Link to="/" className="text-cyan-primary font-mono text-sm uppercase tracking-widest hover:underline">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-12 pb-32">
      <SectionHeading subtitle="Choose a service · pick your plan · done in minutes">
        Book Your <span>Project</span>
      </SectionHeading>

      <Stepper 
        currentStep={step} 
        onStepChange={(s, d) => {
          setStep(s);
          if (d !== undefined) setDirection(d);
        }}
        showButtons={false}
        className="min-h-[600px]"
      >
        {/* Step 1: Service */}
        <Step>
          <div className="space-y-8">
            <div className="text-xs font-mono text-cyan-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-10 overflow-hidden">
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
              <span>Choose your service</span>
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((s) => (
                <Card key={s.id} onClick={() => handleServiceSelect(s.id)} className="text-center cursor-pointer hover:border-cyan-primary/40 group relative overflow-hidden">
                   <div className="w-16 h-16 rounded-2xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary mx-auto mb-6 group-hover:scale-110 transition-transform group-hover:bg-cyan-primary group-hover:text-primary-dark">
                     {s.icon}
                   </div>
                   <h4 className="text-lg font-bold mb-2 group-hover:text-cyan-primary transition-colors">{s.name}</h4>
                   <p className="text-xs opacity-50 mb-8">{s.desc}</p>
                   <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-primary/40 group-hover:text-cyan-primary transition-colors">
                     Select <ArrowRight className="inline-block" size={12} />
                   </div>
                </Card>
              ))}
            </div>
          </div>
        </Step>

        {/* Step 2: Package */}
        <Step>
          <div className="space-y-8">
            <button onClick={handleBack} className="flex items-center gap-2 text-xs font-mono text-light-gray/40 hover:text-cyan-primary transition-colors mb-4 uppercase tracking-widest">
              <ArrowLeft size={14} /> Back to services
            </button>
            <div className="text-xs font-mono text-cyan-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-10">
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
              <span>Choose your plan for {selectedService?.shortName}</span>
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {selectedService?.packages.map((pkg) => {
                const isPopular = pkg.badge === 'Most Popular';
                const CardContent = (
                  <div className="p-8 h-full flex flex-col items-center text-center">
                    <div className="text-[10px] font-mono text-cyan-primary mb-4 opacity-70 bg-cyan-primary/10 px-3 py-1 rounded-full self-center">
                      {pkg.badge}
                    </div>
                    <h4 className="text-xl font-bold mb-2">{pkg.label}</h4>
                    <div className="text-3xl font-black text-cyan-primary mb-1">₹{pkg.price.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] font-mono text-light-gray/40 mb-6 italic uppercase tracking-widest border-t border-white/5 pt-4">
                      {pkg.delivery} Delivery
                    </div>
                    <ul className="space-y-3 flex-grow mb-8 w-full">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="text-xs text-light-gray/60 flex items-start gap-2 text-left">
                          <Check size={12} className="text-teal-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant={isPopular ? 'primary' : 'outline'} className="py-2 text-sm w-full mt-auto">
                      Select {isPopular && <ArrowRight size={14} className="ml-2" />}
                    </Button>
                  </div>
                );

                return isPopular ? (
                  <BorderGlow 
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    className="cursor-pointer transition-all duration-300 transform scale-105 z-10"
                    backgroundColor="#0B0C10"
                    glowColor="102 252 241"
                    colors={['#66FCF1', '#45A29E', '#1F2833']}
                    borderRadius={24}
                  >
                    {CardContent}
                  </BorderGlow>
                ) : (
                  <Card 
                    key={pkg.id} 
                    onClick={() => handlePackageSelect(pkg)} 
                    className="flex flex-col h-full cursor-pointer hover:border-cyan-primary/40 group p-0 overflow-hidden"
                  >
                    {CardContent}
                  </Card>
                );
              })}
            </div>
          </div>
        </Step>

        {/* Step 3: Details */}
        <Step>
          <div className="space-y-8">
            <div className="text-xs font-mono text-cyan-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-10">
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
              <span>Project details: {selectedService?.shortName} - {selectedPackage?.label}</span>
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
            </div>
            
            <Card className="bg-secondary-dark/50 border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Full Name *</label>
                   <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                     <input 
                       name="name" value={formData.name} onChange={handleFormChange}
                       className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                       placeholder="John Doe" 
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Email *</label>
                   <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                     <input 
                       name="email" value={formData.email} onChange={handleFormChange}
                       className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                       placeholder="john@example.com" 
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">WhatsApp / Phone *</label>
                   <div className="relative">
                     <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                     <input 
                       name="phone" value={formData.phone} onChange={handleFormChange}
                       className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                       placeholder="+91 98765 43210" 
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Project Name *</label>
                   <div className="relative">
                     <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                     <input 
                       name="projectName" value={formData.projectName} onChange={handleFormChange}
                       className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                       placeholder="e.g. Science Fair PPT" 
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Deadline *</label>
                   <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                     <input 
                       type="date" name="deadline" value={formData.deadline} onChange={handleFormChange}
                       className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Drive Link (Optional)</label>
                   <div className="relative">
                     <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                     <input 
                       name="driveLink" value={formData.driveLink} onChange={handleFormChange}
                       className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                       placeholder="Reference folder link" 
                     />
                   </div>
                </div>

                {/* Dynamic Fields Section */}
                {selectedService?.id === 'ppt' && (
                  <div className="col-span-full pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-cyan-primary">Number of Slides *</label>
                      <input 
                        name="slides" type="number" value={formData.slides} onChange={handleFormChange}
                        className="w-full bg-primary-dark border border-cyan-primary/20 rounded-xl px-6 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                        placeholder="e.g. 15" 
                      />
                    </div>
                  </div>
                )}

                {selectedService?.id === 'poster' && (
                  <div className="col-span-full pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-cyan-primary">Poster Size *</label>
                      <select 
                        name="posterSize" value={formData.posterSize} onChange={handleFormChange}
                        className="w-full bg-primary-dark border border-cyan-primary/20 rounded-xl px-6 py-3 focus:border-cyan-primary outline-none text-sm transition-colors"
                      >
                        <option value="">Select Size</option>
                        <option value="A4">A4 (Standard)</option>
                        <option value="A3">A3 (Large)</option>
                        <option value="Social">Social Media (Square/Story)</option>
                        <option value="Custom">Custom Size</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-cyan-primary">Design Type *</label>
                      <select 
                        name="posterType" value={formData.posterType} onChange={handleFormChange}
                        className="w-full bg-primary-dark border border-cyan-primary/20 rounded-xl px-6 py-3 focus:border-cyan-primary outline-none text-sm transition-colors"
                      >
                        <option value="">Select Type</option>
                        <option value="Academic">Academic / Research</option>
                        <option value="Event">Event / Party</option>
                        <option value="Business">Business / Corporate</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedService?.id === 'website' && (
                  <div className="col-span-full pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-cyan-primary">Est. Pages *</label>
                      <input 
                        name="pages" type="number" value={formData.pages} onChange={handleFormChange}
                        className="w-full bg-primary-dark border border-cyan-primary/20 rounded-xl px-6 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                        placeholder="e.g. 1 (Landing Page) or 5+" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-cyan-primary">Business Type</label>
                      <input 
                        name="businessType" value={formData.businessType} onChange={handleFormChange}
                        className="w-full bg-primary-dark border border-cyan-primary/20 rounded-xl px-6 py-3 focus:border-cyan-primary outline-none text-sm transition-colors" 
                        placeholder="e.g. E-commerce, Portfolio" 
                      />
                    </div>
                  </div>
                )}
                <div className="col-span-full space-y-2">
                   <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Special Instructions (min 20 chars) *</label>
                   <div className="relative">
                     <AlignLeft className="absolute left-4 top-4 text-cyan-primary/30" size={18} />
                     <textarea 
                       name="instructions" value={formData.instructions} onChange={handleFormChange}
                       className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-4 focus:border-cyan-primary outline-none text-sm transition-colors min-h-[120px]" 
                       placeholder="Describe your project style, audience..." 
                     />
                   </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-between items-center mt-12">
               <button onClick={handleBack} className="text-xs font-mono text-light-gray/30 hover:text-cyan-primary transition-colors uppercase tracking-widest">
                 Back
               </button>
               <Button onClick={handleNext} disabled={!validateForm()}>
                 Review Order <ArrowRight size={18} />
               </Button>
            </div>
          </div>
        </Step>

        {/* Step 4: Confirm */}
        <Step>
          <div className="space-y-8">
            <div className="text-xs font-mono text-cyan-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-10">
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
              <span>Review & Confirm</span>
              <div className="h-[1px] flex-grow bg-cyan-primary/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8">
                <h5 className="text-xs font-mono text-cyan-primary mb-6 uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                  <Rocket size={14} /> Order Summary
                </h5>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-40">Service</span>
                    <span className="font-bold">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-40">Package</span>
                    <span className="font-bold">{selectedPackage?.label}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-4 border-t border-white/5">
                    <span className="opacity-40 uppercase tracking-widest text-[10px]">Total Payable</span>
                    <span className="text-2xl font-black text-cyan-primary italic">₹{selectedPackage?.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <h5 className="text-xs font-mono text-cyan-primary mb-6 uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                  <User size={14} /> Contact & Project
                </h5>
                <div className="space-y-4 text-xs">
                   <div className="flex justify-between">
                     <span className="opacity-40">Name</span>
                     <span>{formData.name}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="opacity-40">Phone</span>
                     <span>{formData.phone}</span>
                   </div>
                   <div className="flex justify-between border-t border-white/5 pt-4">
                     <span className="opacity-40">Project</span>
                     <span className="font-bold truncate max-w-[150px]">{formData.projectName}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="opacity-40">Deadline</span>
                     <span>{formData.deadline}</span>
                   </div>
                </div>
              </Card>
            </div>

            <div className="p-6 bg-cyan-primary/5 rounded-2xl border border-cyan-primary/10 flex gap-4 items-start">
              <ShieldCheck className="text-cyan-primary shrink-0" size={24} />
              <p className="text-xs text-light-gray opacity-60 leading-relaxed">
                I agree that TN WEB RATS may contact me on the details provided. 
                I understand that advance payment is required before work begins.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 bg-secondary-dark/50 p-8 rounded-3xl border border-white/5">
               <button onClick={handleBack} className="text-xs font-mono text-light-gray/30 hover:text-cyan-primary transition-colors uppercase tracking-widest">
                 Edit Details
               </button>
               <div className="flex gap-4 w-full md:w-auto">
                 <Button 
                   variant="outline" 
                   className="border-teal-primary text-teal-primary hover:bg-teal-primary/10 w-full"
                   onClick={() => handleSubmit('whatsapp')}
                   disabled={isSubmitting}
                 >
                   <Smartphone size={18} /> WhatsApp
                 </Button>
                 <Button 
                   className="w-full flex-grow px-12"
                   onClick={() => handleSubmit('razorpay')}
                   disabled={isSubmitting}
                 >
                   {isSubmitting ? 'Processing...' : `Pay ₹${selectedPackage?.price.toLocaleString('en-IN')} Now`} 
                   <Lock size={16} className="ml-2" />
                 </Button>
               </div>
            </div>
          </div>
        </Step>
      </Stepper>
    </div>
  );
};

export default BookService;

