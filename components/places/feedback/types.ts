export type PlaceFeedbackItem = {
  id: string;
  rating: number | null;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
};

export type PlaceFeedbackSummary = {
  count: number;
  averageRating: number | null;
};

export type PlaceFeedbackResponse = {
  summary: PlaceFeedbackSummary;
  feedback: PlaceFeedbackItem[];
};
