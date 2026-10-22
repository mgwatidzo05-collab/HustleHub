import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  MessageCircle,
  Lock,
  BookOpen,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const [activeSection, setActiveSection] = useState<'all' | 'sellers' | 'buyers' | 'prohibited' | 'safety' | 'privacy'>('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  HustleHub Terms & Conditions
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Official Policy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Campus Marketplace Agreement, Seller Conduct & Safety Guidelines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Terms"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'all'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All Terms
          </button>
          <button
            onClick={() => setActiveSection('sellers')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'sellers'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Business & Seller Rules
          </button>
          <button
            onClick={() => setActiveSection('buyers')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'buyers'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Buyer & Customer Rights
          </button>
          <button
            onClick={() => setActiveSection('prohibited')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'prohibited'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Prohibited Items & Cheating
          </button>
          <button
            onClick={() => setActiveSection('safety')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'safety'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Campus Meetup Safety
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'privacy'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Privacy & WhatsApp
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          {/* Overview Callout */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Welcome to HustleHub Campus Marketplace</h3>
              <p className="text-xs text-slate-300">
                HustleHub connects university students directly with fellow student peers for textbooks, gadgets, dorm gear, and student services (barbers, laundry, printing, repairs). By registering an account, listing products, or contacting a seller, you confirm that you have read, understand, and agree to these Terms and Conditions.
              </p>
            </div>
          </div>

          {/* Section 1: General Platform Rules */}
          {(activeSection === 'all' || activeSection === 'buyers') && (
            <section className="space-y-3 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <FileText className="w-4 h-4 text-orange-400" />
                <span>1. General Marketplace Terms & Eligibility</span>
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs sm:text-sm pl-1">
                <li>
                  <strong className="text-white">Student Affiliation:</strong> HustleHub is designed primarily for university students, campus staff, and verified local vendors servicing the campus community.
                </li>
                <li>
                  <strong className="text-white">Account Accuracy:</strong> Users must provide accurate, non-misleading contact information, including a valid WhatsApp number and contact email.
                </li>
                <li>
                  <strong className="text-white">Direct Peer-to-Peer Transactions:</strong> HustleHub facilitates discovery and contact via WhatsApp. HustleHub is not a direct merchant, bank, or escrow service. All payments, inspections, and item handoffs occur directly between buyer and seller.
                </li>
                <li>
                  <strong className="text-white">Zero Tolerance for Fraud:</strong> Any attempt to scam, defraud, impersonate, or mislead students will result in immediate permanent account termination and referral to campus authorities.
                </li>
              </ul>
            </section>
          )}

          {/* Section 2: Business & Seller Obligations */}
          {(activeSection === 'all' || activeSection === 'sellers') && (
            <section className="space-y-3 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>2. Business & Student Seller Code of Conduct</span>
              </div>
              <p className="text-xs text-slate-400">
                Registered student businesses agree to maintain high standards of honesty, fairness, and responsiveness:
              </p>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs sm:text-sm pl-1">
                <li>
                  <strong className="text-white">Accurate Representation:</strong> All items must be photographed accurately without misleading stock photos. Disclose any flaws, battery degradation, textbook markings, or wear.
                </li>
                <li>
                  <strong className="text-white">Transparent Pricing:</strong> Prices must be accurately stated in United States Dollars ($ USD) or local equivalent. Hidden fees or last-minute price inflation upon meeting are strictly prohibited.
                </li>
                <li>
                  <strong className="text-white">Fulfillment & Delivery:</strong> If you offer campus delivery, you must honor stated delivery timelines or promptly notify the student buyer via WhatsApp if delayed.
                </li>
                <li>
                  <strong className="text-white">Service Guarantees:</strong> Service providers (barbers, tech repairers, laundry, printers) must provide the agreed service with care and professionalism. If hardware repairs cannot be completed, customer devices must be returned unharmed.
                </li>
                <li>
                  <strong className="text-white">Store Verification:</strong> New stores are subject to administrative review. HustleHub administrators may freeze or reject stores failing to meet campus safety and quality standards.
                </li>
              </ul>
            </section>
          )}

          {/* Section 3: Buyer & Customer Guidelines */}
          {(activeSection === 'all' || activeSection === 'buyers') && (
            <section className="space-y-3 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>3. Buyer Rights & Responsibilities</span>
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs sm:text-sm pl-1">
                <li>
                  <strong className="text-white">Inspection Before Payment:</strong> Always physically inspect items (power on electronics, check textbook editions, test charging cables) before handing over cash or sending mobile money.
                </li>
                <li>
                  <strong className="text-white">Do Not Pay Upfront:</strong> Never send advance deposits or wire transfers to sellers you have not met in person, unless dealing with a recognized, verified campus service.
                </li>
                <li>
                  <strong className="text-white">Fair Bargaining & Communication:</strong> Treat student peers with respect. Respect agreed meetup times and locations.
                </li>
                <li>
                  <strong className="text-white">Report Infractions:</strong> Use the "Report Content" flag on listings or stores if you notice fraudulent behavior, counterfeit goods, or harassing messages.
                </li>
              </ul>
            </section>
          )}

          {/* Section 4: Prohibited Content & Academic Integrity */}
          {(activeSection === 'all' || activeSection === 'prohibited') && (
            <section className="space-y-3 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-rose-900/40">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>4. Strictly Prohibited Goods, Services & Academic Integrity</span>
              </div>
              <p className="text-xs text-rose-300/80">
                Any user listing the following items will be immediately frozen, reported to university proctors, and permanently banned:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40">
                  <span className="font-bold text-white block mb-0.5">Academic Dishonesty</span>
                  Selling past exam answer leaks, writing assignments for hire, or exam proxy impersonation.
                </div>
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40">
                  <span className="font-bold text-white block mb-0.5">Stolen Property</span>
                  Laptops, phones, or lab equipment without verifiable proof of ownership.
                </div>
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40">
                  <span className="font-bold text-white block mb-0.5">Drugs & Controlled Substances</span>
                  Alcohol, prescription medication, vaping devices, or illegal campus narcotics.
                </div>
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40">
                  <span className="font-bold text-white block mb-0.5">Weapons & Hazardous Gear</span>
                  Knives, blades, fireworks, or hazardous chemical agents.
                </div>
              </div>
            </section>
          )}

          {/* Section 5: Campus Meetup Safety Code */}
          {(activeSection === 'all' || activeSection === 'safety') && (
            <section className="space-y-3 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>5. Campus Meetup Safety Code</span>
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs sm:text-sm pl-1">
                <li>
                  <strong className="text-white">Public Campus Locations:</strong> Only arrange meetups in well-lit, populated campus areas (e.g., Library Quad, Student Union complex, Faculty foyers, or hostel security checkpoints).
                </li>
                <li>
                  <strong className="text-white">Daylight Transactions:</strong> Whenever possible, conduct product handoffs and test runs during daylight hours.
                </li>
                <li>
                  <strong className="text-white">Bring a Buddy:</strong> When purchasing expensive electronics or laptops, bring a friend or hostel roommate along with you.
                </li>
              </ul>
            </section>
          )}

          {/* Section 6: WhatsApp & Privacy */}
          {(activeSection === 'all' || activeSection === 'privacy') && (
            <section className="space-y-3 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>6. Privacy, WhatsApp Communications & Data Protection</span>
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs sm:text-sm pl-1">
                <li>
                  <strong className="text-white">Consent to Communication:</strong> By clicking "WhatsApp Direct Order" or contacting a seller, you consent to opening a direct WhatsApp chat with the seller.
                </li>
                <li>
                  <strong className="text-white">No Scraping or Spam:</strong> It is strictly forbidden to scrape, harvest, or export phone numbers or student names for unsolicited advertising, broadcast lists, or off-platform spam.
                </li>
                <li>
                  <strong className="text-white">Data Retention:</strong> HustleHub stores basic account information, store details, product listings, and platform analytics safely in accordance with standard campus data protection norms.
                </li>
              </ul>
            </section>
          )}

          {/* Section 7: Limitation of Liability */}
          <section className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 text-[11px] sm:text-xs text-slate-400">
            <h4 className="font-bold text-slate-300">7. Disclaimer & Limitation of Liability</h4>
            <p>
              HustleHub is provided on an "as is" and "as available" basis as an independent student-focused platform. While HustleHub takes proactive steps to verify businesses and respond swiftly to abuse reports, the platform is not responsible for individual transactions, product warranties, or disputes arising between independent buyers and sellers.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Last Updated: <strong className="text-slate-200">October 2026</strong> · Applies to all HustleHub users
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
