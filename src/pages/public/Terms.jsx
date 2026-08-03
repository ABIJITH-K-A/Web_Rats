import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Seo from '../../components/seo/Seo';

const Terms = () => {
  return (
    <>
      <Seo
        title="Terms & Conditions - Rynix"
        description="Terms and conditions for using Rynix's design and development services. Please read carefully before booking."
        keywords="terms and conditions, Rynix terms, service terms, booking terms, student pricing terms"
      />
      <div className="min-h-screen bg-[#0B120C] text-white">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#0B120C]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-black tracking-tight">
              Rynix<span className="text-green-500">.</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/join" className="text-sm font-medium text-light-gray hover:text-white transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Page Title */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-green-500/10 mb-6">
              <Shield className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-light-gray/60 max-w-2xl mx-auto">
              Please read these terms carefully before booking our services. Your use of Rynix constitutes acceptance of these terms.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { icon: FileText, label: 'Booking Process', href: '#booking' },
              { icon: CheckCircle, label: 'Payment Terms', href: '#payment' },
              { icon: AlertCircle, label: 'Refund Policy', href: '#refunds' },
              { icon: Info, label: 'Intellectual Property', href: '#ip' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <section id="introduction" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-500" />
                1. Introduction
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                Welcome to Rynix ("we", "our", or "us"). These Terms and Conditions govern your use of our website and services. By accessing or using our services, you agree to be bound by these terms and all applicable laws and regulations.
              </p>
              <p className="text-light-gray/70 leading-relaxed">
                If you disagree with any of these terms, you are prohibited from using our services. The materials contained in our website are protected by applicable copyright and trademark law.
              </p>
            </section>

            {/* Booking Process */}
            <section id="booking" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-500" />
                2. Booking Process
              </h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs mt-0.5">
                    1
                  </div>
                  <p className="text-light-gray/70 leading-relaxed">
                    <strong className="text-white">Select Service:</strong> Choose the service category and specific service that matches your needs.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs mt-0.5">
                    2
                  </div>
                  <p className="text-light-gray/70 leading-relaxed">
                    <strong className="text-white">Choose Plan:</strong> Select between Basic, Standard, or Premium plan based on your requirements and timeline.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs mt-0.5">
                    3
                  </div>
                  <p className="text-light-gray/70 leading-relaxed">
                    <strong className="text-white">Complete Booking:</strong> Fill in your requirements, references, and deadline. You will be directed to payment.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs mt-0.5">
                    4
                  </div>
                  <p className="text-light-gray/70 leading-relaxed">
                    <strong className="text-white">Payment Confirmation:</strong> After successful payment, your order will be confirmed and assigned to our team.
                  </p>
                </li>
              </ul>
            </section>

            {/* Payment Terms */}
            <section id="payment" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                3. Payment Terms
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Advance Payment</h3>
                  <p className="text-light-gray/70">
                    New customers are required to pay <strong>70% advance</strong> before we begin work. Returning customers need to pay <strong>50% advance</strong>.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Remaining Balance</h3>
                  <p className="text-light-gray/70">
                    The remaining balance is due once the project reaches the delivery stage. We accept payments via Razorpay which supports UPI, credit/debit cards, and net banking.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Priority Delivery</h3>
                  <p className="text-light-gray/70">
                    Priority delivery adds a fee of 20% (minimum ₹99) to your order and moves it to the front of our queue.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Student Discount</h3>
                  <p className="text-light-gray/70">
                    We offer a 15% discount for verified students. Contact us with your student ID for the discount code.
                  </p>
                </div>
              </div>
            </section>

            {/* Refund Policy */}
            <section id="refunds" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-green-500" />
                4. Refund Policy
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Refund Before Project Start</h3>
                    <p className="text-light-gray/70">
                      If you cancel your order before we begin work, you will receive a full refund of your advance payment within 5-7 business days.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Refund After Project Start</h3>
                    <p className="text-light-gray/70">
                      If you cancel after work has begun, we will refund the remaining balance minus the work completed. A cancellation fee of 10% applies.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Non-Refundable</h3>
                    <p className="text-light-gray/70">
                      Priority delivery fees are non-refundable. Refunds are processed within 5-7 business days via your original payment method.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section id="ip" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                5. Intellectual Property Rights
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    1
                  </div>
                  <p className="text-light-gray/70">
                    <strong className="text-white">Before Full Payment:</strong> All intellectual property rights in the work remain with Rynix until you have paid in full.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    2
                  </div>
                  <p className="text-light-gray/70">
                    <strong className="text-white">After Full Payment:</strong> Upon receipt of full payment, all intellectual property rights in the final deliverables are transferred to you.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    3
                  </div>
                  <p className="text-light-gray/70">
                    <strong className="text-white">Pre-existing Materials:</strong> You are responsible for ensuring you have the rights to any materials you provide to us.
                  </p>
                </div>
              </div>
            </section>

            {/* Revisions */}
            <section id="revisions" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                6. Revisions and Changes
              </h2>
              <div className="space-y-4">
                <p className="text-light-gray/70">
                  We include revision rounds with every plan:
                </p>
                <ul className="space-y-2 pl-6">
                  <li className="flex gap-2">
                    <span className="text-green-500">•</span>
                    <span className="text-light-gray/70">Basic Plan: 1 revision round</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500">•</span>
                    <span className="text-light-gray/70">Standard Plan: 2 revision rounds</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500">•</span>
                    <span className="text-light-gray/70">Premium Plan: 3 revision rounds</span>
                  </li>
                </ul>
                <p className="text-light-gray/70">
                  Additional revisions after the included rounds may incur a fee of ₹199 per revision.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section id="contact" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                7. Contact Us
              </h2>
              <p className="text-light-gray/70">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-light-gray/60 mb-1">Email</p>
                  <p className="font-medium">hello@rynix.studio</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-light-gray/60 mb-1">WhatsApp</p>
                  <p className="font-medium">+91 8300920680</p>
                </div>
              </div>
            </section>

            {/* Effective Date */}
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <p className="text-sm text-light-gray/40">
                Last updated: July 6, 2026
              </p>
              <p className="text-sm text-light-gray/40 mt-2">
                These terms may be updated periodically. Continued use of our services constitutes acceptance of the updated terms.
              </p>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-500 text-black font-bold hover:bg-green-400 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;