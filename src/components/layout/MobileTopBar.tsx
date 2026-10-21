import React from 'react';
import { Logo } from '../common/Logo';
import { useModalStore } from '../../store/useModalStore';
import { Heart, Send } from 'lucide-react';

interface MobileTopBarProps {
  onNavigate: (tab: string) => void;
  unreadMessagesCount?: number;
  unreadNotifsCount?: number;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onNavigate,
  unreadMessagesCount = 0,
  unreadNotifsCount = 0,
}) => {
  const { setNotificationsOpen, isNotificationsOpen } = useModalStore();

  return (
    <header className="lg:hidden sticky top-0 z-40 h-12 w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-[#DBDBDB] dark:border-[#262626] flex items-center justify-between px-4 select-none">
      {/* Brand Wordmark */}
      <div onClick={() => onNavigate('feed')} className="cursor-pointer py-1">
        <Logo size="sm" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications Heart */}
        <button
          onClick={() => setNotificationsOpen(!isNotificationsOpen)}
          aria-label="Notifications"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center relative text-[#262626] dark:text-[#FAFAFA] active:scale-90 transition-transform"
        >
          <Heart className={`w-6 h-6 ${isNotificationsOpen ? 'fill-[#ED4956] text-[#ED4956]' : 'stroke-[1.8px]'}`} />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-2.5 right-2 w-2 h-2 rounded-full bg-[#ED4956]" />
          )}
        </button>

        {/* Direct Messages Icon */}
        <button
          onClick={() => onNavigate('direct')}
          aria-label="Direct Messages"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center relative text-[#262626] dark:text-[#FAFAFA] active:scale-90 transition-transform"
        >
          <Send className="w-6 h-6 stroke-[1.8px] -rotate-12" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-[#ED4956] text-white text-[9px] font-bold px-1 py-0.2 rounded-full min-w-[16px] text-center">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
