import React from "react";
import { Lock, Mail } from "lucide-react";
import { CONTACT_INFO } from "../../data/siteData";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-primary-dark">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-6 py-32 sm:py-40 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-cyan-primary">
            <Lock size={32} />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-light-gray/60">
            How we protect your project data and personal details.
          </p>
        </div>

        <div className="mt-16 space-y-12 text-light-gray/80">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">What we collect</h2>
            <p className="leading-relaxed">
              We only collect exactly what we need to build your project. This includes your contact details for communication (name, email, phone number), payment tokens processed through secure providers, and the specific files or briefs you upload for your order.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">How we use it</h2>
            <p className="leading-relaxed">
              Your details are never sold or shared with outside lists. The information you provide is given exclusively to the team working on your build, and we use your contact info solely for project updates, billing, and important platform notifications.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Project Privacy</h2>
            <p className="leading-relaxed">
              We assume your project files are confidential unless stated otherwise. If we wish to feature your completed work in our portfolio, we will ask you for permission beforehand or blur sensitive data if required.
            </p>
          </section>

          <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-8 mt-12">
            <h2 className="text-xl font-bold text-white">Questions?</h2>
            <p className="text-light-gray/60">
              For account data deletion or questions about your privacy, contact our team.
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

export default Privacy;
