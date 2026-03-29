import { apiRequest } from './client';

export interface Author {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface CommunityPost {
  id: string;
  author: Author;
  dream_id: string | null;
  title: string;
  body: string;
  image_url: string | null;
  mood: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface PostComment {
  id: string;
  author: Author;
  body: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  dreams_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export type PostTab = 'trending' | 'recent' | 'following';

// ── Posts ─────────────────────────────────────────────────────────────────────

export const listPosts = (tab: PostTab = 'trending', page = 1): Promise<CommunityPost[]> =>
  apiRequest<CommunityPost[]>('/posts', { query: { tab, page, page_size: 20 } });

export const sharePost = (dreamId: string): Promise<CommunityPost> =>
  apiRequest<CommunityPost>('/posts', {
    method: 'POST',
    body: JSON.stringify({ dream_id: dreamId }),
  });

export const deletePost = (postId: string): Promise<void> =>
  apiRequest<void>(`/posts/${postId}`, { method: 'DELETE' });

// ── Likes ─────────────────────────────────────────────────────────────────────

export const likePost = (postId: string): Promise<void> =>
  apiRequest<void>(`/posts/${postId}/like`, { method: 'POST' });

export const unlikePost = (postId: string): Promise<void> =>
  apiRequest<void>(`/posts/${postId}/like`, { method: 'DELETE' });

// ── Comments ──────────────────────────────────────────────────────────────────

export const listComments = (postId: string, page = 1): Promise<PostComment[]> =>
  apiRequest<PostComment[]>(`/posts/${postId}/comments`, { query: { page, page_size: 50 } });

export const createComment = (postId: string, body: string): Promise<PostComment> =>
  apiRequest<PostComment>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

export const deleteComment = (postId: string, commentId: string): Promise<void> =>
  apiRequest<void>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });

// ── Users & Follows ───────────────────────────────────────────────────────────

export const getUserProfile = (userId: string): Promise<UserProfile> =>
  apiRequest<UserProfile>(`/users/${userId}/profile`);

export const getUserPosts = (userId: string, page = 1): Promise<CommunityPost[]> =>
  apiRequest<CommunityPost[]>(`/users/${userId}/posts`, { query: { page } });

export const followUser = (userId: string): Promise<void> =>
  apiRequest<void>(`/users/${userId}/follow`, { method: 'POST' });

export const unfollowUser = (userId: string): Promise<void> =>
  apiRequest<void>(`/users/${userId}/follow`, { method: 'DELETE' });

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment';
  actor: Author;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unread_count: number;
}

export const getNotifications = (): Promise<NotificationsResponse> =>
  apiRequest<NotificationsResponse>('/notifications');

export const markAllNotificationsRead = (): Promise<void> =>
  apiRequest<void>('/notifications/read-all', { method: 'POST' });
