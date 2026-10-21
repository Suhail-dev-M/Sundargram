import React, { useState } from 'react';
import { Profile } from '../../types';
import { api } from '../../lib/api';
import { showToast } from '../../store/useModalStore';
import { X, Camera, Lock, Globe, FileText, User } from 'lucide-react';

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onUpdated: (updated: Profile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onUpdated }) => {
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [isPrivate, setIsPrivate] = useState(profile.is_private || false);
  const [saving, setSaving] = useState(false);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || saving) return;

    try {
      setSaving(true);
      const updated = await api.updateProfile(profile.id, {
        full_name: fullName.trim(),
        bio: bio.trim(),
        website: website.trim(),
        avatar_url: avatarUrl,
        is_private: isPrivate,
      });

      if (updated) {
        showToast('Profile updated!', 'success');
        onUpdated(updated);
        onClose();
      }
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white"
          >
            Cancel
          </button>
          <h3 className="text-sm font-bold text-[#262626] dark:text-[#FAFAFA]">
            Edit Profile
          </h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-bold text-[#0095F6] hover:text-[#1877F2] disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Done'}
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 flex flex-col gap-4">
          {/* Avatar Row */}
          <div className="flex items-center gap-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                alt=""
                className="w-full h-full object-cover"
              />
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/60 transition text-white">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </label>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#262626] dark:text-[#FAFAFA]">
                {profile.username}
              </span>
              <label className="text-xs font-semibold text-[#0095F6] cursor-pointer hover:underline mt-0.5">
                Change profile photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-500">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-500">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] focus:outline-none resize-none"
            />
          </div>

          {/* Website */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-500">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] focus:outline-none"
            />
          </div>

          {/* Account Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 mt-2">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-neutral-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#262626] dark:text-[#FAFAFA]">
                  Private Account
                </span>
                <span className="text-[10px] text-neutral-400">
                  Only approved followers see your posts
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 accent-[#0095F6] cursor-pointer"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
