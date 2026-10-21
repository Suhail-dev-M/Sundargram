import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Profile } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import {
  Send,
  Image as ImageIcon,
  ArrowLeft,
  Trash2,
  CheckCheck,
  Check,
  Smile,
  Info,
  Phone,
  Video,
} from 'lucide-react';

interface DirectInboxProps {
  onNavigateUser: (username: string) => void;
  targetUsername?: string;
}

export const DirectInbox: React.FC<DirectInboxProps> = ({ onNavigateUser, targetUsername }) => {
  const { currentUser } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const convos = await api.getConversations(currentUser.id);
      setConversations(convos);

      // If targetUsername was provided, open or create conversation with them
      if (targetUsername) {
        const target = await api.getProfile(targetUsername);
        if (target && target.id !== currentUser.id) {
          const directConvo = await api.getOrCreateConversation(currentUser, target);
          setActiveConvo(directConvo);
        }
      } else if (!activeConvo && convos.length > 0) {
        setActiveConvo(convos[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentUser?.id, targetUsername]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    async function loadMessages() {
      const msgs = await api.getMessages(activeConvo!.id);
      setMessages(msgs);
      scrollToBottom();
    }
    loadMessages();

    // Polling / Realtime interval for local mode simulation
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeConvo?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentUser || !activeConvo) return;

    const text = inputText.trim();
    setInputText('');

    const newMsg = await api.sendMessage(activeConvo.id, currentUser, text);
    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !activeConvo) return;

    const preview = URL.createObjectURL(file);
    api.sendMessage(activeConvo.id, currentUser, undefined, preview).then((newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    });
  };

  const handleUnsend = async (messageId: string) => {
    if (!currentUser) return;
    const ok = await api.unsendMessage(messageId, currentUser.id);
    if (ok) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const getOtherUser = (convo: Conversation): Profile | undefined => {
    return convo.members.find((m) => m.id !== currentUser?.id) || convo.members[0];
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] sm:h-[82vh] max-w-5xl mx-auto bg-white dark:bg-black border sm:border border-[#DBDBDB] dark:border-[#262626] sm:rounded-2xl overflow-hidden flex shadow-xl select-none">
      {/* LEFT COLUMN: Conversation List */}
      <div
        className={`w-full sm:w-80 md:w-96 border-r border-[#DBDBDB] dark:border-[#262626] flex flex-col ${
          activeConvo ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Inbox Header */}
        <header className="px-4 py-3.5 border-b border-[#DBDBDB] dark:border-[#262626] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#262626] dark:text-[#FAFAFA]">
            {currentUser?.username}
          </h2>
          <span className="text-xs text-neutral-400 font-medium">Messages</span>
        </header>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No conversations yet.<br />Visit a profile to send a direct message!
            </div>
          ) : (
            conversations.map((convo) => {
              const other = getOtherUser(convo);
              const isSelected = activeConvo?.id === convo.id;
              return (
                <div
                  key={convo.id}
                  onClick={() => setActiveConvo(convo)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-900'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-950'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-800">
                    <img
                      src={other?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={other?.username || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-[#262626] dark:text-[#FAFAFA] truncate">
                        {other?.username || 'User'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {convo.last_message?.content ||
                        (convo.last_message?.media_url ? 'Sent an image' : 'Started conversation')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Thread */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-black ${
          activeConvo ? 'flex' : 'hidden sm:flex items-center justify-center'
        }`}
      >
        {activeConvo ? (
          <>
            {/* Chat Top Header */}
            <header className="px-4 py-3 border-b border-[#DBDBDB] dark:border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConvo(null)}
                  className="sm:hidden text-neutral-600 dark:text-neutral-300 p-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {getOtherUser(activeConvo) && (
                  <div
                    onClick={() => onNavigateUser(getOtherUser(activeConvo)!.username)}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
                      <img
                        src={getOtherUser(activeConvo)?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                        {getOtherUser(activeConvo)?.username}
                      </span>
                      <span className="text-[10px] text-neutral-400">Active now</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                <Phone className="w-5 h-5 stroke-[1.8px] cursor-pointer hover:opacity-75" />
                <Video className="w-5 h-5 stroke-[1.8px] cursor-pointer hover:opacity-75" />
                <Info className="w-5 h-5 stroke-[1.8px] cursor-pointer hover:opacity-75" />
              </div>
            </header>

            {/* Message History Bubble List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 max-w-[75%]">
                      {isMine && (
                        <button
                          onClick={() => handleUnsend(msg.id)}
                          title="Unsend message"
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          isMine
                            ? 'bg-[#0095F6] text-white rounded-br-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-[#262626] dark:text-[#FAFAFA] rounded-bl-xs'
                        }`}
                      >
                        {msg.content && <p>{msg.content}</p>}
                        {msg.media_url && (
                          <img
                            src={msg.media_url}
                            alt=""
                            className="max-h-60 rounded-lg object-cover mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <span className="text-[9px] text-neutral-400 mt-1 px-1 flex items-center gap-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {isMine && <CheckCheck className="w-3 h-3 text-[#0095F6]" />}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[#DBDBDB] dark:border-[#262626] flex items-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-neutral-500 hover:text-black dark:hover:text-white"
              >
                <ImageIcon className="w-5 h-5 stroke-[1.8px]" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-2 text-xs sm:text-sm text-[#262626] dark:text-[#FAFAFA] focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-3 text-xs sm:text-sm font-semibold text-[#0095F6] disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#262626] dark:border-[#FAFAFA] flex items-center justify-center mb-4">
              <Send className="w-10 h-10 stroke-[1.5px] -rotate-12 ml-1" />
            </div>
            <h3 className="text-lg font-bold text-[#262626] dark:text-[#FAFAFA]">
              Your Messages
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Send private photos and messages to a friend or creator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
