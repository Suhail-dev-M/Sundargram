import React, { useState, useEffect } from 'react';
import { Comment, Post } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import { api } from '../../lib/api';
import { X, Heart, Trash2, CornerDownRight, Smile } from 'lucide-react';

interface CommentsModalProps {
  postId: string;
  onClose: () => void;
  onNavigateUser: (username: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ postId, onClose, onNavigateUser }) => {
  const { currentUser } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const [postData, commentList] = await Promise.all([
        api.getPostById(postId),
        api.getComments(postId),
      ]);
      setPost(postData);
      setComments(commentList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser || submitting) return;

    try {
      setSubmitting(true);
      const parentId = replyingTo ? replyingTo.id : null;
      await api.addComment(postId, currentUser, newCommentText.trim(), parentId);
      setNewCommentText('');
      setReplyingTo(null);
      await fetchComments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!currentUser) return;
    const ok = await api.deleteComment(commentId, currentUser.id);
    if (ok) {
      await fetchComments();
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-lg h-[80vh] sm:h-[650px] bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 select-none">
          <div className="w-6" />
          <h3 className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
            Comments
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Comments Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-neutral-100 dark:divide-neutral-900">
          {/* Post Caption (First row) */}
          {post && post.caption && (
            <div className="flex gap-3 py-3">
              <div
                onClick={() => onNavigateUser(post.user.username)}
                className="w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer"
              >
                <img
                  src={post.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={post.user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <span
                  onClick={() => onNavigateUser(post.user.username)}
                  className="font-semibold text-[#262626] dark:text-[#FAFAFA] mr-1.5 cursor-pointer hover:underline"
                >
                  {post.user.username}
                </span>
                <span className="text-[#262626] dark:text-[#FAFAFA]">{post.caption}</span>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {timeAgo(post.created_at)}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-neutral-400">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">No comments yet.</p>
              <p className="text-xs text-neutral-400 mt-1">Start the conversation.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="py-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      onClick={() => onNavigateUser(comment.user.username)}
                      className="w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer"
                    >
                      <img
                        src={comment.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={comment.user.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-xs sm:text-sm">
                      <div className="leading-tight">
                        <span
                          onClick={() => onNavigateUser(comment.user.username)}
                          className="font-semibold text-[#262626] dark:text-[#FAFAFA] mr-1.5 cursor-pointer hover:underline"
                        >
                          {comment.user.username}
                        </span>
                        <span className="text-[#262626] dark:text-[#FAFAFA]">{comment.content}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-[11px] text-neutral-400 font-medium">
                        <span>{timeAgo(comment.created_at)}</span>
                        <button
                          onClick={() => {
                            setReplyingTo({ id: comment.id, username: comment.user.username });
                            setNewCommentText(`@${comment.user.username} `);
                          }}
                          className="hover:text-neutral-600 dark:hover:text-neutral-200"
                        >
                          Reply
                        </button>
                        {currentUser?.id === comment.user_id && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-rose-400 hover:text-rose-600 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button className="text-neutral-400 hover:text-[#ED4956] transition p-1">
                    <Heart className="w-3.5 h-3.5 stroke-[1.8px]" />
                  </button>
                </div>

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-11 flex flex-col gap-2 mt-1">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start justify-between gap-3 group">
                        <div className="flex items-start gap-2.5 flex-1">
                          <div
                            onClick={() => onNavigateUser(reply.user.username)}
                            className="w-6 h-6 rounded-full overflow-hidden shrink-0 cursor-pointer"
                          >
                            <img
                              src={reply.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                              alt={reply.user.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 text-xs">
                            <span
                              onClick={() => onNavigateUser(reply.user.username)}
                              className="font-semibold text-[#262626] dark:text-[#FAFAFA] mr-1 cursor-pointer hover:underline"
                            >
                              {reply.user.username}
                            </span>
                            <span className="text-[#262626] dark:text-[#FAFAFA]">{reply.content}</span>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                              <span>{timeAgo(reply.created_at)}</span>
                              {currentUser?.id === reply.user_id && (
                                <button
                                  onClick={() => handleDelete(reply.id)}
                                  className="text-rose-400 hover:text-rose-600"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-3 h-3 text-[#0095F6]" />
              Replying to @{replyingTo.username}
            </span>
            <button
              onClick={() => {
                setReplyingTo(null);
                setNewCommentText('');
              }}
              className="text-neutral-400 hover:text-black dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
              alt="You"
              className="w-full h-full object-cover"
            />
          </div>
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : 'Add a comment...'}
            className="flex-1 bg-neutral-100 dark:bg-neutral-800 px-3.5 py-2 rounded-full text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] placeholder:text-[#8E8E8E] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || submitting}
            className="text-xs sm:text-sm font-semibold text-[#0095F6] hover:text-[#1877F2] disabled:opacity-40 transition cursor-pointer px-2"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};
