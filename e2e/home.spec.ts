import { test, expect } from '@playwright/test';

test('메인 페이지가 렌더링되고 검색 폼이 보인다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /find my home/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: '도달 가능 영역 검색' })).toBeVisible();
  await expect(page.getByLabel('위도 (Latitude)')).toBeVisible();
  await expect(page.getByLabel('경도 (Longitude)')).toBeVisible();
  await expect(page.getByLabel('도달 시간 (분)')).toBeVisible();
  await expect(page.getByLabel('이동 수단')).toBeVisible();
});

test('검색 버튼 클릭 시 폼 동작이 정상이다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('위도 (Latitude)').fill('37.5665');
  await page.getByLabel('경도 (Longitude)').fill('126.9784');
  await page.getByLabel('도달 시간 (분)').fill('15');
  await page.getByLabel('이동 수단').selectOption('walking');

  const searchButton = page.getByRole('button', { name: '검색' });
  await searchButton.click();

  // 클릭 후 페이지가 정상 상태를 유지하는지 확인
  await expect(page.getByRole('heading', { name: /find my home/i })).toBeVisible();
  await expect(page.getByRole('button', { name: '검색' })).toBeVisible();
});

test('isochrone API가 GeoJSON Polygon을 반환한다 (walking)', async ({ request }) => {
  const response = await request.post('/api/isochrone', {
    data: {
      center: { lat: 37.5665, lng: 126.9784 },
      time: 15,
      mode: 'walking',
    },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.type).toBe('Feature');
  expect(body.geometry.type).toBe('Polygon');
  expect(Array.isArray(body.geometry.coordinates)).toBeTruthy();
  expect(body.geometry.coordinates[0].length).toBeGreaterThanOrEqual(4);
  expect(body.properties?.engine).toBeTruthy();
});

test('isochrone API가 GeoJSON Polygon을 반환한다 (driving)', async ({ request }) => {
  const response = await request.post('/api/isochrone', {
    data: {
      center: { lat: 37.5665, lng: 126.9784 },
      time: 15,
      mode: 'driving',
    },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.type).toBe('Feature');
  expect(body.geometry.type).toBe('Polygon');
  expect(Array.isArray(body.geometry.coordinates)).toBeTruthy();
  expect(body.geometry.coordinates[0].length).toBeGreaterThanOrEqual(4);
  expect(body.properties?.mode).toBe('driving');
  expect(body.properties?.engine).toBeTruthy();
  expect(body.properties?.confidence).toBeGreaterThan(0);
});

// 시나리오: mode 값이 허용 목록(walking|driving|transit) 밖이면 400 에러를 반환해야 한다.
test('isochrone API는 잘못된 mode 요청을 400으로 거절한다', async ({ request }) => {
  const response = await request.post('/api/isochrone', {
    data: {
      center: { lat: 37.5665, lng: 126.9784 },
      time: 15,
      mode: 'bicycle',
    },
  });

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('mode는 walking|driving|transit');
});
