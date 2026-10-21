import React, { useState, useEffect } from 'react';
import { Post, Profile } from '../../types';
import { api } from '../../lib/api';
import { Search, Heart, MessageCircle, Film } from 'lucide-react';

interface ExploreGridProps {
  onSelectPost: (post: Post) => void;
  onNavigateUser: (username: string) => void;
}

export const ExploreGrid: React.FC<ExploreGridProps> = ({ onSelectPost, onNavigateUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExploreData() {
      try {
        setLoading(true);
        const allPosts = await api.getFeedPosts();
        setPosts(allPosts);
      } finally {
        setLoading(false);
      }
    }
    loadExploreData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await api.searchProfiles(searchQuery);
      setSearchResults(results);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 px-1 sm:px-4 select-none">
      {/* Search Input Bar */}
      <div className="relative mb-4 sm:mb-6 px-2 sm:px-0">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 stroke-[2px]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts or #hashtags"
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>

        {/* Live Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-11 left-2 sm:left-0 right-2 sm:right-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-30 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-72 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSearchQuery('');
                  onNavigateUser(user.username);
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-800">
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                    {user.username}
                  </span>
                  <span className="text-xs text-neutral-400">{user.full_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explore Grid of Posts */}
      {loading ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-4 animate-pulse">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-none sm:rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="p-16 text-center text-xs text-neutral-400">
          No posts available to explore yet. Share a post or seed sample data in Settings!
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {posts.map((post, idx) => {
            const isTall = idx % 5 === 2; // authentic Instagram explore grid style
            const media = post.media[0];
            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className={`relative group cursor-pointer overflow-hidden bg-neutral-900 rounded-none sm:rounded-lg ${
                  isTall ? 'row-span-2 aspect-[1/2]' : 'aspect-square'
                }`}
              >
                {media?.media_type === 'video' ? (
                  <video
                    src={media.media_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={media?.media_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                )}

                {/* Media type icon badge */}
                {post.media.length > 1 && (
                  <div className="absolute top-2 right-2 text-white/90 drop-shadow">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M4 6h16v12H4z" opacity=".4" />
                      <path d="M2 4h16v12H2z" />
                    </svg>
                  </div>
                )}
                {media?.media_type === 'video' && (
                  <div className="absolute top-2 right-2 text-white/90 drop-shadow">
                    <Film className="w-4 h-4 stroke-[2px]" />
                  </div>
                )}

                {/* Hover overlay with Like and Comment metrics */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5 text-white font-semibold text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    <span>{post.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white -scale-x-100" />
                    <span>{post.comments_count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
