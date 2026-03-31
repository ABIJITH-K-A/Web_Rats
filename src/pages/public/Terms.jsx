import React from "react";
import { ShieldCheck, Mail } from "lucide-react";
import { TERMS_POINTS, CONTACT_INFO } from "../../data/siteData";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";

const Terms = () => {
  return (
    <div className="min-h-screen bg-primary-dark">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-6 py-32 sm:py-40 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-cyan-primary">
            <ShieldCheck size={32} />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-lg text-light-gray/60">
            Plain and simple rules for how we work together.
          </p>
        </div>

        <div className="mt-16 space-y-12">
          <section className="rounded-3xl border border-white/10 bg-black/40 p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white">How Projects Work</h2>
            <div className="mt-6 space-y-4">
              {TERMS_POINTS.map((point, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-primary/20 text-xs font-bold text-cyan-primary">
                    {index + 1}
                  </div>
                  <p className="text-light-gray/80 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-8">
            <h2 className="text-xl font-bold text-white">Need Clarification?</h2>
            <p className="text-light-gray/60">
              If you have any questions before booking your project, feel free to contact us.
            </p>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="mt-4 inline-flex items-center gap-2 text-cyan-primary hover:text-cyan-primary/80"
            >
              <Mail size={18} />
              {CONTACT_INFO.email}
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
