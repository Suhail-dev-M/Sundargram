import React, { useState, useRef } from 'react';
import { Post, Comment, Profile } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import { api } from '../../lib/api';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Smile,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PostCardProps {
  post: Post;
  onPostUpdated?: (updated: Post) => void;
  onPostDeleted?: (postId: string) => void;
  onNavigateUser: (username: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostUpdated,
  onPostDeleted,
  onNavigateUser,
}) => {
  const { currentUser } = useAuthStore();
  const { openComments, openShare } = useModalStore();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(Boolean(post.is_liked));
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isSaved, setIsSaved] = useState(Boolean(post.is_saved));
  const [isExpandedCaption, setIsExpandedCaption] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const lastTapRef = useRef<number>(0);

  const mediaList = post.media && post.media.length > 0
    ? post.media
    : [{ id: 'm1', post_id: post.id, media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', media_type: 'image' as const, order_index: 0 }];

  // Double tap to like
  const handleMediaTouchOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered
      if (!isLiked && currentUser) {
        handleLike();
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const nextLiked = !isLiked;
    const nextCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));

    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    if (nextLiked) {
      try {
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.7 },
          colors: ['#ED4956', '#FF6B81', '#FF4757'],
          disableForReducedMotion: true,
        });
      } catch {
        // quiet fallback
      }
    }

    try {
      const res = await api.toggleLike(post.id, currentUser.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.newCount);
      onPostUpdated?.({ ...post, is_liked: res.isLiked, likes_count: res.newCount });
    } catch (err) {
      // rollback
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      const saved = await api.toggleSave(post.id, currentUser.id);
      setIsSaved(saved);
      onPostUpdated?.({ ...post, is_saved: saved });
    } catch {
      setIsSaved(!nextSaved);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      await api.addComment(post.id, currentUser, commentInput.trim());
      setCommentInput('');
      const newCount = (post.comments_count || 0) + 1;
      onPostUpdated?.({ ...post, comments_count: newCount });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser || currentUser.id !== post.user_id) return;
    const confirmed = window.confirm('Delete this post?');
    if (!confirmed) return;

    const ok = await api.deletePost(post.id, currentUser.id);
    if (ok) {
      onPostDeleted?.(post.id);
    }
  };

  const timeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const currentMedia = mediaList[currentMediaIndex];

  return (
    <article className="w-full bg-white dark:bg-black border-b sm:border sm:rounded-2xl border-[#DBDBDB] dark:border-[#262626] mb-4 sm:mb-6 overflow-hidden">
      {/* 1. Header: Avatar + Username + Location + More */}
      <header className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => onNavigateUser(post.user.username)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full story-ring-unseen p-[1.5px] cursor-pointer"
          >
            <div className="w-full h-full rounded-full p-[1.5px] bg-white dark:bg-black">
              <img
                src={post.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={post.user.username}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => onNavigateUser(post.user.username)}
                className="text-xs sm:text-sm font-semibold text-[#262626] dark:text-[#FAFAFA] hover:opacity-75 cursor-pointer leading-tight"
              >
                {post.user.username}
              </span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className="text-[11px] sm:text-xs text-[#8E8E8E]">
                {timeAgo(post.created_at)}
              </span>
            </div>

            {post.location && (
              <span className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                {post.location}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-label="More options"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-10 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              {currentUser?.id === post.user_id ? (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDeletePost();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    openShare(post.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-left"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share to Direct</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 2. Media Carousel / Container */}
      <div
        onClick={handleMediaTouchOrClick}
        className="relative w-full aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden cursor-pointer select-none group"
      >
        {currentMedia.media_type === 'video' ? (
          <video
            src={currentMedia.media_url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentMedia.media_url}
            alt={post.caption || 'Post media'}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Big Double-Tap Heart Burst */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping duration-300 z-10">
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]" />
          </div>
        )}

        {/* Carousel Prev/Next Buttons */}
        {mediaList.length > 1 && (
          <>
            {currentMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((i) => i - 1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm shadow hover:bg-black/80 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentMediaIndex < mediaList.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((i) => i + 1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm shadow hover:bg-black/80 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Dots indicator */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
              {mediaList.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentMediaIndex ? 'bg-[#0095F6] w-2 h-2' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3. Action Buttons Row */}
      <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Like Heart */}
          <button
            onClick={handleLike}
            aria-label={isLiked ? 'Unlike' : 'Like'}
            className="active:scale-125 transition-transform duration-150"
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked
                  ? 'fill-[#ED4956] text-[#ED4956]'
                  : 'text-[#262626] dark:text-[#FAFAFA] stroke-[1.8px] hover:text-neutral-500'
              }`}
            />
          </button>

          {/* Comment Bubble */}
          <button
            onClick={() => openComments(post.id)}
            aria-label="Comment"
            className="active:scale-110 transition-transform duration-150"
          >
            <MessageCircle className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA] stroke-[1.8px] -scale-x-100 hover:text-neutral-500" />
          </button>

          {/* Share Paper Plane */}
          <button
            onClick={() => openShare(post.id)}
            aria-label="Share"
            className="active:scale-110 transition-transform duration-150"
          >
            <Send className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA] stroke-[1.8px] -rotate-12 hover:text-neutral-500" />
          </button>
        </div>

        {/* Save Bookmark */}
        <button
          onClick={handleSave}
          aria-label={isSaved ? 'Remove from saved' : 'Save'}
          className="active:scale-125 transition-transform duration-150"
        >
          <Bookmark
            className={`w-6 h-6 transition-colors ${
              isSaved
                ? 'fill-[#262626] dark:fill-[#FAFAFA] text-[#262626] dark:text-[#FAFAFA]'
                : 'text-[#262626] dark:text-[#FAFAFA] stroke-[1.8px] hover:text-neutral-500'
            }`}
          />
        </button>
      </div>

      {/* 4. Likes Count */}
      <div className="px-3.5 py-1">
        <span className="text-xs sm:text-sm font-semibold text-[#262626] dark:text-[#FAFAFA] tabular-nums">
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </span>
      </div>

      {/* 5. Caption with Truncate toggle */}
      {post.caption && (
        <div className="px-3.5 py-0.5 text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] leading-normal">
          <span
            onClick={() => onNavigateUser(post.user.username)}
            className="font-semibold mr-1.5 cursor-pointer hover:underline"
          >
            {post.user.username}
          </span>
          <span>
            {isExpandedCaption || post.caption.length <= 90
              ? post.caption
              : `${post.caption.slice(0, 90)}...`}
          </span>
          {post.caption.length > 90 && !isExpandedCaption && (
            <button
              onClick={() => setIsExpandedCaption(true)}
              className="text-[#8E8E8E] text-xs ml-1 hover:underline font-medium"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* 6. View All Comments Trigger */}
      {(post.comments_count || 0) > 0 && (
        <div className="px-3.5 py-1">
          <button
            onClick={() => openComments(post.id)}
            className="text-xs text-[#8E8E8E] hover:underline"
          >
            View all {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
          </button>
        </div>
      )}

      {/* 7. Inline Comment Form (Desktop / Feed) */}
      <form
        onSubmit={handleCommentSubmit}
        className="hidden sm:flex items-center justify-between px-3.5 py-2.5 mt-1 border-t border-neutral-100 dark:border-neutral-900"
      >
        <div className="flex items-center gap-2 flex-1">
          <Smile className="w-5 h-5 text-neutral-400 stroke-[1.8px] shrink-0 cursor-pointer hover:text-neutral-600" />
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] placeholder:text-[#8E8E8E] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!commentInput.trim() || isSubmittingComment}
          className="text-xs sm:text-sm font-semibold text-[#0095F6] hover:text-[#1877F2] disabled:opacity-40 transition ml-2 cursor-pointer disabled:cursor-default"
        >
          Post
        </button>
      </form>
    </article>
  );
};
