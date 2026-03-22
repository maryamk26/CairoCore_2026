export type FeedMode = "social" | "suggested";

export type FeedActor = {
  id: string;
  name: string;
  username: string;
  usernameRaw: string;
};

export type FeedPlace = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image: string | null;
  feedbackCount: number;
  averageRating: number | null;
  creator: FeedActor | null;
};

export type FeedItem =
  | {
      id: string;
      type: "place_created";
      createdAt: string;
      actor: FeedActor;
      place: FeedPlace;
      metadata: null;
    }
  | {
      id: string;
      type: "place_saved";
      createdAt: string;
      actor: FeedActor;
      place: FeedPlace;
      metadata: {
        boardId: string;
        boardName: string;
      };
    }
  | {
      id: string;
      type: "place_feedback";
      createdAt: string;
      actor: FeedActor;
      place: FeedPlace;
      metadata: {
        content: string | null;
      };
    }
  | {
      id: string;
      type: "suggested_place";
      createdAt: string;
      actor: FeedActor | null;
      place: FeedPlace;
      metadata: {
        reason: string;
      };
    };

export type FeedResponse = {
  mode: FeedMode;
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type FeedPayload = FeedResponse;
