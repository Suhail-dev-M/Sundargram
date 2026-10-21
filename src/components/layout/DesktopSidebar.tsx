import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import {
  Home,
  Search,
  Compass,
  Film,
  Send,
  Heart,
  PlusSquare,
  Menu,
  Settings,
  LogOut,
} from 'lucide-react';

interface DesktopSidebarProps {
  currentTab: string;
  onNavigate: (tab: string, extraParam?: string) => void;
  unreadMessagesCount?: number;
  unreadNotifsCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onNavigate,
  unreadMessagesCount = 0,
  unreadNotifsCount = 0,
}) => {
  const { currentUser, logout } = useAuthStore();
  const { setCreateOpen, setSettingsOpen, setNotificationsOpen, isNotificationsOpen } = useModalStore();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const navItems = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search, onClick: () => onNavigate('search') },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'reels', label: 'Reels', icon: Film },
    {
      id: 'direct',
      label: 'Messages',
      icon: Send,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Heart,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      onClick: () => setNotificationsOpen(!isNotificationsOpen),
    },
    {
      id: 'create',
      label: 'Create',
      icon: PlusSquare,
      onClick: () => setCreateOpen(true),
    },
    {
      id: 'profile',
      label: 'Profile',
      isProfile: true,
      onClick: () => onNavigate('profile', currentUser?.username),
    },
  ];

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 xl:w-64 border-r border-[#DBDBDB] dark:border-[#262626] bg-white dark:bg-black flex-col justify-between p-4 z-30 select-none">
      <div>
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('feed')}
          className="pt-6 pb-8 px-3 cursor-pointer"
        >
          <Logo size="lg" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              (currentTab === item.id && !item.onClick) ||
              (item.id === 'notifications' && isNotificationsOpen);

            if (item.isProfile) {
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-150 text-sm font-medium text-left ${
                    currentTab === 'profile'
                      ? 'font-bold text-[#262626] dark:text-[#FAFAFA]'
                      : 'text-[#262626] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-neutral-300 dark:border-neutral-700">
                    <img
                      src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={currentUser?.username || 'Profile'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="truncate">{currentUser?.username || 'Profile'}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={item.onClick ? item.onClick : () => onNavigate(item.id)}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition duration-150 text-sm font-medium text-left relative ${
                  isActive
                    ? 'font-bold text-[#262626] dark:text-[#FAFAFA]'
                    : 'text-[#262626] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <div className="relative shrink-0">
                  {Icon && (
                    <Icon
                      className={`w-6 h-6 transition-transform ${
                        isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'
                      }`}
                    />
                  )}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-[#ED4956] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & More Menu */}
      <div className="relative pt-2 border-t border-neutral-100 dark:border-neutral-900">
        {/* More Button */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium text-[#262626] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
        >
          <Menu className="w-6 h-6 stroke-[1.8px]" />
          <span>More</span>
        </button>

        {/* More Menu Dropdown */}
        {isMoreMenuOpen && (
          <div className="absolute bottom-16 left-2 right-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-40 animate-slide-up">
            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                setSettingsOpen(true);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              <span>Settings</span>
            </button>

            <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />

            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
