export type SearchType = "places" | "people";

export type Suggestion = {
  id: string;
  title: string;
  subtitle: string;
  type: "place" | "person";
  category?: string;
};
