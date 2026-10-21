import React, { useState, useEffect } from 'react';
import { Notification } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { X, Heart, MessageCircle, UserPlus, Check, UserCheck } from 'lucide-react';

interface NotificationsDrawerProps {
  onClose: () => void;
  onNavigateUser: (username: string) => void;
  onNavigatePost: (postId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  onClose,
  onNavigateUser,
  onNavigatePost,
}) => {
  const { currentUser } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await api.getNotifications(currentUser.id);
      setNotifications(data);
      await api.markNotificationsRead(currentUser.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [currentUser?.id]);

  const timeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:top-0 sm:left-64 sm:bottom-0 sm:w-96 z-50 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-slide-right select-none">
      {/* Header */}
      <header className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#262626] dark:text-[#FAFAFA]">
          Notifications
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 rounded-lg text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900 p-2">
        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-3 text-neutral-400">
              <Heart className="w-6 h-6 stroke-[1.5px]" />
            </div>
            <p className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
              Activity on your posts
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              When people like or comment on your posts, you'll see them here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-xl flex items-center justify-between gap-3 transition ${
                notif.is_read ? '' : 'bg-blue-50/40 dark:bg-blue-950/20'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  onClick={() => {
                    onClose();
                    onNavigateUser(notif.actor.username);
                  }}
                  className="w-10 h-10 rounded-full overflow-hidden shrink-0 cursor-pointer border border-neutral-200 dark:border-neutral-800"
                >
                  <img
                    src={notif.actor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={notif.actor.username}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-xs leading-normal min-w-0">
                  <span
                    onClick={() => {
                      onClose();
                      onNavigateUser(notif.actor.username);
                    }}
                    className="font-semibold text-[#262626] dark:text-[#FAFAFA] hover:underline cursor-pointer mr-1"
                  >
                    {notif.actor.username}
                  </span>

                  {notif.type === 'like' && 'liked your post.'}
                  {notif.type === 'comment' && 'commented on your post.'}
                  {notif.type === 'follow' && 'started following you.'}
                  {notif.type === 'follow_request' && 'requested to follow you.'}

                  <span className="text-[11px] text-neutral-400 ml-1.5">
                    {timeAgo(notif.created_at)}
                  </span>
                </div>
              </div>

              {/* Action / Thumbnail */}
              {notif.type === 'follow_request' ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      // Confirm follow
                      api.toggleFollow(notif.actor_id, currentUser!.id);
                      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#0095F6] text-white rounded-lg hover:bg-[#1877F2]"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                    className="px-2.5 py-1 text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              ) : notif.type === 'follow' ? (
                <button
                  onClick={() => api.toggleFollow(currentUser!.id, notif.actor_id)}
                  className="px-3 py-1 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 rounded-lg shrink-0"
                >
                  Follow Back
                </button>
              ) : notif.post && (
                <div
                  onClick={() => {
                    onClose();
                    onNavigatePost(notif.post!.id);
                  }}
                  className="w-10 h-10 rounded-lg overflow-hidden shrink-0 cursor-pointer border border-neutral-200 dark:border-neutral-800"
                >
                  <img
                    src={notif.post.media[0]?.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
