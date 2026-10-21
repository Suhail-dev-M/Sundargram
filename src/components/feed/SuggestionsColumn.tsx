import React, { useState, useEffect } from 'react';
import { Profile } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { DEMO_USERS } from '../../lib/mockData';

interface SuggestionsColumnProps {
  onNavigateUser: (username: string) => void;
}

export const SuggestionsColumn: React.FC<SuggestionsColumnProps> = ({ onNavigateUser }) => {
  const { currentUser, logout } = useAuthStore();
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const all = await api.searchProfiles('');
      // Filter out current user
      const filtered = (all.length > 0 ? all : DEMO_USERS).filter(
        (u) => u.id !== currentUser?.id
      );
      setSuggestions(filtered.slice(0, 5));
    }
    load();
  }, [currentUser?.id]);

  const handleFollow = async (user: Profile) => {
    if (!currentUser) return;
    const isNowFollowing = !followingMap[user.id];
    setFollowingMap((prev) => ({ ...prev, [user.id]: isNowFollowing }));
    await api.toggleFollow(currentUser.id, user.id);
  };

  if (!currentUser) return null;

  return (
    <aside className="hidden xl:block w-80 shrink-0 pt-4 px-4 select-none">
      {/* Current User Row */}
      <div className="flex items-center justify-between mb-6">
        <div
          onClick={() => onNavigateUser(currentUser.username)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={currentUser.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#262626] dark:text-[#FAFAFA] group-hover:underline">
              {currentUser.username}
            </span>
            <span className="text-xs text-neutral-400">{currentUser.full_name}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-xs font-semibold text-[#0095F6] hover:text-[#1877F2]"
        >
          Switch
        </button>
      </div>

      {/* Suggestions Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-neutral-500">Suggested for you</span>
        <button className="font-semibold text-[#262626] dark:text-[#FAFAFA] hover:opacity-75">
          See All
        </button>
      </div>

      {/* Suggested Users List */}
      <div className="flex flex-col gap-3">
        {suggestions.map((user) => {
          const isFollowing = Boolean(followingMap[user.id]);
          return (
            <div key={user.id} className="flex items-center justify-between">
              <div
                onClick={() => onNavigateUser(user.username)}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#262626] dark:text-[#FAFAFA] group-hover:underline">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-neutral-400">Popular on Sundargram</span>
                </div>
              </div>

              <button
                onClick={() => handleFollow(user)}
                className={`text-xs font-semibold transition ${
                  isFollowing
                    ? 'text-neutral-500 hover:text-black dark:hover:text-white'
                    : 'text-[#0095F6] hover:text-[#1877F2]'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quiet Footer Links */}
      <footer className="mt-8 text-[11px] text-neutral-400 leading-relaxed">
        <p>About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language</p>
        <p className="mt-4">© 2026 SUNDARGRAM FROM BUILD</p>
      </footer>
    </aside>
  );
};
