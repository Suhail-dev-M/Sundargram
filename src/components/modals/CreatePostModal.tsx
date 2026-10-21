import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore, showToast } from '../../store/useModalStore';
import { api } from '../../lib/api';
import {
  X,
  Image as ImageIcon,
  Film,
  Crop,
  ArrowLeft,
  MapPin,
  Smile,
  Plus,
  Trash2,
} from 'lucide-react';

interface MediaItemInput {
  file?: File;
  previewUrl: string;
  mediaType: 'image' | 'video';
  aspectRatio: string;
}

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
  const { currentUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'select' | 'crop' | 'caption'>('select');
  const [mediaList, setMediaList] = useState<MediaItemInput[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: MediaItemInput[] = [];
    const maxFiles = Math.min(files.length, 10 - mediaList.length);

    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        file,
        previewUrl,
        mediaType: isVideo ? 'video' : 'image',
        aspectRatio,
      });
    }

    setMediaList((prev) => [...prev, ...newItems]);
    setStep('crop');
  };

  const handleRemoveMedia = (index: number) => {
    const updated = mediaList.filter((_, idx) => idx !== index);
    setMediaList(updated);
    if (updated.length === 0) {
      setStep('select');
    } else if (activeMediaIndex >= updated.length) {
      setActiveMediaIndex(updated.length - 1);
    }
  };

  const handlePublish = async () => {
    if (!currentUser || mediaList.length === 0 || isPublishing) return;

    try {
      setIsPublishing(true);
      const mediaPayload = mediaList.map((m) => ({
        media_url: m.previewUrl,
        media_type: m.mediaType,
        aspect_ratio: aspectRatio,
      }));

      await api.createPost(currentUser, caption, mediaPayload, location);
      showToast('Post shared successfully!', 'success');
      onPostCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish post';
      showToast(msg, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      {/* Modal Dialog */}
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          {step === 'select' ? (
            <div className="w-8" />
          ) : (
            <button
              onClick={() => setStep(step === 'caption' ? 'crop' : 'select')}
              aria-label="Back"
              className="text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <h3 className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
            {step === 'select' && 'Create new post'}
            {step === 'crop' && 'Crop & Adjust'}
            {step === 'caption' && 'New post details'}
          </h3>

          {step === 'crop' && (
            <button
              onClick={() => setStep('caption')}
              className="text-xs sm:text-sm font-semibold text-[#0095F6] hover:text-[#1877F2]"
            >
              Next
            </button>
          )}

          {step === 'caption' && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="text-xs sm:text-sm font-semibold text-[#0095F6] hover:text-[#1877F2] disabled:opacity-40"
            >
              {isPublishing ? 'Sharing...' : 'Share'}
            </button>
          )}

          {step === 'select' && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-neutral-500 hover:text-black dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: SELECT FILE */}
          {step === 'select' && (
            <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
                <ImageIcon className="w-10 h-10 stroke-[1.5px]" />
              </div>
              <h4 className="text-base font-semibold text-[#262626] dark:text-[#FAFAFA] mb-1">
                Drag photos and videos here
              </h4>
              <p className="text-xs text-neutral-500 mb-6">
                Upload up to 10 photos or short videos
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#0095F6] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#1877F2] transition active:scale-95 shadow-sm"
              >
                Select from computer / device
              </button>
            </div>
          )}

          {/* STEP 2: CROP & MULTI-MEDIA REORDER */}
          {step === 'crop' && mediaList.length > 0 && (
            <div className="flex flex-col items-center p-4">
              {/* Media Preview Box */}
              <div
                className={`relative w-full max-w-md bg-neutral-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center ${
                  aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-video'
                }`}
              >
                {mediaList[activeMediaIndex].mediaType === 'video' ? (
                  <video
                    src={mediaList[activeMediaIndex].previewUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaList[activeMediaIndex].previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Aspect Ratio Selector Overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-lg p-1">
                  <button
                    onClick={() => setAspectRatio('1:1')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      aspectRatio === '1:1' ? 'bg-white text-black' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setAspectRatio('4:5')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      aspectRatio === '4:5' ? 'bg-white text-black' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    4:5
                  </button>
                  <button
                    onClick={() => setAspectRatio('16:9')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      aspectRatio === '16:9' ? 'bg-white text-black' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    16:9
                  </button>
                </div>
              </div>

              {/* Thumbnails strip for multi-image carousel */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto w-full max-w-md p-1 no-scrollbar">
                {mediaList.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 transition ${
                      idx === activeMediaIndex ? 'border-[#0095F6]' : 'border-transparent opacity-60'
                    }`}
                  >
                    {m.mediaType === 'video' ? (
                      <video src={m.previewUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia(idx);
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {mediaList.length < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: CAPTION & PUBLISH */}
          {step === 'caption' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800">
              {/* Media Thumb */}
              <div className="p-4 flex items-center justify-center bg-neutral-950 sm:min-h-[360px]">
                {mediaList[0].mediaType === 'video' ? (
                  <video
                    src={mediaList[0].previewUrl}
                    className="max-h-72 object-contain rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={mediaList[0].previewUrl}
                    alt="Selected"
                    className="max-h-72 object-contain rounded-lg shadow-lg"
                  />
                )}
              </div>

              {/* Form details */}
              <div className="p-4 flex flex-col justify-between">
                <div>
                  {/* User row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-semibold text-[#262626] dark:text-[#FAFAFA]">
                      {currentUser?.username}
                    </span>
                  </div>

                  {/* Caption Textarea */}
                  <textarea
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption... (e.g. #sunset #goldenhour)"
                    className="w-full bg-transparent text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] placeholder:text-neutral-400 focus:outline-none resize-none"
                  />

                  {/* Location input */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-neutral-500">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Add location"
                      className="w-full bg-transparent text-xs text-[#262626] dark:text-[#FAFAFA] placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 text-[11px] text-neutral-400">
                  Sundargram will share this post with your followers and explore feed.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
