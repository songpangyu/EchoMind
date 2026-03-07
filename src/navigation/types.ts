export type RootStackParamList = {
  MainTabs: undefined;
  DreamDetail: { dreamId: string };
  FullInterpretation: { dreamId: string; type: string };
  PersonalDictionary: undefined;
  TrendReport: { reportId: string };
  SimilarDreams: { dreamId: string };
  OtherDreamDetail: { dreamId: string };
  PublishDream: { dreamId: string };
  Comments: { dreamId: string };
  SearchResults: { query: string };
  Profile: { userId: string };
};

export type TabParamList = {
  Home: undefined;
  Journal: undefined;
  Record: undefined;
  Community: { shared?: boolean } | undefined;
  Me: undefined;
};

