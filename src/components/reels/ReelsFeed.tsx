import React, { useState, useEffect, useRef } from 'react';
import { Reel } from '../../types';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Music2,
  Plus,
  MoreVertical,
} from 'lucide-react';

interface ReelsFeedProps {
  onNavigateUser: (username: string) => void;
}

export const ReelsFeed: React.FC<ReelsFeedProps> = ({ onNavigateUser }) => {
  const { currentUser } = useAuthStore();
  const { openComments, openShare, setCreateOpen } = useModalStore();

  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const data = await api.getReels();
      setReels(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const handleLike = async (reel: Reel, index: number) => {
    if (!currentUser) return;
    const isLiked = !reel.is_liked;
    const nextCount = Math.max(0, reel.likes_count + (isLiked ? 1 : -1));

    const updated = [...reels];
    updated[index] = { ...reel, is_liked: isLiked, likes_count: nextCount };
    setReels(updated);
  };

  const handleSave = async (reel: Reel, index: number) => {
    if (!currentUser) return;
    const isSaved = !reel.is_saved;
    const updated = [...reels];
    updated[index] = { ...reel, is_saved: isSaved };
    setReels(updated);
  };

  return (
    <div className="w-full flex justify-center py-0 sm:py-4 select-none">
      {/* Upload Button Float */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed top-16 right-4 sm:right-8 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold shadow-lg transition"
      >
        <Plus className="w-4 h-4" />
        <span>Create Reel</span>
      </button>

      {/* Snap Container */}
      <div
        ref={containerRef}
        className="w-full sm:max-w-[420px] h-[calc(100vh-100px)] sm:h-[82vh] overflow-y-scroll snap-y-mandatory no-scrollbar rounded-none sm:rounded-2xl bg-black relative shadow-2xl"
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white text-xs">
            Loading reels...
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-white">
            <FilmIcon className="w-12 h-12 text-neutral-500 mb-2" />
            <h4 className="text-base font-semibold">No Reels Yet</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Be the first to upload an engaging vertical reel video!
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-[#0095F6] text-white text-xs font-semibold rounded-lg"
            >
              Upload Reel
            </button>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div
              key={reel.id}
              className="w-full h-full snap-start relative flex items-center justify-center bg-black overflow-hidden"
            >
              {/* Reel Video */}
              <video
                src={reel.video_url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setIsMuted(!isMuted)}
              />

              {/* Mute indicator overlay */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm z-20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Right Engagement Action Bar */}
              <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-5 text-white">
                {/* Like */}
                <button
                  onClick={() => handleLike(reel, index)}
                  className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
                >
                  <Heart
                    className={`w-7 h-7 drop-shadow ${
                      reel.is_liked ? 'fill-[#ED4956] text-[#ED4956]' : 'text-white stroke-[2px]'
                    }`}
                  />
                  <span className="text-[11px] font-semibold drop-shadow tabular-nums">
                    {reel.likes_count > 0 ? reel.likes_count.toLocaleString() : 'Like'}
                  </span>
                </button>

                {/* Comment */}
                <button
                  onClick={() => openComments(reel.id)}
                  className="flex flex-col items-center gap-1 active:scale-110 transition-transform"
                >
                  <MessageCircle className="w-7 h-7 text-white stroke-[2px] -scale-x-100 drop-shadow" />
                  <span className="text-[11px] font-semibold drop-shadow tabular-nums">
                    {reel.comments_count || 0}
                  </span>
                </button>

                {/* Share */}
                <button
                  onClick={() => openShare(reel.id)}
                  className="flex flex-col items-center gap-1 active:scale-110 transition-transform"
                >
                  <Send className="w-7 h-7 text-white stroke-[2px] -rotate-12 drop-shadow" />
                </button>

                {/* Save */}
                <button
                  onClick={() => handleSave(reel, index)}
                  className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
                >
                  <Bookmark
                    className={`w-7 h-7 drop-shadow ${
                      reel.is_saved ? 'fill-white text-white' : 'text-white stroke-[2px]'
                    }`}
                  />
                </button>

                {/* Music Disc spinning icon */}
                <div className="w-7 h-7 rounded-full border-2 border-white/60 overflow-hidden animate-spin duration-[4000ms] flex items-center justify-center bg-neutral-900 mt-2">
                  <Music2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Bottom Details Overlay */}
              <div className="absolute left-3 right-16 bottom-4 z-20 text-white flex flex-col gap-2">
                {/* Creator Avatar & Username */}
                <div className="flex items-center gap-2.5">
                  <div
                    onClick={() => onNavigateUser(reel.user.username)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/60 cursor-pointer"
                  >
                    <img
                      src={reel.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={reel.user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    onClick={() => onNavigateUser(reel.user.username)}
                    className="text-xs font-semibold drop-shadow hover:underline cursor-pointer"
                  >
                    {reel.user.username}
                  </span>
                  <button className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-white/60 backdrop-blur-sm text-white hover:bg-white hover:text-black transition">
                    Follow
                  </button>
                </div>

                {/* Caption */}
                {reel.caption && (
                  <p className="text-xs text-white/95 line-clamp-2 drop-shadow">
                    {reel.caption}
                  </p>
                )}

                {/* Audio Title */}
                <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium drop-shadow">
                  <Music2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{reel.audio_title || 'Original Audio'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const FilmIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" strokeWidth="2" />
    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" strokeWidth="2" />
  </svg>
);
