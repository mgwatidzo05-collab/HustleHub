import React, { useState } from 'react';
import {
  X,
  Store as StoreIcon,
  MapPin,
  Truck,
  MessageCircle,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Scale,
} from 'lucide-react';
import { StoreCategory } from '../types';
import { useMarketplace } from '../context/MarketplaceContext';
import { uploadImageToStorage } from '../lib/appwrite';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface BusinessSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenStoreLogin?: () => void;
}

export const BusinessSignupModal: React.FC<BusinessSignupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenStoreLogin,
}) => {
  useBodyScrollLock(isOpen);
  const { registerStore, currentUser, selectedUniversity, openTerms } = useMarketplace();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [ownerEmail, setOwnerEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<StoreCategory>('electronics');
  const [location, setLocation] = useState('');
  const [delivers, setDelivers] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState('Free drop-off anywhere on campus within 30 mins');
  const [whatsappNumber, setWhatsappNumber] = useState('+263');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  if (!isOpen) return null;

  const categories: { id: StoreCategory; label: string }[] = [
    { id: 'electronics', label: 'Electronics & Gadgets' },
    { id: 'textbooks', label: 'Textbooks & Notes' },
    { id: 'dorm', label: 'Dorm Essentials & Kettles' },
    { id: 'barber', label: 'Barber & Hair Styling' },
    { id: 'nail_tech', label: 'Nail Tech & Beauty' },
    { id: 'printing', label: 'Printing & Thesis Binding' },
    { id: 'laundry', label: 'Student Laundry' },
    { id: 'tutoring', label: 'Tutoring & Academic Prep' },
    { id: 'clothing', label: 'Thrift & Fashion' },
    { id: 'food_snacks', label: 'Campus Snacks & Meals' },
    { id: 'repairs', label: 'Hardware & Tech Repairs' },
    { id: 'other_service', label: 'Other Student Service' },
  ];

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImageToStorage(file);
      setLogoUrl(url);
    } catch (err: any) {
      console.error(err);
      setError('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!ownerName.trim()) return setError('Please provide your name');
      if (!ownerEmail.trim() || !ownerEmail.includes('@')) return setError('Please provide a valid email (any email accepted)');
      if (!password || password.length < 6) return setError('Please create a password of at least 6 characters');
      if (password !== confirmPassword) return setError('Passwords do not match. Please re-enter.');
      setStep(2);
    } else if (step === 2) {
      if (!storeName.trim()) return setError('Please provide a name for your store');
      if (!description.trim()) return setError('Please enter a description of what you sell or offer');
      setStep(3);
    } else if (step === 3) {
      if (!location.trim()) return setError('Please enter your campus location / residence');
      setStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Clean whatsapp number
    const cleanNum = whatsappNumber.trim();
    if (cleanNum.length < 8) {
      return setError('Please provide a valid WhatsApp number (e.g. +263 77 123 4567)');
    }

    if (!agreedToTerms) {
      return setError('Please read and agree to the HustleHub Business Terms & Conditions to complete registration.');
    }

    setIsSubmitting(true);
    try {
      await registerStore({
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        password: password.trim(),
        name: storeName.trim(),
        tagline: tagline.trim() || `${storeName} on campus`,
        description: description.trim(),
        category,
        university: selectedUniversity,
        location: location.trim(),
        delivers,
        deliveryNotes: delivers ? deliveryNotes.trim() : 'Pickup only',
        whatsappNumber: cleanNum,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
      });

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to register store');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <StoreIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Register Student Store
              </h2>
              <p className="text-xs text-slate-400">
                Step {step} of 4 · {selectedUniversity} Campus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-orange-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* STEP 1: Student Owner Info & Password */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {onOpenStoreLogin && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between text-xs text-orange-300">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Already registered your student business?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStoreLogin();
                    }}
                    className="font-bold underline text-white hover:text-orange-200 cursor-pointer"
                  >
                    Sign In with Password →
                  </button>
                </div>
              )}

              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                Register your business on HustleHub. Free registration for all student hustlers with your preferred email and password!
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariro Moyo"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (Any email accepted)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tariro.student@gmail.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  You don't need a .nust.ac.zw email — any active email is welcome.
                </p>
              </div>

              {/* Password Fields for Future Store Sign-In */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-orange-400" />
                      <span>Create Password</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-slate-400 hover:text-orange-400 cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-orange-400" />
                    <span>Confirm Password</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  University Campus
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedUniversity} (National University of Science and Technology)`}
                  className="w-full bg-slate-900/60 text-sm text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-800 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Store Identity */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Store / Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariro's Tech & Fix, Campus Cuts, FastPrint SU"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StoreCategory)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 capitalize"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Short Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student chargers, scientific calculators, screen protectors"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description of What You Sell / Offer
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your student business, products offered, schedule, or specialty..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Campus Location & Delivery */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Campus Location / Residence
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hall 1 Room 14, FIT Engineering Block, Library Quad"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Students love knowing where on campus you operate so they can pick up or meet safely.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Campus Delivery Offered?
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Can you drop items off at hostel rooms or faculty quads?
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={delivers}
                    onChange={(e) => setDelivers(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                  />
                </div>

                {delivers && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Delivery Details / Speed
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Free dorm delivery within 30 mins after 4PM"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: WhatsApp Direct Contact & Logo */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Phone Number (with Country Code)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+263 77 123 4567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Students will click one button to start a WhatsApp chat with you for orders and inquiries.
                </p>
              </div>

              {/* Logo / Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Store Logo / Cover Photo (Appwrite Storage Bucket)
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Store Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                      <StoreIcon className="w-6 h-6" />
                    </div>
                  )}

                  <label className="flex-1 cursor-pointer">
                    <div className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center justify-center gap-2 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300/90 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Verification Notice</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  To protect NUST students from scams and unauthorized vendors, new stores are checked by HustleHub admins before appearing live. Once submitted, you can immediately begin adding products to your store dashboard!
                </p>
              </div>

              {/* Terms and Conditions Agreement */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 accent-orange-500 cursor-pointer"
                  />
                  <div className="text-xs text-slate-200 leading-snug">
                    <span className="font-semibold text-white">I accept the </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openTerms();
                      }}
                      className="text-orange-400 hover:text-orange-300 font-bold underline inline cursor-pointer"
                    >
                      HustleHub Business Terms & Conditions
                    </button>
                    <span> and Campus Safety Guidelines.</span>
                  </div>
                </label>
                <p className="text-[11px] text-slate-400 pl-6.5 leading-relaxed">
                  You agree to accurate product descriptions, honest fulfillment, professional WhatsApp communications, and zero tolerance for academic cheating materials or prohibited goods.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !agreedToTerms}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-900/30 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering...' : 'Complete & Open Store'}</span>
              </button>
            )}
          </div>
        </form>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>HustleHub University Merchant Code</span>
          <button
            type="button"
            onClick={openTerms}
            className="text-slate-400 hover:text-orange-400 hover:underline cursor-pointer"
          >
            Review Terms & Conditions →
          </button>
        </div>
      </div>
    </div>
  );
};
