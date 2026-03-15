import type { SurveyAnswers } from "./survey";

export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: "single_choice" | "multiple_choice" | "range";
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "vibe",
    question: "What kind of vibe are you looking for?",
    type: "multiple_choice",
    options: [
      { value: "historical", label: "Historical & Ancient" },
      { value: "cultural", label: "Cultural & Traditional" },
      { value: "modern", label: "Modern & Contemporary" },
      { value: "nature", label: "Nature & Outdoors" },
      { value: "shopping", label: "Shopping & Markets" },
      { value: "romantic", label: "Romantic" },
      { value: "photography", label: "Photography Spots" },
      { value: "adventure", label: "Adventure & Activities" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget per place?",
    type: "single_choice",
    options: [
      { value: "low", label: "Free – 50 EGP per place" },
      { value: "medium", label: "50 – 200 EGP per place" },
      { value: "high", label: "200+ EGP per place" },
    ],
  },
  {
    id: "timePerPlace",
    question: "How much time do you want to spend at each place (approx)?",
    type: "range",
    min: 15,
    max: 180,
    step: 15,
    unit: "min",
  },
  {
    id: "companions",
    question: "Who are you traveling with?",
    type: "multiple_choice",
    options: [
      { value: "kids", label: "Kids" },
      { value: "pets", label: "Pets" },
      { value: "elderly", label: "Elderly" },
      { value: "solo", label: "Solo" },
      { value: "group", label: "Group/Friends" },
      { value: "partner", label: "Partner" },
    ],
  },
  {
    id: "timeOfDay",
    question: "What time do you prefer to visit?",
    type: "multiple_choice",
    options: [
      { value: "morning", label: "Morning (6am - 12pm)" },
      { value: "afternoon", label: "Afternoon (12pm - 6pm)" },
      { value: "evening", label: "Evening (6pm - 10pm)" },
      { value: "night", label: "Night (10pm+)" },
    ],
  },
  {
    id: "routeStopType",
    question: "Would you like to stop by one of the following in the route?",
    type: "single_choice",
    options: [
      { value: "coffee_shop", label: "Coffee shop" },
      { value: "restaurant", label: "Restaurant" },
      { value: "none", label: "None" },
    ],
  },
  {
    id: "routeStopWhen",
    question: "When would you like to stop?",
    type: "single_choice",
    options: [
      { value: "beginning", label: "In the beginning of the route" },
      { value: "middle", label: "In the middle of the route" },
      { value: "end", label: "In the end of the route" },
      { value: "doesnt_matter", label: "Doesn't matter" },
    ],
  },
];

export function showRouteStopWhen(answers: SurveyAnswers): boolean {
  const stopType = answers.routeStopType as string | undefined;
  return stopType === "coffee_shop" || stopType === "restaurant";
}
