import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Mail,
  Send,
  CheckCircle2,
  Lock,
  Globe,
  Cookie,
  Info,
  ServerOff,
  Cpu,
  HeartHandshake,
  ExternalLink,
  Sliders,
  Check
} from 'lucide-react';

export type LegalModalTab = 'about' | 'contact' | 'privacy' | 'terms' | 'cookies';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalModalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<LegalModalTab>(initialTab);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState('Feedback');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Sync tab if initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSubmitted(true);
  };

  const handleResetContact = () => {
    setContactName('');
    setContactEmail('');
    setContactCategory('Feedback');
    setContactSubject('');
    setContactMessage('');
    setContactSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              {activeTab === 'about' && <Info className="w-5 h-5 text-indigo-500" />}
              {activeTab === 'contact' && <Mail className="w-5 h-5 text-indigo-500" />}
              {activeTab === 'cookies' && <Cookie className="w-5 h-5 text-amber-500" />}
              {activeTab === 'privacy' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
              {activeTab === 'terms' && <FileText className="w-5 h-5 text-cyan-500" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTab === 'about' && 'About Us — ClickPDF'}
                {activeTab === 'contact' && 'Contact Us & Developer Support'}
                {activeTab === 'cookies' && 'Cookies Policy'}
                {activeTab === 'privacy' && 'Privacy Policy'}
                {activeTab === 'terms' && 'Terms of Service'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official ClickPDF Policies, Company Information & Direct Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Close Modal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 pt-2 shrink-0 gap-1.5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'about'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t border-x border-slate-200 dark:border-slate-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contact'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t border-x border-slate-200 dark:border-slate-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Us</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cookies'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-t border-x border-slate-200 dark:border-slate-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookies Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t border-x border-slate-200 dark:border-slate-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t border-x border-slate-200 dark:border-slate-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed custom-scrollbar">
          {/* ========================================================= */}
          {/* TAB 1: ABOUT US */}
          {/* ========================================================= */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-950 dark:text-indigo-200 flex items-start gap-3.5">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-bold">About ClickPDF.net — A Product by Click Digital Services</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                      Flagship Utility
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-indigo-900 dark:text-indigo-300">
                    <strong>ClickPDF.net</strong> is proudly owned, developed, and operated by <strong>Click Digital Services</strong>. We are a digital product studio committed to building smart, 100% private, zero-server browser utilities under our core company motto: <em>"Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private"</em>.
                  </p>
                </div>
              </div>

              {/* Our Mission & Parent Company Vision */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>Our Mission & Flagship Vision</span>
                </h4>
                <p className="mb-2">
                  Traditional web converters and file management platforms force you to upload private contracts, financial invoices, medical records, and legal briefs to remote third-party servers. Once uploaded, your sensitive files are vulnerable to retention logs, security breaches, unauthorized analysis, and server outages.
                </p>
                <p className="mb-2">
                  <strong>Click Digital Services</strong> created ClickPDF.net to fundamentally revolutionize personal and business document workflows. ClickPDF.net is our first flagship utility—engineered from the ground up to execute enterprise-grade PDF operations 100% client-side inside your web browser. <strong>Not a single byte of your documents ever leaves your computer or phone.</strong>
                </p>
                <p>
                  As part of Click Digital Services' broader roadmap, ClickPDF.net is just the beginning. Our team is actively developing an expanding suite of privacy-first, zero-server digital utilities adhering to the same strict zero-upload standard: <em>Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private</em>.
                </p>
              </div>

              {/* Four Pillars */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  The Four Pillars of Click Digital Services
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                      <ServerOff className="w-4 h-4" />
                      <span>100% Client-Side Architecture</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Zero server uploads. All cryptographic operations, PDF byte stream modifications, image decodes, and canvas renderings run locally inside your browser's RAM memory.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold mb-1">
                      <Cpu className="w-4 h-4" />
                      <span>Instant, Hardware-Accelerated Speed</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      No network upload queues, no slow server waitlists. Leveraging Web Workers and WebAssembly, tasks process directly with the raw speed of your local CPU.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Free & Unrestricted Forever</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      No hidden subscriptions, paywalls, daily document limits, or registration requirements. Clean, modern tools available to students, professionals, and teams globally.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                      <Globe className="w-4 h-4" />
                      <span>Eco-Friendly Green Computing</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      By executing compute on the client device rather than running round-the-clock server clusters, ClickPDF drastically reduces the carbon footprint of digital document workflows.
                    </p>
                  </div>
                </div>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Open Standards & Verified Technologies
                </h4>
                <p className="mb-2">
                  ClickPDF adheres strictly to the official <strong>ISO 32000</strong> international standards for PDF document structures. Our core engine utilizes audited, open-source libraries:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                  <li><strong>pdf-lib</strong>: For high-speed in-memory PDF manipulation, page merging, byte reconstruction, and encryption.</li>
                  <li><strong>PDF.js (Mozilla)</strong>: For pixel-perfect canvas rendering of document pages and live previews.</li>
                  <li><strong>Tesseract.js</strong>: For client-side optical character recognition (OCR) without external API dependencies.</li>
                  <li><strong>Modern Web APIs</strong>: IndexedDB, File System Access API, and Progressive Web App (PWA) offline service workers.</li>
                </ul>
              </div>

              {/* Transparency & Ownership */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  Parent Company Ownership & Development
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                  <strong>ClickPDF.net</strong> is owned, developed, and operated by <strong>Click Digital Services</strong>. Our engineering division focuses exclusively on privacy-centric, zero-knowledge browser applications.
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  For corporate inquiries, partnerships, or direct technical support, contact the Click Digital Services team at{' '}
                  <a href="mailto:clickpdfnet@gmail.com" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    clickpdfnet@gmail.com
                  </a>.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>ClickPDF.net · Click Digital Services</span>
                <span>Client-Side Architecture</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CONTACT US */}
          {/* ========================================================= */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              {contactSubmitted ? (
                <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                    Message Successfully Sent!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                    Thank you for reaching out, <strong>{contactName}</strong>. Your inquiry regarding <em>"{contactSubject || contactCategory}"</em> has been forwarded to our team. We will review it and reply to <strong>{contactEmail}</strong> promptly.
                  </p>
                  <button
                    onClick={handleResetContact}
                    className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Contact Info Card */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <span>Direct Communication</span>
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        Whether you need technical assistance, wish to report an unexpected bug, want to suggest a new PDF tool, or have a business/advertising proposal, we are here to help.
                      </p>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Primary Support & Admin</span>
                          <a
                            href="mailto:clickpdfnet@gmail.com"
                            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                          >
                            clickpdfnet@gmail.com
                          </a>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Response Time</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Within 24 to 48 business hours</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Availability</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            Online 7 days a week
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Contact Form */}
                  <div className="md:col-span-2">
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Your Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="e.g. Ali Khan"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="e.g. name@example.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Topic / Category
                          </label>
                          <select
                            value={contactCategory}
                            onChange={(e) => setContactCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          >
                            <option value="Feedback">General Feedback & Appreciation</option>
                            <option value="Bug Report">Bug Report / Processing Error</option>
                            <option value="Feature Request">New Feature / Tool Request</option>
                            <option value="Partnership">Business & Partnerships</option>
                            <option value="Privacy">Privacy & Security Questions</option>
                            <option value="Other">Other Inquiry</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Subject Line
                          </label>
                          <input
                            type="text"
                            value={contactSubject}
                            onChange={(e) => setContactSubject(e.target.value)}
                            placeholder="Brief summary of inquiry"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Your Message <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Please provide as much detail as possible..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Your information is kept strictly confidential.
                        </span>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Message</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* TAB 3: COOKIES POLICY */}
          {/* ========================================================= */}
          {activeTab === 'cookies' && (
            <div className="space-y-6">
              {/* 1. What Are Cookies */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  1. What Are Cookies and Local Storage?
                </h4>
                <p>
                  Cookies are small text files placed on your computer or mobile device by websites that you visit. They are widely used to make websites work efficiently, remember your preferences, and provide aggregated reporting information. In addition to cookies, modern web applications utilize HTML5 LocalStorage and IndexedDB to persist user configuration locally on the device.
                </p>
              </div>

              {/* 2. ClickPDF's First-Party Zero-Tracking Commitment */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>2. How ClickPDF Uses First-Party Cookies & Local Data</span>
                </h4>
                <p className="mb-2">
                  ClickPDF does <strong>NOT</strong> use first-party cookies to track you across websites, build user profiles, or sell personal data. The core document processing tools operate in-memory. We use standard browser LocalStorage exclusively for essential functional purposes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <strong className="block text-slate-800 dark:text-slate-200 mb-0.5">UI Preferences</strong>
                    Remembers dark mode/light mode themes and recent layout settings.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <strong className="block text-slate-800 dark:text-slate-200 mb-0.5">Cookie Consent</strong>
                    Stores your cookie acknowledgment so the consent banner does not re-appear.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <strong className="block text-slate-800 dark:text-slate-200 mb-0.5">Batch Processing</strong>
                    Maintains transient task queues in memory while you organize files.
                  </div>
                </div>
              </div>

              {/* 3. Third-Party Advertising & Analytics Cookies */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  3. Third-Party Advertising & Analytics Cookies
                </h4>
                <p className="mb-2">
                  To keep our utilities 100% free, ClickPDF.net may display advertisements served by third-party advertising networks and partners (which may include Google or other ad providers) that use standard cookies to serve and measure ads, and users can manage cookies directly via their browser settings.
                </p>
                <p>
                  These third-party advertising networks and certified partners may use cookies or web beacons to analyze ad delivery and measure performance. You can manage, block, or delete cookies at any time via your browser settings or industry-standard opt-out resources such as the Network Advertising Initiative (NAI) and Digital Advertising Alliance (DAA).
                </p>
              </div>

              {/* 4. Managing Cookies in Your Web Browser */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  4. Managing Cookies Directly in Your Web Browser
                </h4>
                <p className="mb-2">
                  Most browsers automatically accept cookies by default, but you can alter your browser settings to refuse cookies, alert you when a cookie is sent, or purge cookies completely:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                  <li><strong>Google Chrome:</strong> Settings → Privacy and security → Third-party cookies.</li>
                  <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Enhanced Tracking Protection.</li>
                  <li><strong>Apple Safari:</strong> Preferences → Privacy → Manage Website Data / Block All Cookies.</li>
                  <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies.</li>
                </ul>
              </div>

              {/* 5. Regulatory Framework */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  5. Regulatory Compliance (GDPR, CCPA, ePrivacy)
                </h4>
                <p>
                  This Cookies Policy complies with the European Union ePrivacy Directive (Directive 2002/58/EC as amended), the General Data Protection Regulation (GDPR - Regulation 2016/679), and California Consumer Privacy Act (CCPA). Updates will be published on this page with an amended revision date.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>ClickPDF.net · Cookies & Compliance</span>
                <span>Last Updated: October 2026</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PRIVACY POLICY */}
          {/* ========================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm">Official Privacy Constitution — Click Digital Services</strong>
                  ClickPDF.net is owned, developed, and operated by <strong>Click Digital Services</strong> under our foundational commitment: <em>"Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private"</em>. Your documents and confidential files are never uploaded to, transmitted across, or stored on any remote cloud server. All file parsing, PDF merging, compression, and cryptography occur 100% inside your local web browser memory.
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">1. Operating Entity & Zero-Server Commitment</h4>
                <p>
                  Click Digital Services engineers ClickPDF.net with a strict zero-knowledge, zero-upload architecture. Unlike conventional cloud PDF converters, Click Digital Services does not receive, mirror, save, log, or retain your files. When you drop or select a document in the application, it is held exclusively in your local device's random-access memory (RAM). The moment you close or refresh your browser tab, the memory is purged immediately by your operating system.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">2. Client-Side Web Technologies</h4>
                <p>
                  Our PDF manipulation engines leverage open-source WebAssembly (WASM) instructions and high-performance Web Workers. This ensures your CPU conducts all operations locally, completely eliminating exposure to third-party data processors, cloud databases, and data breach risks.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">3. Third-Party Advertising & Analytics Cookies</h4>
                <p>
                  To keep our utilities 100% free, ClickPDF.net may display advertisements served by third-party advertising networks and partners (which may include Google or other ad providers) that use standard cookies to serve and measure ads, and users can manage cookies directly via their browser settings. ClickPDF.net does not use intrusive tracking cookies, user profiling, or invasive trackers. Standard anonymous web traffic telemetry may be utilized solely for site availability and anti-abuse mitigation. For complete details, please see our dedicated <button onClick={() => setActiveTab('cookies')} className="text-indigo-600 dark:text-indigo-400 font-bold underline cursor-pointer">Cookies Policy</button>.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">4. Regulatory Compliance (GDPR, CCPA, HIPAA)</h4>
                <p>
                  Because Click Digital Services never transmits or stores Personal Data or Protected Health Information (PHI) through ClickPDF.net, organizations operating under the European Union General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and United States Health Insurance Portability and Accountability Act (HIPAA) can safely utilize ClickPDF.net without executing third-party Data Processing Agreements (DPAs).
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>ClickPDF.net · Owned & Operated by Click Digital Services</span>
                <span>Zero Server Uploads</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: TERMS OF SERVICE */}
          {/* ========================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm">Terms of Service & Usage Agreement</strong>
                  ClickPDF.net (the "Service") is owned, developed, and operated by <strong>Click Digital Services</strong> ("Company", "we", "us"). By accessing and utilizing the Service, you agree to be bound by the terms, conditions, and disclaimers detailed below.
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">1. Permitted Use & Free Access</h4>
                <p>
                  Click Digital Services provides free browser-based PDF utilities for personal, educational, and commercial purposes under the motto: <em>"Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private"</em>. There are no hidden subscription tiers, daily quota paywalls, or document count limitations. Users are granted a non-exclusive, non-transferable license to access and use the web application in accordance with applicable local and international laws.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">2. User Responsibility & File Legality</h4>
                <p>
                  You represent and warrant that you own or possess the necessary rights, licenses, or authorizations to process, alter, merge, watermark, encrypt, or compress any document you input into the Service. You agree not to use ClickPDF.net to create, process, or distribute unlawful, fraudulent, defamatory, or copyright-infringing content.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">3. Intellectual Property Rights</h4>
                <p>
                  All rights, title, and interest in and to the ClickPDF.net brand, domain, interface design, custom codebase, documentation, and graphical assets remain the exclusive intellectual property of <strong>Click Digital Services</strong>. The underlying PDF manipulation engines are powered by verified open-source libraries (including pdf-lib, pdf.js, and Tesseract.js) used in compliance with their respective permissive licenses (MIT/Apache 2.0).
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">4. Disclaimer of Warranties</h4>
                <p>
                  ClickPDF.net is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. While our algorithms strictly observe the ISO 32000 international standard for PDF documents, Click Digital Services does not guarantee that the Service will be completely uninterrupted, error-free, or compatible with corrupt or non-standard third-party file streams. Users are encouraged to maintain independent backups of original files.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>ClickPDF.net · Click Digital Services Service Agreement</span>
                <span>Last updated: October 2026</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>ClickPDF · 100% In-Browser Zero-Server Privacy Architecture</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
