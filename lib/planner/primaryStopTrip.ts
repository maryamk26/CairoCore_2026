import {
  getMainVisitCategories,
  resolveEffectiveWantsStop,
  userExplicitlyWantsFoodStop,
  type TripProfile,
} from "@/lib/planner/tripProfile";
import { mainVisitTypesMentionedInText } from "@/lib/planner/detectSignalsFromText";

export function getPrimaryStopOnlyType(
  profile: TripProfile,
  conversationText = ""
): "cafe" | "restaurant" | null {
  if (getMainVisitCategories(profile)?.length) return null;
  if (!userExplicitlyWantsFoodStop(conversationText)) return null;

  if (mainVisitTypesMentionedInText(conversationText)) return null;

  const stop = resolveEffectiveWantsStop(profile, { userMessageText: conversationText });
  return stop === "cafe" || stop === "restaurant" ? stop : null;
}
