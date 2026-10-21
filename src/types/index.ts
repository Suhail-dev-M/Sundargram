export type MediaType = 'image' | 'video';
export type FollowStatus = 'pending' | 'accepted';
export type NotificationType = 'like' | 'comment' | 'follow' | 'follow_request' | 'mention';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  website?: string;
  is_private: boolean;
  is_verified?: boolean;
  posts_count: number;
  followers_count: number;
  following_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: MediaType;
  aspect_ratio?: string; // '1:1' | '4:5' | '16:9'
  order_index: number;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user: Profile;
  media: PostMedia[];
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  user: Profile;
  replies?: Comment[];
  is_liked?: boolean;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: MediaType;
  is_close_friends?: boolean;
  expires_at: string;
  created_at: string;
  user: Profile;
  is_seen?: boolean;
}

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  caption: string;
  audio_title: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user: Profile;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at: string;
  user?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  media_url?: string;
  shared_post_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  shared_post?: Post;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  members: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
  actor: Profile;
  post?: Post;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  cover_url?: string;
  created_at: string;
  posts_count?: number;
}

export interface Hashtag {
  id: string;
  name: string;
  posts_count: number;
}
