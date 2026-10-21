import React, { useState, useEffect, useRef } from 'react';
import { Story, Profile } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { X, Heart, Send, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface StoryViewerModalProps {
  user: Profile;
  onClose: () => void;
  onNavigateUser: (username: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ user, onClose, onNavigateUser }) => {
  const { currentUser } = useAuthStore();
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);

  const STORY_DURATION = 5000; // 5 seconds per story
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    async function loadUserStories() {
      const allStories = await api.getStories();
      const filtered = allStories.filter((s) => s.user_id === user.id);
      setUserStories(filtered);
      setCurrentIndex(0);
      setProgress(0);
    }
    loadUserStories();
  }, [user.id]);

  // Timer loop
  useEffect(() => {
    if (userStories.length === 0 || isPaused) return;

    const intervalTime = 50;
    const step = (intervalTime / STORY_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story
          if (currentIndex < userStories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            // Finished all stories
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(progressIntervalRef.current);
  }, [currentIndex, userStories.length, isPaused]);

  const handleNext = () => {
    if (currentIndex < userStories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !currentUser) return;

    try {
      const convo = await api.getOrCreateConversation(currentUser, user);
      await api.sendMessage(
        convo.id,
        currentUser,
        `Replied to story: ${replyText.trim()}`
      );
      setReplyText('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2000);
    } catch {
      // quiet fallback
    }
  };

  const handleSendReaction = async () => {
    if (!currentUser) return;
    try {
      const convo = await api.getOrCreateConversation(currentUser, user);
      await api.sendMessage(convo.id, currentUser, '❤️');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2000);
    } catch {
      // quiet fallback
    }
  };

  if (userStories.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <div className="text-white text-sm">Loading story...</div>
      </div>
    );
  }

  const currentStory = userStories[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 select-none animate-fade-in">
      {/* Backdrop Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white hover:opacity-75 transition"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Story Container (9:16 mobile aspect) */}
      <div
        className="relative w-full h-full sm:h-[88vh] sm:max-w-sm sm:rounded-2xl overflow-hidden bg-black flex flex-col justify-between shadow-2xl"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars Row */}
        <div className="absolute top-0 left-0 right-0 z-30 p-2.5 flex items-center gap-1.5 bg-gradient-to-b from-black/70 to-transparent">
          {userStories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info Header */}
        <div className="absolute top-5 left-0 right-0 z-30 px-3.5 pt-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onNavigateUser(user.username);
              }}
              className="w-8 h-8 rounded-full overflow-hidden border border-white/40 cursor-pointer"
            >
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold drop-shadow">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateUser(user.username);
                }}
                className="hover:underline cursor-pointer"
              >
                {user.username}
              </span>
              <span className="text-white/60">·</span>
              <span className="text-[11px] font-normal text-white/80">Active now</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused(!isPaused);
            }}
            className="text-white/80 hover:text-white p-1"
          >
            {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
          </button>
        </div>

        {/* Story Media Viewer */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {currentStory.media_type === 'video' ? (
            <video
              src={currentStory.media_url}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}

          {/* Touch Nav Areas: Left 35% is Prev, Right 65% is Next */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-16 bottom-20 w-2/3 z-20 cursor-pointer"
          />
        </div>

        {/* Bottom Reply Bar */}
        <div className="relative z-30 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center gap-2">
          {replySent ? (
            <div className="w-full py-2 text-center text-xs text-emerald-400 font-semibold bg-emerald-950/60 rounded-full border border-emerald-500/30">
              Reply sent to DM!
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder={`Reply to ${user.username}...`}
                className="flex-1 bg-white/20 border border-white/30 text-white placeholder:text-white/70 px-4 py-2 rounded-full text-xs focus:outline-none focus:border-white"
              />
              {replyText.trim() ? (
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-[#0095F6] text-white flex items-center justify-center hover:bg-[#1877F2] transition shrink-0"
                >
                  <Send className="w-4 h-4 stroke-[2px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendReaction}
                  className="w-9 h-9 flex items-center justify-center text-white/90 hover:text-[#ED4956] hover:scale-110 active:scale-95 transition shrink-0"
                >
                  <Heart className="w-6 h-6 stroke-[1.8px]" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
