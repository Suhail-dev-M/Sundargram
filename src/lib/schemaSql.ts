/**
 * Sundargram Supabase Migration SQL
 * Can be copied into Supabase SQL Editor to provision tables, triggers, RLS, and storage
 */
export const SUNDARGRAM_SCHEMA_SQL = `-- Sundargram Supabase Full Schema & Migration
-- Version: 1.0.0
-- Tables: profiles, posts, post_media, likes, comments, comment_likes, follows, stories, story_views, reels, saves, collections, conversations, conversation_members, messages, notifications, blocks, hashtags, post_hashtags.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  website TEXT DEFAULT '',
  is_private BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  posts_count INT DEFAULT 0,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. POSTS & POST MEDIA
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  caption TEXT DEFAULT '',
  location TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  aspect_ratio TEXT DEFAULT '1:1',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LIKES & COMMENTS
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, comment_id)
);

-- 4. FOLLOWS & BLOCKS
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);

-- 5. STORIES & STORY VIEWS
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  is_close_friends BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (story_id, user_id)
);

-- 6. REELS
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT DEFAULT '',
  audio_title TEXT DEFAULT 'Original Audio',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SAVES & COLLECTIONS
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- 8. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'follow_request', 'mention')),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. HASHTAGS
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  posts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, hashtag_id)
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts viewable with privacy" ON public.posts FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = posts.user_id AND is_private = false) OR
  EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = posts.user_id AND status = 'accepted')
);
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Post media viewable with post" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "Post media insertable by post owner" ON public.post_media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Post media deletable by post owner" ON public.post_media FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

CREATE POLICY "Likes viewable by all" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments viewable by all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Follows viewable by all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can update follow status" ON public.follows FOR UPDATE USING (auth.uid() = following_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Active stories viewable" ON public.stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can add own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Reels viewable by all" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Users can post reels" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete reels" ON public.reels FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Saves private to owner" ON public.saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Collections private to owner" ON public.collections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Members see conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Members see members" ON public.conversation_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_members AS cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Members can view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can unsend own messages" ON public.messages FOR DELETE USING (auth.uid() = sender_id);
CREATE POLICY "Notifications private to recipient" ON public.notifications FOR ALL USING (auth.uid() = recipient_id);

-- 12. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY "Avatars publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Posts media publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Stories publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Reels publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Auth users can upload media" ON storage.objects FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id IN ('avatars', 'posts', 'stories', 'reels', 'chat-media')
);

-- 13. REALTIME REPLICATION
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
`;
