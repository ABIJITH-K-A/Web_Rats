import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Download, Info, CheckCircle } from 'lucide-react';
import Seo from '../../components/seo/Seo';

const Privacy = () => {
  return (
    <>
      <Seo
        title="Privacy Policy - Rynix"
        description="Privacy policy for Rynix. Learn how we collect, use, and protect your personal information when using our services."
        keywords="privacy policy, data protection, GDPR, Rynix privacy, personal information, cookie policy"
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
              Privacy Policy
            </h1>
            <p className="text-lg text-light-gray/60 max-w-2xl mx-auto">
              We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
            {[
              { icon: Lock, label: 'Data Collection', href: '#collection' },
              { icon: Eye, label: 'How We Use Data', href: '#usage' },
              { icon: Download, label: 'Data Sharing', href: '#sharing' },
              { icon: Shield, label: 'Data Security', href: '#security' },
              { icon: Info, label: 'Your Rights', href: '#rights' },
              { icon: CheckCircle, label: 'GDPR', href: '#gdpr' },
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
                Welcome to Rynix ("we", "our", or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website rynix.studio (the "Site") or use our services.
              </p>
              <p className="text-light-gray/70 leading-relaxed">
                We are committed to protecting your privacy and personal data. This policy covers our practices across all our services and applies to all users of our platform.
              </p>
            </section>

            {/* Data Collection */}
            <section id="collection" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lock className="w-6 h-6 text-green-500" />
                2. What Information We Collect
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Account Information</h3>
                  <ul className="space-y-2 text-light-gray/70">
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Name and email address</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>WhatsApp number (optional)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Profile picture (optional)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Role (client or worker)</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Order Information</h3>
                  <ul className="space-y-2 text-light-gray/70">
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Service type and plan selected</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Project requirements and specifications</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>References and materials provided</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Communication history</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Payment Information</h3>
                  <p className="text-light-gray/70">
                    We use Razorpay for secure payment processing. We do not store your full card details. Payment information is encrypted and processed securely.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Technical Information</h3>
                  <ul className="space-y-2 text-light-gray/70">
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>IP address and device information</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Browser type and version</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Operating system</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Usage patterns and behavior on our Site</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Data */}
            <section id="usage" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-green-500" />
                3. How We Use Your Information
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="space-y-2 pl-6 text-light-gray/70">
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span>Provide, maintain, and improve our services</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span>Process your orders and payments</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span>Communicate with you about your orders</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span>Respond to your inquiries and provide support</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span>Send service-related notifications</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span>Develop new features and improve user experience</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span>Ensure security and prevent fraud</span>
                </li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section id="sharing" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Download className="w-6 h-6 text-green-500" />
                4. Data Sharing and Disclosure
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                We do not sell your personal information. We only share your data in the following circumstances:
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Service Providers</h3>
                  <p className="text-light-gray/70">
                    We use trusted third-party services for payment processing (Razorpay), cloud storage (Firebase), and analytics. These providers only access data necessary to perform their services.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Legal Requirements</h3>
                  <p className="text-light-gray/70">
                    We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Business Transfers</h3>
                  <p className="text-light-gray/70">
                    In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the deal. We will notify you of any such change.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section id="security" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-500" />
                5. Data Security
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Encryption</h3>
                  <p className="text-light-gray/70 text-sm">
                    All sensitive data is encrypted in transit using TLS 1.3
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Access Control</h3>
                  <p className="text-light-gray/70 text-sm">
                    Limited access to personal data on a need-to-know basis
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Regular Audits</h3>
                  <p className="text-light-gray/70 text-sm">
                    Security audits and vulnerability assessments
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Secure Storage</h3>
                  <p className="text-light-gray/70 text-sm">
                    Data stored in secure Firebase Firestore database
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section id="rights" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                6. Your Rights
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                You have the following rights regarding your personal data:
              </p>
              <ul className="space-y-4 mt-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Access</h3>
                    <p className="text-light-gray/70 text-sm">
                      Request access to the personal data we hold about you
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Rectification</h3>
                    <p className="text-light-gray/70 text-sm">
                      Request correction of inaccurate or incomplete data
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Erasure</h3>
                    <p className="text-light-gray/70 text-sm">
                      Request deletion of your personal data (subject to legal exceptions)
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Restriction</h3>
                    <p className="text-light-gray/70 text-sm">
                      Request restriction of processing in certain circumstances
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Portability</h3>
                    <p className="text-light-gray/70 text-sm">
                      Request transfer of your data to another service
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs">
                    6
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Objection</h3>
                    <p className="text-light-gray/70 text-sm">
                      Object to processing of your personal data
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            {/* GDPR Compliance */}
            <section id="gdpr" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                7. GDPR Compliance
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                Rynix complies with the General Data Protection Regulation (GDPR) for users in the European Union. If you are an EU resident, you have additional rights under GDPR.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-white/5">
                <h3 className="font-semibold mb-2 text-white">Data Protection Officer</h3>
                <p className="text-light-gray/70">
                  For GDPR-related inquiries, contact our Data Protection Officer at:
                </p>
                <p className="font-medium mt-1">dpo@rynix.studio</p>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-white/5">
                <h3 className="font-semibold mb-2 text-white">Cookie Consent</h3>
                <p className="text-light-gray/70">
                  We use essential cookies for site functionality. You can manage your cookie preferences through our cookie banner.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section id="cookies" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                8. Cookies
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our Site and store certain information.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Essential Cookies</h3>
                  <p className="text-light-gray/70 text-sm">
                    Required for site functionality (authentication, security)
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Analytics Cookies</h3>
                  <p className="text-light-gray/70 text-sm">
                    Help us understand how visitors use our site
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <h3 className="font-semibold mb-2 text-white">Preference Cookies</h3>
                  <p className="text-light-gray/70 text-sm">
                    Remember your preferences and settings
                  </p>
                </div>
              </div>
            </section>

            {/* Third-Party Links */}
            <section id="third-party" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                9. Third-Party Links
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                Our Site may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies.
              </p>
            </section>

            {/* Changes to Policy */}
            <section id="changes" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                10. Changes to This Policy
              </h2>
              <p className="text-light-gray/70 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated effective date.
              </p>
              <p className="text-light-gray/70 leading-relaxed">
                Your continued use of our services after any changes constitutes acceptance of the new policy.
              </p>
            </section>

            {/* Contact */}
            <section id="contact" className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6 text-green-500" />
                11. Contact Us
              </h2>
              <p className="text-light-gray/70">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-light-gray/60 mb-1">Email</p>
                  <p className="font-medium">hello@rynix.studio</p>
                  <p className="text-xs text-light-gray/60 mt-1">privacy@rynix.studio</p>
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
                This Privacy Policy was created with GDPR compliance and data protection best practices.
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

export default Privacy;
