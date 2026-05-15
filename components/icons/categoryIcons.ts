import {
  Landmark,
  Pyramid,
  Building2,
  Church,
  Coffee,
  UtensilsCrossed,
  MapPin,
  Castle,
  TreePine,
  ShoppingBag,
  Ticket,
  Route,
  Store,
  Mountain,
  Heart,
  Compass,
} from "lucide-react";

const categoryIcons = {
  museum: Landmark,
  historical_site: Landmark,
  pyramids: Pyramid,
  mosque: Building2,
  church: Church,
  palace: Castle,
  citadel: Castle,
  park: TreePine,
  mall: ShoppingBag,
  amusement_park: Ticket,
  activity: Compass,
  famous_street: Route,
  market: Store,
  viewpoint: Mountain,
  romantic_spot: Heart,
  adventure: Compass,
  cafe: Coffee,
  restaurant: UtensilsCrossed,
  other: MapPin,
};

export function getCategoryIcon(category: string) {
  const key = category in categoryIcons ? category : "other";
  return categoryIcons[key as keyof typeof categoryIcons] ?? MapPin;
}
