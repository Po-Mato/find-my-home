/**
 * Task 2: 좌표 유효성 검증
 * WGS84 (EPSG:4326) 좌표 검증 함수
 */

/**
 * 좌표가 WGS84 범위 내인지 검증
 * @param lat 위도 (-90 ~ 90)
 * @param lng 경도 (-180 ~ 180)
 * @returns true if valid, false otherwise
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  // 위도 범위 검증: -90 <= lat <= 90
  if (lat < -90 || lat > 90) {
    console.warn(`❌ 위도 범위 초과: ${lat}`);
    return false;
  }

  // 경도 범위 검증: -180 <= lng <= 180
  if (lng < -180 || lng > 180) {
    console.warn(`❌ 경도 범위 초과: ${lng}`);
    return false;
  }

  return true;
}

/**
 * 한국 범위 내 좌표인지 검증 (선택사항)
 * 한국 대략 범위: 위도 33~43, 경도 124~132
 * @param lat 위도
 * @param lng 경도
 * @returns true if in Korea range, false otherwise
 */
export function isKoreanCoordinate(lat: number, lng: number): boolean {
  const KOREA_LAT_MIN = 33;
  const KOREA_LAT_MAX = 43;
  const KOREA_LNG_MIN = 124;
  const KOREA_LNG_MAX = 132;

  return (
    lat >= KOREA_LAT_MIN &&
    lat <= KOREA_LAT_MAX &&
    lng >= KOREA_LNG_MIN &&
    lng <= KOREA_LNG_MAX
  );
}

/**
 * 좌표 정규화 (선택사항)
 * @param lat 위도
 * @param lng 경도
 * @returns 정규화된 좌표
 */
export function normalizeCoordinates(
  lat: number,
  lng: number
): { lat: number; lng: number } {
  // 경도 정규화: -180 ~ 180 범위로
  let normalizedLng = lng;
  while (normalizedLng > 180) {
    normalizedLng -= 360;
  }
  while (normalizedLng < -180) {
    normalizedLng += 360;
  }

  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lng: normalizedLng,
  };
}
