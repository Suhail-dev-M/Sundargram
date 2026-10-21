import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { localStore } from './localStore';
import { smartApiRequest, invalidateSmartCache } from './smartClient';
import { Profile, Post, Comment, Story, Reel, Follow, Message, Conversation, Notification } from '../types';

export const api = {
  // --- AUTH ---
  async getCurrentUser(): Promise<Profile | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        return (profile as Profile) || null;
      } catch (err) {
        console.warn('Supabase auth check failed, checking local store:', err);
      }
    }

    const currentId = localStore.getCurrentUserId();
    if (!currentId) return null;
    return localStore.getProfileById(currentId);
  },

  async signUp(email: string, pass: string, username: string, fullName: string, avatarUrl?: string): Promise<{ user: Profile | null; error?: string }> {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (!cleanUsername) return { user: null, error: 'Valid username required' };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              username: cleanUsername,
              full_name: fullName,
              avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
            },
          },
        });
        if (error) return { user: null, error: error.message };

        if (data.user) {
          // ensure profile row exists
          const profile: Profile = {
            id: data.user.id,
            username: cleanUsername,
            full_name: fullName,
            avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
            bio: '',
            is_private: false,
            posts_count: 0,
            followers_count: 0,
            following_count: 0,
          };
          await supabase.from('profiles').upsert(profile);
          return { user: profile };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Sign up error';
        return { user: null, error: message };
      }
    }

    // Local Mode
    const existing = localStore.getProfileByUsername(cleanUsername);
    if (existing) {
      return { user: null, error: 'Username is already taken' };
    }

    const newId = 'usr_' + Date.now();
    const newProfile: Profile = {
      id: newId,
      username: cleanUsername,
      full_name: fullName,
      avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      bio: '',
      is_private: false,
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
    };

    localStore.saveProfile(newProfile);
    localStore.setCurrentUserId(newId);
    return { user: newProfile };
  },

  async signIn(identifier: string, pass: string): Promise<{ user: Profile | null; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: pass,
        });
        if (error) return { user: null, error: error.message };
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          return { user: (profile as Profile) || null };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Sign in error';
        return { user: null, error: message };
      }
    }

    // Local Mode: search by username or simulate login
    const profile = localStore.getProfileByUsername(identifier) || localStore.getProfiles()[0];
    if (profile) {
      localStore.setCurrentUserId(profile.id);
      return { user: profile };
    }

    return { user: null, error: 'User not found. Please sign up first.' };
  },

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }
    localStore.setCurrentUserId(null);
  },

  // --- PROFILES ---
  async getProfile(usernameOrId: string): Promise<Profile | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
        const data = await smartApiRequest<Profile>(
          () => {
            const query = supabase.from('profiles').select('*');
            return isUUID ? query.eq('id', usernameOrId).single() : query.eq('username', usernameOrId).single();
          },
          { dedupKey: `profile_${usernameOrId}`, cacheTtlMs: 15000, retries: 2 }
        );
        if (data) return data;
      } catch (err) {
        console.warn('Supabase getProfile failed, fallback to localStore:', err);
      }
    }

    return localStore.getProfileById(usernameOrId) || localStore.getProfileByUsername(usernameOrId);
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const data = await smartApiRequest<Profile>(
          () => supabase.from('profiles').update(updates).eq('id', id).select().single(),
          { retries: 2 }
        );
        invalidateSmartCache(`profile_`);
        invalidateSmartCache('feed_');
        if (data) return data;
      } catch (err) {
        console.warn('Supabase updateProfile failed:', err);
      }
    }

    const current = localStore.getProfileById(id);
    if (!current) return null;
    const updated = { ...current, ...updates };
    localStore.saveProfile(updated);
    invalidateSmartCache(`profile_`);
    return updated;
  },

  async searchProfiles(query: string): Promise<Profile[]> {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const data = await smartApiRequest<Profile[]>(
          () => supabase.from('profiles').select('*').or(`username.ilike.%${clean}%,full_name.ilike.%${clean}%`).limit(15),
          { dedupKey: `search_${clean}`, cacheTtlMs: 5000, retries: 1 }
        );
        if (data) return data;
      } catch (err) {
        console.warn('Supabase searchProfiles failed:', err);
      }
    }

    return localStore.getProfiles().filter(
      (p) => p.username.toLowerCase().includes(clean) || p.full_name.toLowerCase().includes(clean)
    );
  },

  // --- POSTS & FEED ---
  async getFeedPosts(): Promise<Post[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const rawPosts = await smartApiRequest<any[]>(
          () => supabase.from('posts').select(`*, user:profiles(*), media:post_media(*)`).order('created_at', { ascending: false }).limit(30),
          { dedupKey: 'feed_posts_main', cacheTtlMs: 3000, retries: 2 }
        );

        if (rawPosts) {
          // get current user like & save status
          const { data: { user } } = await supabase.auth.getUser();
          const currentUserId = user?.id;

          let likedPostIds = new Set<string>();
          let savedPostIds = new Set<string>();

          if (currentUserId) {
            const { data: userLikes } = await supabase
              .from('likes')
              .select('post_id')
              .eq('user_id', currentUserId);
            if (userLikes) likedPostIds = new Set(userLikes.map((l: any) => l.post_id));

            const { data: userSaves } = await supabase
              .from('saves')
              .select('post_id')
              .eq('user_id', currentUserId);
            if (userSaves) savedPostIds = new Set(userSaves.map((s: any) => s.post_id));
          }

          return rawPosts.map((p: any) => ({
            ...p,
            media: (p.media || []).sort((a: any, b: any) => a.order_index - b.order_index),
            is_liked: likedPostIds.has(p.id),
            is_saved: savedPostIds.has(p.id),
          })) as Post[];
        }
      } catch (err) {
        console.warn('Supabase getFeedPosts failed, falling back to localStore:', err);
      }
    }

    return localStore.getPosts();
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const all = await this.getFeedPosts();
    return all.filter((p) => p.user_id === userId);
  },

  async getPostById(postId: string): Promise<Post | null> {
    const all = await this.getFeedPosts();
    return all.find((p) => p.id === postId) || null;
  },

  async createPost(
    user: Profile,
    caption: string,
    mediaItems: { media_url: string; media_type: 'image' | 'video'; aspect_ratio: string }[],
    location?: string
  ): Promise<Post> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: post, error } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            caption,
            location: location || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert media items
        const mediaToInsert = mediaItems.map((m, idx) => ({
          post_id: post.id,
          media_url: m.media_url,
          media_type: m.media_type,
          aspect_ratio: m.aspect_ratio || '1:1',
          order_index: idx,
        }));

        const { data: insertedMedia } = await supabase
          .from('post_media')
          .insert(mediaToInsert)
          .select();

        invalidateSmartCache('feed_');
        return {
          ...post,
          user,
          media: insertedMedia || [],
          is_liked: false,
          is_saved: false,
        } as Post;
      } catch (err) {
        console.warn('Supabase createPost error, using local fallback:', err);
      }
    }

    // Local Mode
    const newPostId = 'pst_' + Date.now();
    const newPost: Post = {
      id: newPostId,
      user_id: user.id,
      caption,
      location,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      user,
      media: mediaItems.map((m, idx) => ({
        id: `med_${newPostId}_${idx}`,
        post_id: newPostId,
        media_url: m.media_url,
        media_type: m.media_type,
        aspect_ratio: m.aspect_ratio,
        order_index: idx,
      })),
      is_liked: false,
      is_saved: false,
    };

    localStore.savePost(newPost);
    invalidateSmartCache('feed_');
    return newPost;
  },

  async deletePost(postId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', userId);
        if (!error) {
          invalidateSmartCache('feed_');
          return true;
        }
      } catch (err) {
        console.warn('Supabase deletePost error:', err);
      }
    }
    invalidateSmartCache('feed_');
    return localStore.deletePost(postId, userId);
  },

  // --- LIKES ---
  async toggleLike(postId: string, userId: string): Promise<{ isLiked: boolean; newCount: number }> {
    invalidateSmartCache('feed_');
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single();

        if (existing) {
          await supabase.from('likes').delete().eq('id', existing.id);
          const post = await this.getPostById(postId);
          return { isLiked: false, newCount: Math.max(0, (post?.likes_count || 1) - 1) };
        } else {
          await supabase.from('likes').insert({ post_id: postId, user_id: userId });
          const post = await this.getPostById(postId);
          return { isLiked: true, newCount: (post?.likes_count || 0) + 1 };
        }
      } catch (err) {
        console.warn('Supabase toggleLike failed, fallback to localStore:', err);
      }
    }

    return localStore.togglePostLike(postId, userId);
  },

  // --- SAVES ---
  async toggleSave(postId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('saves')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single();

        if (existing) {
          await supabase.from('saves').delete().eq('id', existing.id);
          return false;
        } else {
          await supabase.from('saves').insert({ post_id: postId, user_id: userId });
          return true;
        }
      } catch (err) {
        console.warn('Supabase toggleSave failed:', err);
      }
    }

    return localStore.togglePostSave(postId, userId);
  },

  async getSavedPosts(userId: string): Promise<Post[]> {
    const all = await this.getFeedPosts();
    return all.filter((p) => p.is_saved);
  },

  // --- COMMENTS ---
  async getComments(postId: string): Promise<Comment[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            user:profiles(*)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          // group nested replies
          const topLevel: Comment[] = [];
          const replyMap: Record<string, Comment[]> = {};

          data.forEach((c: any) => {
            if (c.parent_id) {
              if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
              replyMap[c.parent_id].push(c);
            } else {
              topLevel.push(c);
            }
          });

          return topLevel.map((c) => ({
            ...c,
            replies: replyMap[c.id] || [],
          }));
        }
      } catch (err) {
        console.warn('Supabase getComments failed:', err);
      }
    }

    const all = localStore.getComments(postId);
    const topLevel: Comment[] = [];
    const replyMap: Record<string, Comment[]> = {};

    all.forEach((c) => {
      if (c.parent_id) {
        if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
        replyMap[c.parent_id].push(c);
      } else {
        topLevel.push(c);
      }
    });

    return topLevel.map((c) => ({
      ...c,
      replies: replyMap[c.id] || [],
    }));
  },

  async addComment(postId: string, user: Profile, content: string, parentId?: string | null): Promise<Comment> {
    const clean = content.trim();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            user_id: user.id,
            content: clean,
            parent_id: parentId || null,
          })
          .select(`*, user:profiles(*)`)
          .single();

        if (!error && data) return data as Comment;
      } catch (err) {
        console.warn('Supabase addComment failed:', err);
      }
    }

    const comment: Comment = {
      id: 'cmt_' + Date.now(),
      post_id: postId,
      user_id: user.id,
      parent_id: parentId || null,
      content: clean,
      likes_count: 0,
      created_at: new Date().toISOString(),
      user,
      replies: [],
    };
    localStore.addComment(comment);
    return comment;
  },

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('user_id', userId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteComment error:', err);
      }
    }
    return localStore.deleteComment(commentId, userId);
  },

  // --- FOLLOWS ---
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('follows')
          .select('status')
          .eq('follower_id', followerId)
          .eq('following_id', followingId)
          .single();
        return data?.status === 'accepted';
      } catch {
        return false;
      }
    }
    return localStore.isFollowing(followerId, followingId);
  },

  async toggleFollow(followerId: string, followingId: string): Promise<{ status: 'none' | 'pending' | 'accepted' }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', followerId)
          .eq('following_id', followingId)
          .single();

        if (existing) {
          await supabase.from('follows').delete().eq('id', existing.id);
          return { status: 'none' };
        } else {
          const target = await this.getProfile(followingId);
          const status = target?.is_private ? 'pending' : 'accepted';
          await supabase.from('follows').insert({
            follower_id: followerId,
            following_id: followingId,
            status,
          });
          return { status };
        }
      } catch (err) {
        console.warn('Supabase toggleFollow failed:', err);
      }
    }

    return localStore.toggleFollow(followerId, followingId);
  },

  // --- STORIES ---
  async getStories(): Promise<Story[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select(`*, user:profiles(*)`)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (!error && data) return data as Story[];
      } catch (err) {
        console.warn('Supabase getStories failed:', err);
      }
    }

    return localStore.getStories();
  },

  async createStory(user: Profile, mediaUrl: string, mediaType: 'image' | 'video' = 'image'): Promise<Story> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            media_url: mediaUrl,
            media_type: mediaType,
          })
          .select(`*, user:profiles(*)`)
          .single();

        if (!error && data) return data as Story;
      } catch (err) {
        console.warn('Supabase createStory failed:', err);
      }
    }

    const story: Story = {
      id: 'sty_' + Date.now(),
      user_id: user.id,
      media_url: mediaUrl,
      media_type: mediaType,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      user,
      is_seen: false,
    };
    localStore.addStory(story);
    return story;
  },

  // --- REELS ---
  async getReels(): Promise<Reel[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reels')
          .select(`*, user:profiles(*)`)
          .order('created_at', { ascending: false });

        if (!error && data) return data as Reel[];
      } catch (err) {
        console.warn('Supabase getReels failed:', err);
      }
    }

    return localStore.getReels();
  },

  async createReel(user: Profile, videoUrl: string, caption: string, audioTitle: string = 'Original Audio'): Promise<Reel> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reels')
          .insert({
            user_id: user.id,
            video_url: videoUrl,
            caption,
            audio_title: audioTitle,
          })
          .select(`*, user:profiles(*)`)
          .single();

        if (!error && data) return data as Reel;
      } catch (err) {
        console.warn('Supabase createReel failed:', err);
      }
    }

    const reel: Reel = {
      id: 'rel_' + Date.now(),
      user_id: user.id,
      video_url: videoUrl,
      caption,
      audio_title: audioTitle,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      user,
      is_liked: false,
      is_saved: false,
    };
    localStore.addReel(reel);
    return reel;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<Notification[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`*, actor:profiles(*)`)
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as Notification[];
      } catch (err) {
        console.warn('Supabase getNotifications failed:', err);
      }
    }

    return localStore.getNotifications(userId);
  },

  async markNotificationsRead(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('recipient_id', userId);
      } catch (err) {
        console.warn(err);
      }
    }
    localStore.markNotificationsAsRead(userId);
  },

  // --- DIRECT MESSAGES ---
  async getConversations(userId: string): Promise<Conversation[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: memberRows } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', userId);

        if (memberRows && memberRows.length > 0) {
          const convoIds = memberRows.map((m) => m.conversation_id);
          const { data: convos } = await supabase
            .from('conversations')
            .select(`
              *,
              conversation_members(user:profiles(*)),
              messages(*)
            `)
            .in('id', convoIds)
            .order('updated_at', { ascending: false });

          if (convos) {
            return convos.map((c: any) => {
              const members = (c.conversation_members || []).map((cm: any) => cm.user);
              const msgs = (c.messages || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              const lastMessage = msgs[msgs.length - 1];
              const unread = msgs.filter((m: any) => m.sender_id !== userId && !m.is_read).length;
              return {
                id: c.id,
                created_at: c.created_at,
                updated_at: c.updated_at,
                members,
                last_message: lastMessage,
                unread_count: unread,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Supabase getConversations failed:', err);
      }
    }

    return localStore.getConversations(userId);
  },

  async getMessages(convoId: string): Promise<Message[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`*, sender:profiles(*)`)
          .eq('conversation_id', convoId)
          .order('created_at', { ascending: true });

        if (!error && data) return data as Message[];
      } catch (err) {
        console.warn('Supabase getMessages error:', err);
      }
    }

    return localStore.getMessages(convoId);
  },

  async sendMessage(convoId: string, sender: Profile, content?: string, mediaUrl?: string, sharedPostId?: string): Promise<Message> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: convoId,
            sender_id: sender.id,
            content,
            media_url: mediaUrl,
            shared_post_id: sharedPostId,
          })
          .select(`*, sender:profiles(*)`)
          .single();

        if (!error && data) {
          await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convoId);
          return data as Message;
        }
      } catch (err) {
        console.warn('Supabase sendMessage failed:', err);
      }
    }

    const message: Message = {
      id: 'msg_' + Date.now(),
      conversation_id: convoId,
      sender_id: sender.id,
      content,
      media_url: mediaUrl,
      shared_post_id: sharedPostId,
      is_read: false,
      created_at: new Date().toISOString(),
      sender,
    };
    localStore.sendMessage(message);
    return message;
  },

  async unsendMessage(messageId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('messages').delete().eq('id', messageId).eq('sender_id', userId);
        if (!error) return true;
      } catch (err) {
        console.warn(err);
      }
    }
    return localStore.deleteMessage(messageId, userId);
  },

  async getOrCreateConversation(currentUser: Profile, targetUser: Profile): Promise<Conversation> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // find existing mutual conversation
        const { data: myConvos } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', currentUser.id);

        if (myConvos && myConvos.length > 0) {
          const ids = myConvos.map((c) => c.conversation_id);
          const { data: mutual } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', targetUser.id)
            .in('conversation_id', ids);

          if (mutual && mutual.length > 0) {
            const convoId = mutual[0].conversation_id;
            return {
              id: convoId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              members: [currentUser, targetUser],
            };
          }
        }

        // Create new
        const { data: newConvo, error } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (newConvo && !error) {
          await supabase.from('conversation_members').insert([
            { conversation_id: newConvo.id, user_id: currentUser.id },
            { conversation_id: newConvo.id, user_id: targetUser.id },
          ]);

          return {
            id: newConvo.id,
            created_at: newConvo.created_at,
            updated_at: newConvo.updated_at,
            members: [currentUser, targetUser],
          };
        }
      } catch (err) {
        console.warn('Supabase getOrCreateConversation failed:', err);
      }
    }

    return localStore.getOrCreateConversation(currentUser, targetUser);
  }
};
