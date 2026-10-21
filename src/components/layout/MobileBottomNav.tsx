import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import { Home, Search, PlusSquare, Film } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string, extraParam?: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onNavigate }) => {
  const { currentUser } = useAuthStore();
  const { setCreateOpen } = useModalStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-13 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-[#DBDBDB] dark:border-[#262626] flex items-center justify-around px-2 select-none">
      {/* 1. Home */}
      <button
        onClick={() => onNavigate('feed')}
        aria-label="Home"
        className="min-w-[48px] min-h-[48px] flex items-center justify-center text-[#262626] dark:text-[#FAFAFA] active:scale-90 transition-transform"
      >
        <Home className={`w-6 h-6 ${currentTab === 'feed' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
      </button>

      {/* 2. Search / Explore */}
      <button
        onClick={() => onNavigate('explore')}
        aria-label="Search"
        className="min-w-[48px] min-h-[48px] flex items-center justify-center text-[#262626] dark:text-[#FAFAFA] active:scale-90 transition-transform"
      >
        <Search className={`w-6 h-6 ${currentTab === 'explore' || currentTab === 'search' ? 'stroke-[2.8px]' : 'stroke-[1.8px]'}`} />
      </button>

      {/* 3. Create */}
      <button
        onClick={() => setCreateOpen(true)}
        aria-label="Create Post"
        className="min-w-[48px] min-h-[48px] flex items-center justify-center text-[#262626] dark:text-[#FAFAFA] active:scale-90 transition-transform"
      >
        <PlusSquare className="w-6 h-6 stroke-[1.8px]" />
      </button>

      {/* 4. Reels */}
      <button
        onClick={() => onNavigate('reels')}
        aria-label="Reels"
        className="min-w-[48px] min-h-[48px] flex items-center justify-center text-[#262626] dark:text-[#FAFAFA] active:scale-90 transition-transform"
      >
        <Film className={`w-6 h-6 ${currentTab === 'reels' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
      </button>

      {/* 5. Profile */}
      <button
        onClick={() => onNavigate('profile', currentUser?.username)}
        aria-label="Profile"
        className="min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-90 transition-transform"
      >
        <div
          className={`w-7 h-7 rounded-full p-0.5 ${
            currentTab === 'profile'
              ? 'ring-2 ring-[#262626] dark:ring-[#FAFAFA]'
              : 'border border-neutral-300 dark:border-neutral-700'
          }`}
        >
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </button>
    </nav>
  );
};
