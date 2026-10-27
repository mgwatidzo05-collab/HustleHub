import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Upload,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { compressImageFile } from '../lib/imageCompressor';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  useBodyScrollLock(isOpen);
  const { currentUser, updateUserProfile, selectedUniversity } = useMarketplace();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [university, setUniversity] = useState(selectedUniversity || 'NUST');
  const [processingImage, setProcessingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
      setUniversity(currentUser.university || selectedUniversity || 'NUST');
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [currentUser, isOpen, selectedUniversity]);

  if (!isOpen || !currentUser) return null;

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingImage(true);
    setErrorMessage('');
    try {
      // Compress and process image from device gallery
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
      });
      setAvatar(compressedDataUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not process photo from gallery. Please try another image.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    updateUserProfile({
      name: trimmedName,
      phone: phone.trim() || undefined,
      avatar: avatar.trim() || undefined,
      university,
    });

    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Your Profile</h2>
              <p className="text-[11px] text-slate-400">Update your photo, name & contact info</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-500/20 border-b border-rose-500/30 text-rose-300 text-xs text-center font-medium flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5">
          {/* Avatar / Gallery Upload */}
          <div className="flex flex-col items-center justify-center text-center space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="relative group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name || 'Profile'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-orange-500/30 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-2xl font-black text-orange-400">
                  {(name || currentUser.name || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}

              {processingImage && (
                <div className="absolute inset-0 bg-black/75 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
                  Uploading...
                </div>
              )}

              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  disabled={processingImage}
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={processingImage}
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-500">
                Choose any photo from your phone or device gallery
              </p>
            </div>

            {avatar && (
              <div className="pt-2 border-t border-slate-800/80 w-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Remove Profile Photo
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariro Moyo"
                  className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-slate-950/60 text-xs text-slate-400 pl-9 pr-3 py-2 rounded-xl border border-slate-800 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Account sign-in email
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                WhatsApp / Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +263 77 123 4567"
                  className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Helps student sellers recognize you when you connect
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Campus University
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-orange-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="NUST">NUST (National Univ of Science & Tech)</option>
                  <option value="UZ">UZ (University of Zimbabwe)</option>
                  <option value="MSU">MSU (Midlands State University)</option>
                  <option value="CUT">CUT (Chinhoyi Univ of Technology)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processingImage}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-xs text-white font-bold transition-all shadow-md shadow-orange-500/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
