export interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371;
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateTravelTime(
  distance: number,
  averageSpeed: number = 30
): number {
  const timeInHours = distance / averageSpeed;
  return Math.round(timeInHours * 60);
}

export function calculateDistanceMatrix(points: Coordinates[]): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i < points.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(points[i], points[j]);
      }
    }
  }

  return matrix;
}

export function findNearestPoint(
  origin: Coordinates,
  points: Coordinates[]
): number {
  let minDistance = Infinity;
  let nearestIndex = 0;

  for (let i = 0; i < points.length; i++) {
    const distance = calculateDistance(origin, points[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return nearestIndex;
}
