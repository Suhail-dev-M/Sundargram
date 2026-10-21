import React from 'react';
import { Story, Profile } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import { Plus } from 'lucide-react';

interface StoriesTrayProps {
  stories: Story[];
  onSelectStory: (user: Profile) => void;
  onAddStory: () => void;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({ stories, onSelectStory, onAddStory }) => {
  const { currentUser } = useAuthStore();

  // Group stories by user
  const userStoryMap = new Map<string, { user: Profile; hasUnseen: boolean; count: number }>();

  stories.forEach((s) => {
    const existing = userStoryMap.get(s.user_id);
    const isUnseen = !s.is_seen;
    if (existing) {
      existing.hasUnseen = existing.hasUnseen || isUnseen;
      existing.count += 1;
    } else {
      userStoryMap.set(s.user_id, {
        user: s.user,
        hasUnseen: isUnseen,
        count: 1,
      });
    }
  });

  const storyUsers = Array.from(userStoryMap.values());
  const myStories = currentUser ? userStoryMap.get(currentUser.id) : null;
  const otherStories = storyUsers.filter((item) => item.user.id !== currentUser?.id);

  return (
    <div className="w-full bg-white dark:bg-black border-b sm:border sm:rounded-2xl border-[#DBDBDB] dark:border-[#262626] py-3 px-2 sm:px-4 mb-4 select-none">
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
        {/* Current User Story Item */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div className="relative">
            {myStories ? (
              <div
                onClick={() => onSelectStory(currentUser!)}
                className="w-16 h-16 sm:w-17 sm:h-17 rounded-full p-[2px] story-ring-unseen transition-transform duration-200 group-active:scale-95"
              >
                <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-black">
                  <img
                    src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                    alt="Your story"
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ) : (
              <div
                onClick={onAddStory}
                className="w-16 h-16 sm:w-17 sm:h-17 rounded-full p-[2px] bg-neutral-200 dark:bg-neutral-800 transition-transform duration-200 group-active:scale-95"
              >
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Blue Plus badge if no stories or add more */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddStory();
              }}
              title="Add story"
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095F6] text-white flex items-center justify-center border-2 border-white dark:border-black shadow-sm hover:bg-[#1877F2] transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            </button>
          </div>
          <span className="text-[11px] text-neutral-800 dark:text-neutral-300 font-normal truncate max-w-[66px] text-center">
            Your story
          </span>
        </div>

        {/* Other Users' Stories */}
        {otherStories.map(({ user, hasUnseen }) => (
          <div
            key={user.id}
            onClick={() => onSelectStory(user)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div
              className={`w-16 h-16 sm:w-17 sm:h-17 rounded-full p-[2px] transition-transform duration-200 group-active:scale-95 ${
                hasUnseen ? 'story-ring-unseen' : 'story-ring-seen'
              }`}
            >
              <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-black">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <span className="text-[11px] text-neutral-800 dark:text-neutral-300 font-normal truncate max-w-[66px] text-center">
              {user.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
