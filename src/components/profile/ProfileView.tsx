import React, { useState, useEffect } from 'react';
import { Profile, Post, Reel } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import { api } from '../../lib/api';
import { EditProfileModal } from './EditProfileModal';
import {
  Grid,
  Film,
  Bookmark,
  Tag,
  Lock,
  Settings,
  Heart,
  MessageCircle,
  Plus,
  Check,
  UserCheck,
} from 'lucide-react';

interface ProfileViewProps {
  username?: string;
  onSelectPost: (post: Post) => void;
  onNavigateDirect: (username: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  username,
  onSelectPost,
  onNavigateDirect,
}) => {
  const { currentUser } = useAuthStore();
  const { setSettingsOpen } = useModalStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = currentUser?.username === profile?.username;

  const loadProfile = async () => {
    if (!targetUsername) return;
    try {
      setLoading(true);
      const userProfile = await api.getProfile(targetUsername);
      setProfile(userProfile);

      if (userProfile) {
        const userPosts = await api.getUserPosts(userProfile.id);
        setPosts(userPosts);

        if (currentUser) {
          const followCheck = await api.isFollowing(currentUser.id, userProfile.id);
          setIsFollowing(followCheck);

          if (currentUser.id === userProfile.id) {
            const saved = await api.getSavedPosts(currentUser.id);
            setSavedPosts(saved);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetUsername, currentUser?.id]);

  const handleToggleFollow = async () => {
    if (!currentUser || !profile) return;
    const res = await api.toggleFollow(currentUser.id, profile.id);
    if (res.status === 'accepted') {
      setIsFollowing(true);
      setIsPending(false);
      setProfile({ ...profile, followers_count: profile.followers_count + 1 });
    } else if (res.status === 'pending') {
      setIsPending(true);
      setIsFollowing(false);
    } else {
      setIsFollowing(false);
      setIsPending(false);
      setProfile({ ...profile, followers_count: Math.max(0, profile.followers_count - 1) });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 text-center text-xs text-neutral-400">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 text-center">
        <h3 className="text-base font-bold text-[#262626] dark:text-[#FAFAFA]">
          Sorry, this page isn't available.
        </h3>
        <p className="text-xs text-neutral-400 mt-2">
          The link you followed may be broken, or the user may have been removed.
        </p>
      </div>
    );
  }

  const isLocked = profile.is_private && !isOwnProfile && !isFollowing;

  // Highlights list
  const highlights = [
    { title: 'Highlights', cover: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150' },
    { title: 'Travel', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150' },
    { title: 'Studio', cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-8 select-none">
      {/* 1. Profile Header Stats & Info */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12 pb-6 sm:pb-10 border-b border-[#DBDBDB] dark:border-[#262626]">
        {/* Avatar with Story Ring */}
        <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-full story-ring-unseen p-[2.5px] shrink-0 self-center sm:self-auto cursor-pointer">
          <div className="w-full h-full rounded-full p-[2.5px] bg-white dark:bg-black">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={profile.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Profile Info & Actions Column */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          {/* Top Row: Username + Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-normal text-[#262626] dark:text-[#FAFAFA]">
              {profile.username}
            </h1>

            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#262626] dark:text-[#FAFAFA] transition active:scale-95"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  title="Settings"
                  className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Settings className="w-5 h-5 stroke-[1.8px]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isFollowing ? (
                  <button
                    onClick={handleToggleFollow}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#262626] dark:text-[#FAFAFA] transition active:scale-95"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Following</span>
                  </button>
                ) : isPending ? (
                  <button
                    onClick={handleToggleFollow}
                    className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-500 transition"
                  >
                    Requested
                  </button>
                ) : (
                  <button
                    onClick={handleToggleFollow}
                    className="px-5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#0095F6] text-white hover:bg-[#1877F2] transition active:scale-95 shadow-sm"
                  >
                    Follow
                  </button>
                )}

                <button
                  onClick={() => onNavigateDirect(profile.username)}
                  className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#262626] dark:text-[#FAFAFA] transition active:scale-95"
                >
                  Message
                </button>
              </div>
            )}
          </div>

          {/* Middle Row: Quantitative Stats (posts, followers, following) */}
          <div className="flex items-center gap-6 sm:gap-10 text-xs sm:text-sm">
            <div>
              <span className="font-semibold text-[#262626] dark:text-[#FAFAFA] tabular-nums mr-1">
                {posts.length}
              </span>
              <span className="text-neutral-500">posts</span>
            </div>
            <div>
              <span className="font-semibold text-[#262626] dark:text-[#FAFAFA] tabular-nums mr-1">
                {profile.followers_count.toLocaleString()}
              </span>
              <span className="text-neutral-500">followers</span>
            </div>
            <div>
              <span className="font-semibold text-[#262626] dark:text-[#FAFAFA] tabular-nums mr-1">
                {profile.following_count.toLocaleString()}
              </span>
              <span className="text-neutral-500">following</span>
            </div>
          </div>

          {/* Bottom Row: Full name, Bio, Website */}
          <div className="flex flex-col text-xs sm:text-sm leading-relaxed">
            <span className="font-semibold text-[#262626] dark:text-[#FAFAFA]">
              {profile.full_name}
            </span>
            {profile.bio && (
              <p className="whitespace-pre-line text-[#262626] dark:text-[#FAFAFA] mt-0.5">
                {profile.bio}
              </p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#00376B] dark:text-[#E0F1FF] hover:underline mt-1 truncate"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 2. Story Highlights Row */}
      <div className="flex items-center gap-4 sm:gap-6 py-4 sm:py-6 overflow-x-auto no-scrollbar border-b border-[#DBDBDB] dark:border-[#262626]">
        {highlights.map((h, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-neutral-300 dark:border-neutral-700 p-0.5 group-hover:scale-105 transition-transform">
              <img src={h.cover} alt="" className="w-full h-full rounded-full object-cover" />
            </div>
            <span className="text-[11px] font-normal text-neutral-800 dark:text-neutral-200">
              {h.title}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Grid Tabs Bar */}
      <div className="flex items-center justify-center gap-10 border-b border-transparent text-xs font-semibold uppercase tracking-wider select-none">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
            activeTab === 'posts'
              ? 'border-[#262626] dark:border-[#FAFAFA] text-[#262626] dark:text-[#FAFAFA]'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Posts</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
            activeTab === 'reels'
              ? 'border-[#262626] dark:border-[#FAFAFA] text-[#262626] dark:text-[#FAFAFA]'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Reels</span>
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
              activeTab === 'saved'
                ? 'border-[#262626] dark:border-[#FAFAFA] text-[#262626] dark:text-[#FAFAFA]'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('tagged')}
          className={`flex items-center gap-2 py-3 border-t-2 -mt-[1px] transition ${
            activeTab === 'tagged'
              ? 'border-[#262626] dark:border-[#FAFAFA] text-[#262626] dark:text-[#FAFAFA]'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Tagged</span>
        </button>
      </div>

      {/* 4. Tab Content or Private Lock */}
      {isLocked ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full border-2 border-[#262626] dark:border-[#FAFAFA] flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 stroke-[1.8px]" />
          </div>
          <h4 className="text-sm font-bold text-[#262626] dark:text-[#FAFAFA]">
            This Account is Private
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
            Follow this account to see their photos and videos.
          </p>
        </div>
      ) : activeTab === 'saved' ? (
        savedPosts.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400">
            Only you can see what you've saved.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-4 mt-2">
            {savedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="aspect-square bg-neutral-900 overflow-hidden cursor-pointer relative group rounded-none sm:rounded-lg"
              >
                <img
                  src={post.media[0]?.media_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-3 text-neutral-400">
            <Grid className="w-6 h-6 stroke-[1.5px]" />
          </div>
          <h4 className="text-base font-bold text-[#262626] dark:text-[#FAFAFA]">
            No Posts Yet
          </h4>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-4 mt-2">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="aspect-square bg-neutral-900 overflow-hidden cursor-pointer relative group rounded-none sm:rounded-lg"
            >
              <img
                src={post.media[0]?.media_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />

              {/* Hover metric overlay */}
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
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
};
