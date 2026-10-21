import { Profile, Post, Story, Reel, Notification, Conversation, Message } from '../types';

export const DEMO_USERS: Profile[] = [
  {
    id: 'user_sundar',
    username: 'sundarpichai',
    full_name: 'Sundar Pichai',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'CEO @ Google & Alphabet. Exploring the frontiers of AI & computing.',
    website: 'https://about.google',
    is_private: false,
    is_verified: true,
    posts_count: 3,
    followers_count: 14200,
    following_count: 184,
  },
  {
    id: 'user_elena',
    username: 'elena_arch',
    full_name: 'Elena Rostova',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    bio: 'Architectural photographer & urban designer. Kyoto / Zurich.',
    website: 'https://elena.design',
    is_private: false,
    is_verified: false,
    posts_count: 4,
    followers_count: 8520,
    following_count: 310,
  },
  {
    id: 'user_kai',
    username: 'kaicooking',
    full_name: 'Chef Kai Takahashi',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Modern Japanese fermentation & seasonal ramen. Recipe book out soon.',
    website: 'https://kaicooking.co',
    is_private: false,
    is_verified: true,
    posts_count: 2,
    followers_count: 24500,
    following_count: 412,
  },
  {
    id: 'user_maya',
    username: 'mayafilms',
    full_name: 'Maya Lin',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    bio: 'Cinematographer & 35mm film collector. Chasing warm twilight shadows.',
    website: 'https://mayafilms.studio',
    is_private: false,
    is_verified: false,
    posts_count: 3,
    followers_count: 6700,
    following_count: 290,
  }
];

export const DEMO_POSTS: Post[] = [
  {
    id: 'post_1',
    user_id: 'user_elena',
    caption: 'Morning light falling through concrete geometries at the Brutalist pavilion. The interplay of brutal stone and tender shadow always calms the mind. #architecture #shadows #minimalism',
    location: 'Kyoto National Museum of Modern Art',
    likes_count: 1248,
    comments_count: 18,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: DEMO_USERS[1],
    media: [
      {
        id: 'media_1_1',
        post_id: 'post_1',
        media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
        media_type: 'image',
        aspect_ratio: '4:5',
        order_index: 0,
      },
      {
        id: 'media_1_2',
        post_id: 'post_1',
        media_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
        media_type: 'image',
        aspect_ratio: '4:5',
        order_index: 1,
      }
    ],
    is_liked: false,
    is_saved: false,
  },
  {
    id: 'post_2',
    user_id: 'user_sundar',
    caption: 'Exciting milestone for our team testing real-time reasoning and computer vision. The future of helpful technology is being built by curious minds around the globe. #google #innovation',
    location: 'Google Bay View Campus, California',
    likes_count: 9840,
    comments_count: 142,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    user: DEMO_USERS[0],
    media: [
      {
        id: 'media_2_1',
        post_id: 'post_2',
        media_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85',
        media_type: 'image',
        aspect_ratio: '1:1',
        order_index: 0,
      }
    ],
    is_liked: true,
    is_saved: true,
  },
  {
    id: 'post_3',
    user_id: 'user_kai',
    caption: '48-hour slow reduction chashu broth infused with charred negi oil and handmade rye noodles. Simplicity refined over 15 years. #ramen #japanesefood #culinary',
    location: 'Omotesando, Tokyo',
    likes_count: 4210,
    comments_count: 88,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    user: DEMO_USERS[2],
    media: [
      {
        id: 'media_3_1',
        post_id: 'post_3',
        media_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85',
        media_type: 'image',
        aspect_ratio: '1:1',
        order_index: 0,
      }
    ],
    is_liked: false,
    is_saved: false,
  }
];

export const DEMO_STORIES: Story[] = [
  {
    id: 'story_1',
    user_id: 'user_sundar',
    media_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=85',
    media_type: 'image',
    expires_at: new Date(Date.now() + 3600000 * 18).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    user: DEMO_USERS[0],
    is_seen: false,
  },
  {
    id: 'story_2',
    user_id: 'user_elena',
    media_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=85',
    media_type: 'image',
    expires_at: new Date(Date.now() + 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    user: DEMO_USERS[1],
    is_seen: false,
  },
  {
    id: 'story_3',
    user_id: 'user_kai',
    media_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=85',
    media_type: 'image',
    expires_at: new Date(Date.now() + 3600000 * 22).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: DEMO_USERS[2],
    is_seen: false,
  }
];

export const DEMO_REELS: Reel[] = [
  {
    id: 'reel_1',
    user_id: 'user_maya',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    caption: 'Breathe in the golden hour calmness. Slow cinema moments from the northern forest.',
    audio_title: 'Nordic Solitude • Ambient Original',
    likes_count: 5320,
    comments_count: 94,
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    user: DEMO_USERS[3],
    is_liked: false,
    is_saved: false,
  },
  {
    id: 'reel_2',
    user_id: 'user_kai',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-serving-dinner-in-a-restaurant-41484-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
    caption: 'Precision plating before the evening service begins. Attention to every droplet.',
    audio_title: 'Lo-Fi Cooking Beats • Kai Audio',
    likes_count: 14200,
    comments_count: 310,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    user: DEMO_USERS[2],
    is_liked: true,
    is_saved: true,
  }
];
