import { NextResponse } from 'next/server';
import computeIsochroneBMAD from '../../../lib/bmad';

type IsochroneRequest = {
  center: { lat: number; lng: number };
  time: number; // minutes
  mode?: 'walking' | 'driving' | 'transit';
};

// Helper: generate a simple circular polygon (mock) around center.
function generateCircle(center: { lat: number; lng: number }, radiusMeters: number, points = 36) {
  const coords: Array<[number, number]> = [];
  const R = 6378137; // Earth radius in meters
  const lat = (center.lat * Math.PI) / 180;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const dx = radiusMeters * Math.cos(theta);
    const dy = radiusMeters * Math.sin(theta);
    const dLat = dy / R;
    const dLng = dx / (R * Math.cos(lat));
    const newLat = (lat + dLat) * (180 / Math.PI);
    const newLng = ( (center.lng * Math.PI) / 180 + dLng ) * (180 / Math.PI);
    coords.push([newLng, newLat]);
  }
  // close polygon
  coords.push(coords[0]);
  return coords;
}

// 서버사이드 API 키 (선택) — Reverse Geocode 등 민감한 API 호출용
// 현재는 Reverse Geocode를 사용하지 않으므로 주석 처리
// const SERVER_KEY_ID = process.env.NAVER_CLIENT_ID;
// const SERVER_KEY_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function POST(req: Request) {
  try {
    const body: IsochroneRequest = await req.json();
    const { center, time, mode } = body;

    if (!center || typeof time !== 'number') {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    // Isochrone 계산 (BMAD 유틸 사용)
    const result = await computeIsochroneBMAD(center, time, mode);

    // GeoJSON 반환 (addressInfo 제거됨 - Reverse Geocode 미사용)
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'server_error', detail: String(err) }, { status: 500 });
  }
}
