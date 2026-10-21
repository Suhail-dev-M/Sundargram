/**
 * Sundargram - Pixel-Faithful Instagram Web Application
 * Full-Stack React + Vite + TypeScript + Tailwind CSS + Supabase
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useModalStore } from './store/useModalStore';
import { useThemeStore } from './store/useThemeStore';
import { api } from './lib/api';
import { Post, Story, Profile } from './types';

// Layout components
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { MobileTopBar } from './components/layout/MobileTopBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/common/ToastContainer';

// Feed & Views
import { StoriesTray } from './components/feed/StoriesTray';
import { PostCard } from './components/feed/PostCard';
import { SuggestionsColumn } from './components/feed/SuggestionsColumn';
import { ReelsFeed } from './components/reels/ReelsFeed';
import { ExploreGrid } from './components/explore/ExploreGrid';
import { DirectInbox } from './components/direct/DirectInbox';
import { ProfileView } from './components/profile/ProfileView';
import { AuthPage } from './components/auth/AuthPage';

// Modals
import { CreatePostModal } from './components/modals/CreatePostModal';
import { StoryViewerModal } from './components/modals/StoryViewerModal';
import { CommentsModal } from './components/modals/CommentsModal';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';
import { SettingsModal } from './components/modals/SettingsModal';
import { ShareModal } from './components/modals/ShareModal';

import { RefreshCw, Sparkles, PlusCircle } from 'lucide-react';

export default function App() {
  const { currentUser, loading: authLoading } = useAuthStore();
  const {
    isCreateOpen,
    setCreateOpen,
    isSettingsOpen,
    setSettingsOpen,
    isNotificationsOpen,
    setNotificationsOpen,
    storyUser,
    openStory,
    closeStory,
    commentsPostId,
    closeComments,
    sharePostId,
    closeShare,
  } = useModalStore();

  const [currentTab, setCurrentTab] = useState<'feed' | 'explore' | 'reels' | 'direct' | 'profile' | 'search'>('feed');
  const [targetProfileUsername, setTargetProfileUsername] = useState<string | undefined>();
  const [directTargetUsername, setDirectTargetUsername] = useState<string | undefined>();

  // Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Unread badge counts
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const fetchFeedData = async () => {
    try {
      setFeedLoading(true);
      const [feedPosts, activeStories] = await Promise.all([
        api.getFeedPosts(),
        api.getStories(),
      ]);
      setPosts(feedPosts);
      setStories(activeStories);

      if (currentUser) {
        const notifs = await api.getNotifications(currentUser.id);
        const unreadN = notifs.filter((n) => !n.is_read).length;
        setUnreadNotifs(unreadN);

        const convos = await api.getConversations(currentUser.id);
        const totalUnreadM = convos.reduce((acc, c) => acc + (c.unread_count || 0), 0);
        setUnreadMessages(totalUnreadM);
      }
    } finally {
      setFeedLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFeedData();
    }
  }, [currentUser?.id]);

  // Handle cross-tab storage sync
  useEffect(() => {
    const handleStorageChange = () => {
      if (currentUser) fetchFeedData();
    };
    window.addEventListener('sundargram-storage-sync', handleStorageChange);
    return () => window.removeEventListener('sundargram-storage-sync', handleStorageChange);
  }, [currentUser?.id]);

  const handleNavigate = (tab: string, extraParam?: string) => {
    if (tab === 'profile') {
      setTargetProfileUsername(extraParam || currentUser?.username);
      setCurrentTab('profile');
    } else if (tab === 'direct') {
      setDirectTargetUsername(extraParam);
      setCurrentTab('direct');
    } else if (tab === 'search') {
      setCurrentTab('explore');
    } else {
      setCurrentTab(tab as any);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPostFromExplore = (post: Post) => {
    setPosts([post]);
    setCurrentTab('feed');
  };

  // If checking session on initial boot
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black transition-opacity duration-200">
        <div className="font-logo text-5xl text-[#262626] dark:text-[#FAFAFA] select-none">
          Sundargram
        </div>
      </div>
    );
  }

  // If not logged in, render authentic Auth Page
  if (!currentUser) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-[#262626] dark:text-[#FAFAFA] font-ig flex flex-col">
      {/* 1. Desktop Sidebar Navigation */}
      <DesktopSidebar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        unreadMessagesCount={unreadMessages}
        unreadNotifsCount={unreadNotifs}
      />

      {/* 2. Mobile Top Bar */}
      <MobileTopBar
        onNavigate={handleNavigate}
        unreadMessagesCount={unreadMessages}
        unreadNotifsCount={unreadNotifs}
      />

      {/* 3. Main Content Viewport */}
      <main className="flex-1 lg:pl-60 xl:pl-64 flex justify-center pb-16 lg:pb-8 pt-0 sm:pt-4">
        {/* --- VIEW: FEED --- */}
        {currentTab === 'feed' && (
          <div className="w-full flex justify-center gap-8 px-0 sm:px-4">
            <div className="w-full max-w-[470px]">
              {/* Stories Tray */}
              <StoriesTray
                stories={stories}
                onSelectStory={(user) => openStory(user)}
                onAddStory={() => setCreateOpen(true)}
              />

              {/* Feed Header with Pull-to-refresh button */}
              <div className="flex items-center justify-between px-3 py-1 mb-2 text-xs text-neutral-400">
                <span>Latest updates</span>
                <button
                  onClick={() => {
                    setRefreshing(true);
                    fetchFeedData();
                  }}
                  className="flex items-center gap-1 hover:text-black dark:hover:text-white transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Posts Stream */}
              {feedLoading ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-full bg-white dark:bg-black border sm:rounded-2xl border-[#DBDBDB] dark:border-[#262626] p-4 space-y-3 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      </div>
                      <div className="w-full aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="w-full bg-white dark:bg-black border sm:rounded-2xl border-[#DBDBDB] dark:border-[#262626] p-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-3 text-neutral-400">
                    <PlusCircle className="w-8 h-8 stroke-[1.5px]" />
                  </div>
                  <h3 className="text-base font-bold text-[#262626] dark:text-[#FAFAFA]">
                    Your Feed is Empty
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                    Start by posting your first photo or load demo creators in Settings.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="px-5 py-2 bg-[#0095F6] text-white text-xs font-semibold rounded-lg hover:bg-[#1877F2] transition active:scale-95 shadow-sm"
                    >
                      Create First Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdated={(updated) => {
                        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                      }}
                      onPostDeleted={(postId) => {
                        setPosts((prev) => prev.filter((p) => p.id !== postId));
                      }}
                      onNavigateUser={(username) => handleNavigate('profile', username)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Suggestions Column */}
            <SuggestionsColumn
              onNavigateUser={(username) => handleNavigate('profile', username)}
            />
          </div>
        )}

        {/* --- VIEW: EXPLORE --- */}
        {currentTab === 'explore' && (
          <ExploreGrid
            onSelectPost={handleSelectPostFromExplore}
            onNavigateUser={(username) => handleNavigate('profile', username)}
          />
        )}

        {/* --- VIEW: REELS --- */}
        {currentTab === 'reels' && (
          <ReelsFeed onNavigateUser={(username) => handleNavigate('profile', username)} />
        )}

        {/* --- VIEW: DIRECT MESSAGES --- */}
        {currentTab === 'direct' && (
          <DirectInbox
            onNavigateUser={(username) => handleNavigate('profile', username)}
            targetUsername={directTargetUsername}
          />
        )}

        {/* --- VIEW: PROFILE --- */}
        {currentTab === 'profile' && (
          <ProfileView
            username={targetProfileUsername}
            onSelectPost={(post) => {
              setPosts([post]);
              setCurrentTab('feed');
            }}
            onNavigateDirect={(username) => handleNavigate('direct', username)}
          />
        )}
      </main>

      {/* 4. Mobile Bottom Nav */}
      <MobileBottomNav currentTab={currentTab} onNavigate={handleNavigate} />

      {/* 5. Modals & Drawers */}
      {isCreateOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => {
            fetchFeedData();
            setCurrentTab('feed');
          }}
        />
      )}

      {storyUser && (
        <StoryViewerModal
          user={storyUser}
          onClose={closeStory}
          onNavigateUser={(username) => {
            closeStory();
            handleNavigate('profile', username);
          }}
        />
      )}

      {commentsPostId && (
        <CommentsModal
          postId={commentsPostId}
          onClose={closeComments}
          onNavigateUser={(username) => {
            closeComments();
            handleNavigate('profile', username);
          }}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsDrawer
          onClose={() => setNotificationsOpen(false)}
          onNavigateUser={(username) => {
            setNotificationsOpen(false);
            handleNavigate('profile', username);
          }}
          onNavigatePost={(postId) => {
            setNotificationsOpen(false);
            api.getPostById(postId).then((p) => {
              if (p) {
                setPosts([p]);
                setCurrentTab('feed');
              }
            });
          }}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}

      {sharePostId && (
        <ShareModal postId={sharePostId} onClose={closeShare} />
      )}

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
