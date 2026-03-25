import { apiRequest } from './client';

export type DreamMood = 'peaceful' | 'happy' | 'sad' | 'anxious' | 'calm';
export type DreamSourceType = 'voice' | 'text';

export type Dream = {
  id: string;
  userId: string;
  sourceType: DreamSourceType;
  status: 'draft' | 'completed';
  title: string | null;
  transcript: string;
  mood: DreamMood | null;
  tags: string[];
  audioUrl: string | null;
  durationSeconds: number | null;
  aiImageUrl: string | null;
  aiImageStyle: string | null;
  aiAutofillStatus: 'idle' | 'processing' | 'completed' | 'failed';
  aiImageStatus: 'idle' | 'processing' | 'completed' | 'failed';
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DreamListResponse = {
  items: Dream[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateDreamPayload = {
  sourceType: DreamSourceType;
  transcript: string;
  title?: string;
  mood?: DreamMood;
  tags?: string[];
  durationSeconds?: number;
  status?: 'draft' | 'completed';
};

export type UpdateDreamPayload = Partial<CreateDreamPayload> & {
  isFavorited?: boolean;
};

export type DreamAutofillResponse = {
  suggestedTitle: string;
  suggestedMood: DreamMood;
  suggestedTags: string[];
  provider: string;
  configured: boolean;
};

export const createDream = (payload: CreateDreamPayload) =>
  apiRequest<Dream>('/dreams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateDream = (dreamId: string, payload: UpdateDreamPayload) =>
  apiRequest<Dream>(`/dreams/${dreamId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getDream = (dreamId: string) =>
  apiRequest<Dream>(`/dreams/${dreamId}`);

export const listDreams = (params: { page?: number; pageSize?: number; month?: number; year?: number; q?: string }) =>
  apiRequest<DreamListResponse>('/dreams', {
    query: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
      month: params.month,
      year: params.year,
      q: params.q,
    },
  });

export const generateDreamAutofill = (dreamId: string) =>
  apiRequest<DreamAutofillResponse>(`/dreams/${dreamId}/ai-autofill`, {
    method: 'POST',
  });

export const analyzeDreamAutofill = (transcript: string) =>
  apiRequest<DreamAutofillResponse>('/ai/autofill', {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  });

export const generateDreamImage = (dreamId: string, style: string) =>
  apiRequest<Dream>(`/dreams/${dreamId}/ai-image`, {
    method: 'POST',
    body: JSON.stringify({ style }),
  });
