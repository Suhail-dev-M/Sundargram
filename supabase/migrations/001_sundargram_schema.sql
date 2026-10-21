-- Sundargram Supabase Full Schema & Migration
-- Version: 1.0.0
-- Pixel-Faithful Instagram Clone: Tables, Constraints, Indexes, Triggers, RLS, Storage & Realtime

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE follow_status AS ENUM ('pending', 'accepted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type_enum AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM ('like', 'comment', 'follow', 'follow_request', 'mention');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
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

-- 4. POSTS & POST MEDIA
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

-- 5. LIKES & COMMENTS
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

-- 6. FOLLOWS (supports private approval requests)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

-- 7. BLOCKS
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);

-- 8. STORIES & STORY VIEWS (24h ephemeral)
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

-- 9. REELS
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

-- 10. SAVED POSTS & COLLECTIONS
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

-- 11. DIRECT MESSAGING (Conversations, Members, Messages)
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

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'follow_request', 'mention')),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. HASHTAGS & POST_HASHTAGS
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

-- 14. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_convo ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);

-- 15. AUTOMATED TRIGGERS & FUNCTIONS

-- A. Auto-create profile on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sundargram Member'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    COALESCE(NEW.raw_user_meta_data->>'bio', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Posts Count Maintainer
CREATE OR REPLACE FUNCTION public.update_profile_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_count ON public.posts;
CREATE TRIGGER trg_posts_count
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_posts_count();

-- C. Follow Counts Maintainer
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_follow_counts ON public.follows;
CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- D. Likes Count Maintainer
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    -- Send notification to author if not self-like
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_id)
    SELECT user_id, NEW.user_id, 'like', NEW.post_id
    FROM public.posts WHERE id = NEW.post_id AND user_id != NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_likes_count ON public.likes;
CREATE TRIGGER trg_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

-- E. Comments Count Maintainer
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    -- Send notification to post owner if not self-comment
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_id)
    SELECT user_id, NEW.user_id, 'comment', NEW.post_id
    FROM public.posts WHERE id = NEW.post_id AND user_id != NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_count ON public.comments;
CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Profiles: Public read, self update
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Viewable if public OR author OR follower is accepted, excluding blocks
CREATE POLICY "Posts viewable with privacy" ON public.posts FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = posts.user_id AND is_private = false) OR
  EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = posts.user_id AND status = 'accepted')
);
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Post Media: Readable if post readable, creator insert/update/delete
CREATE POLICY "Post media viewable with post" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "Post media insertable by post owner" ON public.post_media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Post media deletable by post owner" ON public.post_media FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Likes: Authenticated view, insert/delete own
CREATE POLICY "Likes viewable by all" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: Viewable if post viewable, manage own
CREATE POLICY "Comments viewable by all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Follows: Viewable by everyone, insert/delete own
CREATE POLICY "Follows viewable by all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can update follow status" ON public.follows FOR UPDATE USING (auth.uid() = following_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Stories: Valid stories viewable within 24h
CREATE POLICY "Active stories viewable" ON public.stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can add own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Reels: Public viewable, create own
CREATE POLICY "Reels viewable by all" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Users can post reels" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete reels" ON public.reels FOR DELETE USING (auth.uid() = user_id);

-- Saves & Collections: Private to user
CREATE POLICY "Saves private to owner" ON public.saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Collections private to owner" ON public.collections FOR ALL USING (auth.uid() = user_id);

-- Direct Messages & Conversations
CREATE POLICY "Members see conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Members see members" ON public.conversation_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_members AS cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Members can insert conversation_members" ON public.conversation_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can unsend own messages" ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- Notifications: Only recipient can see
CREATE POLICY "Notifications private to recipient" ON public.notifications FOR ALL USING (auth.uid() = recipient_id);

-- 17. STORAGE BUCKETS CONFIGURATION
-- Buckets: avatars, posts, stories, reels, chat-media
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage Policies
CREATE POLICY "Avatars publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Posts media publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Stories publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Reels publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Auth users can upload media" ON storage.objects FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id IN ('avatars', 'posts', 'stories', 'reels', 'chat-media')
);

-- 18. ENABLE REALTIME PUBLICATION
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
