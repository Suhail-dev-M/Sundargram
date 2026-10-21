import { Profile, Post, Comment, Story, Reel, Follow, Message, Conversation, Notification } from '../types';
import { DEMO_USERS, DEMO_POSTS, DEMO_STORIES, DEMO_REELS } from './mockData';

const K_SESSION = 'sundargram_current_user_id';
const K_PROFILES = 'sundargram_profiles_v1';
const K_POSTS = 'sundargram_posts_v1';
const K_COMMENTS = 'sundargram_comments_v1';
const K_FOLLOWS = 'sundargram_follows_v1';
const K_STORIES = 'sundargram_stories_v1';
const K_REELS = 'sundargram_reels_v1';
const K_SAVES = 'sundargram_saves_v1';
const K_LIKES = 'sundargram_likes_v1';
const K_CONVERSATIONS = 'sundargram_conversations_v1';
const K_MESSAGES = 'sundargram_messages_v1';
const K_NOTIFICATIONS = 'sundargram_notifications_v1';

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new CustomEvent('sundargram-storage-sync', { detail: { key } }));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export const localStore = {
  // Session
  getCurrentUserId(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(K_SESSION) : null;
  },
  setCurrentUserId(id: string | null) {
    if (typeof window === 'undefined') return;
    if (id) {
      localStorage.setItem(K_SESSION, id);
    } else {
      localStorage.removeItem(K_SESSION);
    }
    window.dispatchEvent(new CustomEvent('sundargram-auth-changed'));
  },

  // Profiles
  getProfiles(): Profile[] {
    return getItem<Profile[]>(K_PROFILES, []);
  },
  getProfileById(id: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  },
  getProfileByUsername(username: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.username.toLowerCase() === username.toLowerCase()) || null;
  },
  saveProfile(profile: Profile): void {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile, updated_at: new Date().toISOString() };
    } else {
      profiles.push({ ...profile, created_at: new Date().toISOString() });
    }
    setItem(K_PROFILES, profiles);
  },

  // Posts
  getPosts(): Post[] {
    const currentUserId = this.getCurrentUserId();
    const likes = getItem<Record<string, boolean>>(K_LIKES, {});
    const saves = getItem<Record<string, boolean>>(K_SAVES, {});
    const posts = getItem<Post[]>(K_POSTS, []);

    return posts.map((p) => ({
      ...p,
      is_liked: Boolean(currentUserId && likes[`${currentUserId}_${p.id}`]),
      is_saved: Boolean(currentUserId && saves[`${currentUserId}_${p.id}`]),
    }));
  },
  getPostById(id: string): Post | null {
    const posts = this.getPosts();
    return posts.find((p) => p.id === id) || null;
  },
  savePost(post: Post): void {
    const posts = getItem<Post[]>(K_POSTS, []);
    posts.unshift(post);
    setItem(K_POSTS, posts);

    // Update user post count
    const author = this.getProfileById(post.user_id);
    if (author) {
      this.saveProfile({
        ...author,
        posts_count: (author.posts_count || 0) + 1,
      });
    }
  },
  deletePost(postId: string, userId: string): boolean {
    const posts = getItem<Post[]>(K_POSTS, []);
    const postToDelete = posts.find((p) => p.id === postId);
    if (!postToDelete || postToDelete.user_id !== userId) return false;

    const filtered = posts.filter((p) => p.id !== postId);
    setItem(K_POSTS, filtered);

    const author = this.getProfileById(userId);
    if (author) {
      this.saveProfile({
        ...author,
        posts_count: Math.max(0, (author.posts_count || 0) - 1),
      });
    }
    return true;
  },

  // Likes
  togglePostLike(postId: string, userId: string): { isLiked: boolean; newCount: number } {
    const likes = getItem<Record<string, boolean>>(K_LIKES, {});
    const key = `${userId}_${postId}`;
    const wasLiked = Boolean(likes[key]);
    const isLiked = !wasLiked;

    if (isLiked) {
      likes[key] = true;
    } else {
      delete likes[key];
    }
    setItem(K_LIKES, likes);

    const posts = getItem<Post[]>(K_POSTS, []);
    let newCount = 0;
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.likes_count = Math.max(0, post.likes_count + (isLiked ? 1 : -1));
      newCount = post.likes_count;
      setItem(K_POSTS, posts);

      // Create notification if liked and not self
      if (isLiked && post.user_id !== userId) {
        this.addNotification({
          id: 'notif_' + Date.now(),
          recipient_id: post.user_id,
          actor_id: userId,
          type: 'like',
          entity_id: postId,
          is_read: false,
          created_at: new Date().toISOString(),
          actor: this.getProfileById(userId)!,
          post,
        });
      }
    }
    return { isLiked, newCount };
  },

  // Saves
  togglePostSave(postId: string, userId: string): boolean {
    const saves = getItem<Record<string, boolean>>(K_SAVES, {});
    const key = `${userId}_${postId}`;
    const wasSaved = Boolean(saves[key]);
    const isSaved = !wasSaved;

    if (isSaved) {
      saves[key] = true;
    } else {
      delete saves[key];
    }
    setItem(K_SAVES, saves);
    return isSaved;
  },

  // Comments
  getComments(postId: string): Comment[] {
    const all = getItem<Comment[]>(K_COMMENTS, []);
    return all.filter((c) => c.post_id === postId);
  },
  addComment(comment: Comment): void {
    const all = getItem<Comment[]>(K_COMMENTS, []);
    all.push(comment);
    setItem(K_COMMENTS, all);

    // Update post comments count
    const posts = getItem<Post[]>(K_POSTS, []);
    const post = posts.find((p) => p.id === comment.post_id);
    if (post) {
      post.comments_count = (post.comments_count || 0) + 1;
      setItem(K_POSTS, posts);

      // Notification
      if (post.user_id !== comment.user_id) {
        this.addNotification({
          id: 'notif_' + Date.now(),
          recipient_id: post.user_id,
          actor_id: comment.user_id,
          type: 'comment',
          entity_id: comment.post_id,
          is_read: false,
          created_at: new Date().toISOString(),
          actor: comment.user,
          post,
        });
      }
    }
  },
  deleteComment(commentId: string, userId: string): boolean {
    const all = getItem<Comment[]>(K_COMMENTS, []);
    const comment = all.find((c) => c.id === commentId);
    if (!comment || comment.user_id !== userId) return false;

    const filtered = all.filter((c) => c.id !== commentId && c.parent_id !== commentId);
    setItem(K_COMMENTS, filtered);

    const posts = getItem<Post[]>(K_POSTS, []);
    const post = posts.find((p) => p.id === comment.post_id);
    if (post) {
      post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
      setItem(K_POSTS, posts);
    }
    return true;
  },

  // Follows
  getFollows(): Follow[] {
    return getItem<Follow[]>(K_FOLLOWS, []);
  },
  isFollowing(followerId: string, followingId: string): boolean {
    const follows = this.getFollows();
    return follows.some((f) => f.follower_id === followerId && f.following_id === followingId && f.status === 'accepted');
  },
  isPendingFollow(followerId: string, followingId: string): boolean {
    const follows = this.getFollows();
    return follows.some((f) => f.follower_id === followerId && f.following_id === followingId && f.status === 'pending');
  },
  toggleFollow(followerId: string, followingId: string): { status: 'none' | 'pending' | 'accepted' } {
    const follows = this.getFollows();
    const existingIdx = follows.findIndex((f) => f.follower_id === followerId && f.following_id === followingId);

    const targetUser = this.getProfileById(followingId);
    const followerUser = this.getProfileById(followerId);

    if (existingIdx >= 0) {
      // Unfollow
      const wasAccepted = follows[existingIdx].status === 'accepted';
      follows.splice(existingIdx, 1);
      setItem(K_FOLLOWS, follows);

      if (wasAccepted && targetUser && followerUser) {
        this.saveProfile({ ...targetUser, followers_count: Math.max(0, targetUser.followers_count - 1) });
        this.saveProfile({ ...followerUser, following_count: Math.max(0, followerUser.following_count - 1) });
      }
      return { status: 'none' };
    } else {
      // Follow
      const targetIsPrivate = targetUser?.is_private ?? false;
      const status: 'pending' | 'accepted' = targetIsPrivate ? 'pending' : 'accepted';

      follows.push({
        id: 'flw_' + Date.now(),
        follower_id: followerId,
        following_id: followingId,
        status,
        created_at: new Date().toISOString(),
      });
      setItem(K_FOLLOWS, follows);

      if (status === 'accepted' && targetUser && followerUser) {
        this.saveProfile({ ...targetUser, followers_count: targetUser.followers_count + 1 });
        this.saveProfile({ ...followerUser, following_count: followerUser.following_count + 1 });
      }

      // Notification
      if (targetUser && followerUser) {
        this.addNotification({
          id: 'notif_' + Date.now(),
          recipient_id: followingId,
          actor_id: followerId,
          type: targetIsPrivate ? 'follow_request' : 'follow',
          is_read: false,
          created_at: new Date().toISOString(),
          actor: followerUser,
        });
      }

      return { status };
    }
  },

  // Stories
  getStories(): Story[] {
    const stories = getItem<Story[]>(K_STORIES, []);
    const now = new Date().toISOString();
    return stories.filter((s) => s.expires_at > now);
  },
  addStory(story: Story): void {
    const stories = getItem<Story[]>(K_STORIES, []);
    stories.unshift(story);
    setItem(K_STORIES, stories);
  },

  // Reels
  getReels(): Reel[] {
    const currentUserId = this.getCurrentUserId();
    const likes = getItem<Record<string, boolean>>(K_LIKES, {});
    const saves = getItem<Record<string, boolean>>(K_SAVES, {});
    const reels = getItem<Reel[]>(K_REELS, []);

    return reels.map((r) => ({
      ...r,
      is_liked: Boolean(currentUserId && likes[`${currentUserId}_${r.id}`]),
      is_saved: Boolean(currentUserId && saves[`${currentUserId}_${r.id}`]),
    }));
  },
  addReel(reel: Reel): void {
    const reels = getItem<Reel[]>(K_REELS, []);
    reels.unshift(reel);
    setItem(K_REELS, reels);
  },

  // Notifications
  getNotifications(userId: string): Notification[] {
    const notifs = getItem<Notification[]>(K_NOTIFICATIONS, []);
    return notifs.filter((n) => n.recipient_id === userId);
  },
  addNotification(notif: Notification): void {
    const notifs = getItem<Notification[]>(K_NOTIFICATIONS, []);
    notifs.unshift(notif);
    setItem(K_NOTIFICATIONS, notifs);
  },
  markNotificationsAsRead(userId: string): void {
    const notifs = getItem<Notification[]>(K_NOTIFICATIONS, []);
    const updated = notifs.map((n) => (n.recipient_id === userId ? { ...n, is_read: true } : n));
    setItem(K_NOTIFICATIONS, updated);
  },

  // Direct Messages
  getConversations(userId: string): Conversation[] {
    const convos = getItem<Conversation[]>(K_CONVERSATIONS, []);
    const messages = getItem<Message[]>(K_MESSAGES, []);

    return convos
      .filter((c) => c.members.some((m) => m.id === userId))
      .map((c) => {
        const convoMessages = messages.filter((m) => m.conversation_id === c.id);
        const lastMessage = convoMessages[convoMessages.length - 1];
        const unreadCount = convoMessages.filter((m) => m.sender_id !== userId && !m.is_read).length;
        return {
          ...c,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },
  getMessages(convoId: string): Message[] {
    const messages = getItem<Message[]>(K_MESSAGES, []);
    return messages.filter((m) => m.conversation_id === convoId);
  },
  sendMessage(message: Message): void {
    const messages = getItem<Message[]>(K_MESSAGES, []);
    messages.push(message);
    setItem(K_MESSAGES, messages);

    const convos = getItem<Conversation[]>(K_CONVERSATIONS, []);
    const convo = convos.find((c) => c.id === message.conversation_id);
    if (convo) {
      convo.updated_at = new Date().toISOString();
      setItem(K_CONVERSATIONS, convos);
    }
  },
  deleteMessage(messageId: string, userId: string): boolean {
    const messages = getItem<Message[]>(K_MESSAGES, []);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.sender_id !== userId) return false;

    const filtered = messages.filter((m) => m.id !== messageId);
    setItem(K_MESSAGES, filtered);
    return true;
  },
  getOrCreateConversation(user1: Profile, user2: Profile): Conversation {
    const convos = getItem<Conversation[]>(K_CONVERSATIONS, []);
    const existing = convos.find(
      (c) => c.members.some((m) => m.id === user1.id) && c.members.some((m) => m.id === user2.id)
    );
    if (existing) return existing;

    const newConvo: Conversation = {
      id: 'convo_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [user1, user2],
    };
    convos.unshift(newConvo);
    setItem(K_CONVERSATIONS, convos);
    return newConvo;
  },

  // Seed Helper for Testing
  seedDemoData(): void {
    setItem(K_PROFILES, DEMO_USERS);
    setItem(K_POSTS, DEMO_POSTS);
    setItem(K_STORIES, DEMO_STORIES);
    setItem(K_REELS, DEMO_REELS);
    window.dispatchEvent(new CustomEvent('sundargram-storage-sync', { detail: { key: 'all' } }));
  },

  clearAllData(): void {
    localStorage.removeItem(K_SESSION);
    localStorage.removeItem(K_PROFILES);
    localStorage.removeItem(K_POSTS);
    localStorage.removeItem(K_COMMENTS);
    localStorage.removeItem(K_FOLLOWS);
    localStorage.removeItem(K_STORIES);
    localStorage.removeItem(K_REELS);
    localStorage.removeItem(K_SAVES);
    localStorage.removeItem(K_LIKES);
    localStorage.removeItem(K_CONVERSATIONS);
    localStorage.removeItem(K_MESSAGES);
    localStorage.removeItem(K_NOTIFICATIONS);
    window.dispatchEvent(new CustomEvent('sundargram-storage-sync', { detail: { key: 'all' } }));
    window.dispatchEvent(new CustomEvent('sundargram-auth-changed'));
  }
};
