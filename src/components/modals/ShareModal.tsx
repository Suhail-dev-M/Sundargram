import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore, showToast } from '../../store/useModalStore';
import { api } from '../../lib/api';
import { Profile } from '../../types';
import { X, Link2, Send, Check } from 'lucide-react';

interface ShareModalProps {
  postId: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ postId, onClose }) => {
  const { currentUser } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const all = await api.searchProfiles('');
      setProfiles(all.filter((p) => p.id !== currentUser?.id));
    }
    load();
  }, [currentUser?.id]);

  const handleCopyLink = () => {
    const url = window.location.origin + `?post=${postId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToDirect = async () => {
    if (!currentUser || !selectedUser || sending) return;

    try {
      setSending(true);
      const convo = await api.getOrCreateConversation(currentUser, selectedUser);
      await api.sendMessage(
        convo.id,
        currentUser,
        `Shared a post: ${window.location.origin}?post=${postId}`,
        undefined,
        postId
      );
      showToast(`Sent to @${selectedUser.username}!`, 'success');
      onClose();
    } catch {
      showToast('Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="w-6" />
          <h3 className="text-sm font-bold text-[#262626] dark:text-[#FAFAFA]">
            Share Post
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* List of recipients */}
        <div className="p-3 max-h-60 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
          {profiles.map((p) => {
            const isSelected = selectedUser?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedUser(isSelected ? null : p)}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                  isSelected ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700">
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#262626] dark:text-[#FAFAFA]">
                      {p.username}
                    </span>
                    <span className="text-[11px] text-neutral-400">{p.full_name}</span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-[#0095F6] border-[#0095F6] text-white'
                      : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
          {selectedUser ? (
            <button
              onClick={handleSendToDirect}
              disabled={sending}
              className="w-full py-2 bg-[#0095F6] text-white text-xs font-semibold rounded-xl hover:bg-[#1877F2] transition active:scale-98"
            >
              {sending ? 'Sending...' : `Send to ${selectedUser.username}`}
            </button>
          ) : (
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-100 dark:bg-neutral-800 text-[#262626] dark:text-[#FAFAFA] text-xs font-semibold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
