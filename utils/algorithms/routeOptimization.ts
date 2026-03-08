import { Coordinates, calculateDistance, findNearestPoint } from "./distance";

export interface PlaceWithLocation {
  id: string;
  lat: number;
  lng: number;
}

export interface OptimizedRoute {
  order: number[];
  totalDistance: number;
  estimatedTime: number;
}

export function nearestNeighborRoute(
  places: PlaceWithLocation[],
  startIndex: number = 0
): OptimizedRoute {
  if (places.length <= 1) {
    return {
      order: [0],
      totalDistance: 0,
      estimatedTime: 0,
    };
  }

  const visited = new Set<number>();
  const order: number[] = [startIndex];
  visited.add(startIndex);

  let currentIndex = startIndex;
  let totalDistance = 0;

  while (visited.size < places.length) {
    let nearestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < places.length; i++) {
      if (!visited.has(i)) {
        const distance = calculateDistance(
          { lat: places[currentIndex].lat, lng: places[currentIndex].lng },
          { lat: places[i].lat, lng: places[i].lng }
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
    }

    if (nearestIndex !== -1) {
      order.push(nearestIndex);
      visited.add(nearestIndex);
      totalDistance += minDistance;
      currentIndex = nearestIndex;
    }
  }

  const estimatedTime = Math.round((totalDistance / 30) * 60);

  return {
    order,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedTime,
  };
}

export function optimizeRouteFromLocation(
  places: PlaceWithLocation[],
  startLocation: Coordinates
): OptimizedRoute {
  const placesCoordinates: Coordinates[] = places.map((p) => ({
    lat: p.lat,
    lng: p.lng,
  }));

  const startPlaceIndex = findNearestPoint(startLocation, placesCoordinates);
  return nearestNeighborRoute(places, startPlaceIndex);
}
