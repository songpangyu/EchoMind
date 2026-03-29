import { apiRequest } from './client';

export type DreamMood = 'peaceful' | 'happy' | 'sad' | 'anxious' | 'calm';
export type DreamSourceType = 'voice' | 'text';

export type DreamAnalysisPerspective = {
  summary: string;
  insights: string[];
  suggestion: string;
};

export type DreamAnalysisResponse = {
  life: DreamAnalysisPerspective;
  work: DreamAnalysisPerspective;
  relationship: DreamAnalysisPerspective;
  emotion: DreamAnalysisPerspective;
  spiritual: DreamAnalysisPerspective;
};

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
  analysis: DreamAnalysisResponse | null;
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

export const listDreams = (params: { page?: number; pageSize?: number; month?: number; year?: number; q?: string; isFavorited?: boolean }) =>
  apiRequest<DreamListResponse>('/dreams', {
    query: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
      month: params.month,
      year: params.year,
      q: params.q,
      is_favorited: params.isFavorited,
    },
  });

export const deleteDream = (dreamId: string) =>
  apiRequest<{ deleted: number; ids: string[] }>(`/dreams/${dreamId}`, {
    method: 'DELETE',
  });

export const batchDeleteDreams = (ids: string[]) =>
  apiRequest<{ deleted: number; ids: string[] }>('/dreams/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
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

export const analyzeDream = (dreamId: string) =>
  apiRequest<Dream>(`/dreams/${dreamId}/analyze`, {
    method: 'POST',
  });

// ── Stats ─────────────────────────────────────────────

export type MoodTrend = {
  date: string;
  mood: string | null;
};

export type HomeStats = {
  totalDreams: number;
  thisMonthDreams: number;
  weeklyAverage: number;
  currentStreak: number;
  topMood: string | null;
  topTag: string | null;
  recentMoodTrend: MoodTrend[];
  lastDream: Dream | null;
};

export type AiInsightSymbol = {
  icon: string;
  text: string;
};

export type AiInsightResponse = {
  insightText: string;
  symbols: AiInsightSymbol[];
};

export const getAiInsight = () =>
  apiRequest<AiInsightResponse>('/stats/ai-insight', {
    method: 'GET',
  });

export type MoodDistribution = {
  mood: string;
  count: number;
  percentage: number;
};

export type TagFrequency = {
  tag: string;
  count: number;
};

export type InsightsStats = {
  totalDreams: number;
  avgDreamsPerWeek: number;
  currentStreak: number;
  longestStreak: number;
  moodDistribution: MoodDistribution[];
  topTags: TagFrequency[];
  weeklyFrequency: { week: string; count: number }[];
  monthlyFrequency: { month: string; count: number }[];
};

export const getHomeStats = () =>
  apiRequest<HomeStats>('/stats/home');

export const getInsightsStats = () =>
  apiRequest<InsightsStats>('/stats/insights');
