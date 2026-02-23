export type Center = { lat: number; lng: number };

export type BMADOptions = {
  points?: number;
};

// Earth Radius in meters (WGS84 standard)
export const EARTH_RADIUS_METERS = 6378137;

// Simple fallback implementation used as a placeholder for the BMAD method.
// Currently this generates a circular polygon approximation based on a
// radius derived from time and mode. Replace the implementation with the
// real BMAD algorithm when available.
export async function computeIsochroneBMAD(
  center: Center,
  timeMinutes: number,
  mode: 'walking' | 'driving' | 'transit' = 'walking',
  opts: BMADOptions = {}
) {
  const points = opts.points ?? 64;

  // heuristic speeds (m per minute)
  const speed = mode === 'driving' ? 800 : mode === 'transit' ? 600 : 80;
  const radiusMeters = Math.max(50, timeMinutes * speed);

  const coords: Array<[number, number]> = [];
  const latRad = (center.lat * Math.PI) / 180;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const dx = radiusMeters * Math.cos(theta);
    const dy = radiusMeters * Math.sin(theta);
    const dLat = dy / EARTH_RADIUS_METERS;
    const dLng = dx / (EARTH_RADIUS_METERS * Math.cos(latRad));
    const newLat = (latRad + dLat) * (180 / Math.PI);
    const newLng = ((center.lng * Math.PI) / 180 + dLng) * (180 / Math.PI);
    coords.push([newLng, newLat]);
  }
  coords.push(coords[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: { center, timeMinutes, mode, method: 'bmad-placeholder', radiusMeters },
  } as const;
}

export default computeIsochroneBMAD;
