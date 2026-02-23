import computeIsochroneBMAD from '../lib/bmad';

describe('Unit: computeIsochroneBMAD', () => {
  const center = { lat: 37.5665, lng: 126.9784 };

  it('GeoJSON Feature/Polygon 형식을 반환한다', async () => {
    const result = await computeIsochroneBMAD(center, 15, 'walking');

    expect(result.type).toBe('Feature');
    expect(result.geometry.type).toBe('Polygon');
    expect(Array.isArray(result.geometry.coordinates)).toBe(true);
  });

  it('폴리곤 좌표는 폐곡선(첫점=끝점)이다', async () => {
    const result = await computeIsochroneBMAD(center, 15, 'walking');
    const ring = result.geometry.coordinates[0];

    expect(ring.length).toBeGreaterThan(3);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('기본 points=64일 때 좌표 개수는 65개(폐곡선)다', async () => {
    const result = await computeIsochroneBMAD(center, 15, 'walking');
    const ring = result.geometry.coordinates[0];

    expect(ring.length).toBe(65);
  });

  it('points 옵션 지정 시 좌표 개수가 반영된다', async () => {
    const result = await computeIsochroneBMAD(center, 15, 'walking', { points: 16 });
    const ring = result.geometry.coordinates[0];

    expect(ring.length).toBe(17);
  });

  it('좌표 순서는 [lng, lat]다', async () => {
    const result = await computeIsochroneBMAD(center, 15, 'walking');
    const [lng, lat] = result.geometry.coordinates[0][0];

    expect(typeof lng).toBe('number');
    expect(typeof lat).toBe('number');
    expect(lat).toBeGreaterThanOrEqual(-90);
    expect(lat).toBeLessThanOrEqual(90);
    expect(lng).toBeGreaterThanOrEqual(-180);
    expect(lng).toBeLessThanOrEqual(180);
  });

  it('mode별 반경이 walking < transit < driving 순서다', async () => {
    const walking = await computeIsochroneBMAD(center, 10, 'walking');
    const transit = await computeIsochroneBMAD(center, 10, 'transit');
    const driving = await computeIsochroneBMAD(center, 10, 'driving');

    const rw = (walking as any).properties.radiusMeters;
    const rt = (transit as any).properties.radiusMeters;
    const rd = (driving as any).properties.radiusMeters;

    expect(rw).toBeLessThan(rt);
    expect(rt).toBeLessThan(rd);
  });

  it('time이 작아도 최소 반경 50m를 보장한다', async () => {
    const result = await computeIsochroneBMAD(center, 0, 'walking');
    expect((result as any).properties.radiusMeters).toBe(50);
  });

  it('time 증가 시 반경이 증가한다', async () => {
    const t10 = await computeIsochroneBMAD(center, 10, 'walking');
    const t20 = await computeIsochroneBMAD(center, 20, 'walking');

    expect((t20 as any).properties.radiusMeters).toBeGreaterThan((t10 as any).properties.radiusMeters);
  });

  it('모드별 속도에 따라 반경이 정확하게 계산된다 (새로운 검증: 15분 walking = 1200m)', async () => {
    const result = await computeIsochroneBMAD(center, 15, 'walking');
    // Speed: 80 m/min. 15 min * 80 m/min = 1200m. Math.max(50, 1200) = 1200.
    expect((result as any).properties.radiusMeters).toBe(1200);
  });

  it('모든 좌표는 유효한 WGS84 범위다', async () => {
    const result = await computeIsochroneBMAD(center, 30, 'driving');

    for (const [lng, lat] of result.geometry.coordinates[0]) {
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    }
  });
});
