export interface PlaceRecommendation {
  id: string;
  title: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  address: string;
  vibe: string[];
  entryFees: number | null;
  cameraFees: number | null;
  petsFriendly: boolean;
  kidsFriendly: boolean;
  matchScore: number;
  matchReasons: string[];
  category?: string;
}

