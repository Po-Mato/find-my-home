# 🏗️ Architecture Review - Find My Home

**검토자:** Amelia (Dev Agent)  
**검토일:** 2025-12-13  
**상태:** 📋 Issue Found & Recommendations

---

## 📊 Executive Summary

**현재 상황:**
- ✅ 기본 구조 설정: Next.js App Router 적용
- ✅ UI 컴포넌트: SearchForm, NaverMap 구현
- ⚠️ 개선 필요: 에러 처리, 캐싱, 지도 클릭, 길찾기 API 통합

**심각도:**
- 🔴 **Critical:** 3개
- 🟡 **High:** 5개
- 🟢 **Medium:** 4개

---

## 🔴 Critical Issues

### C1: 길찾기 API 미통합

**파일:** `app/api/isochrone/route.ts`

**문제:**
- 네이버 길찾기 API 호출 로직 없음
- 8개 방향 샘플링 미구현
- Catmull-Rom 보간 알고리즘 미구현
- 현재: 원형 추정 방식만 사용

**영향:**
- 핵심 기능 불완전 (PRD의 핵심 혁신 불가)
- 정확도 저하

**권장사항:**
```typescript
// lib/isochrone.ts에 추가 필요
export async function computeIsochroneWithDirections(
  center: { lat: number; lng: number },
  time: number,
  mode: 'walking' | 'driving' | 'transit'
) {
  // 8개 방향 정의 및 병렬 API 호출
  // Catmull-Rom 보간으로 폴리곤 생성
}
```

**우선순위:** ⭐⭐⭐ (P0)

---

### C2: 지도 클릭 기능 미구현

**파일:** `app/NaverMap.tsx`

**문제:**
- 지도 클릭 이벤트 리스너 없음
- SearchForm과 지도 간 상호작용 없음
- UX 혁신 (Epic 1) 미구현

**영향:**
- 사용자는 여전히 수동으로 좌표 입력 필요
- 기능 채택률 저하

**권장사항:**
```typescript
// NaverMap에 추가
useEffect(() => {
  if (!mapInstanceRef.current) return;
  
  const handleMapClick = (e: any) => {
    const lat = e.coord.lat();
    const lng = e.coord.lng();
    onLocationClick?.({ lat, lng });
  };
  
  mapInstanceRef.current.addEventListener('click', handleMapClick);
  return () => mapInstanceRef.current?.removeEventListener('click', handleMapClick);
}, [onLocationClick]);
```

**우선순위:** ⭐⭐⭐ (P0)

---

### C3: 캐싱 시스템 완전 부재

**파일:** `app/api/isochrone/route.ts`

**문제:**
- 메모리 기반 캐시 없음
- 매 요청마다 API 호출
- 반복 검색 시 10초 소요

**영향:**
- 성능 목표 미달성 (캐시 히트율 0%)
- API 비용 증가
- 사용자 경험 저하

**권장사항:**
```typescript
// 메모리 캐시 구현
const cache = new Map<string, { data: any; expires: number }>();

function getCacheKey(lat: number, lng: number, time: number, mode: string) {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${time}_${mode}`;
}

function getFromCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}
```

**우선순위:** ⭐⭐⭐ (P0)

---

## 🟡 High Priority Issues

### H1: 에러 처리 미흡

**파일:** `app/api/isochrone/route.ts`, `app/NaverMap.tsx`

**문제:**
- API 호출 실패 시 재시도 없음
- 부분 실패 처리 없음
- 에러 메시지 기술적 (사용자 친화적 아님)

**예시:**
```typescript
// 나쁜 예
catch(e) {
  throw new Error(`API 호출 실패: ${e.message}`);
}

// 좋은 예
catch(e) {
  if (e.code === 'TIMEOUT') {
    return { error: '요청이 시간 초과되었습니다. 다시 시도해주세요.' };
  }
}
```

**권장사항:**
- 최대 3회 재시도 (exponential backoff)
- 부분 실패 처리 (일부 방향만 실패)
- 사용자 친화적 에러 메시지

**우선순위:** ⭐⭐⭐ (P1)

---

### H2: 타입 안정성 낮음

**파일:** `app/NaverMap.tsx`

**문제:**
```typescript
// @ts-ignore 남용
const m = new (window as any).naver.maps.Map(el, {
  // ...
});
```

**영향:**
- 타입 체킹 우회
- 런타임 오류 위험
- 유지보수성 저하

**권장사항:**
```typescript
// types/naver-maps.d.ts 추가
declare namespace naver.maps {
  class Map {
    constructor(element: HTMLElement, options: MapOptions);
  }
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }
}

// NaverMap.tsx에서
const m = new naver.maps.Map(el, { ... }); // ✅ 타입 안전
```

**우선순위:** ⭐⭐ (P2)

---

### H3: 테스트 완전 부재

**파일:** 전체 프로젝트

**문제:**
- 단위 테스트 없음
- 통합 테스트 없음
- 테스트 커버리지: 0%

**영향:**
- 회귀 오류 위험
- 리팩토링 불안정
- 품질 보증 불가

**권장사항:**
```typescript
// __tests__/isochrone.test.ts
describe('computeIsochroneWithDirections', () => {
  it('should return polygon with 8 direction points', async () => {
    const result = await computeIsochroneWithDirections(
      { lat: 37.5665, lng: 126.978 },
      15,
      'walking'
    );
    expect(result.geometry.coordinates[0].length).toBeGreaterThanOrEqual(16);
  });
});
```

**우선순위:** ⭐⭐ (P2)

---

### H4: 로깅 및 모니터링 미흡

**파일:** `app/api/isochrone/route.ts`

**문제:**
- 구조화된 로깅 없음
- 성능 메트릭 미수집
- 에러 추적 불가

**권장사항:**
```typescript
// 요청 시작
console.log(`[ISOCHRONE] start - lat=${lat}, lng=${lng}, time=${time}, mode=${mode}`);

// 캐시 확인
console.log(`[CACHE] ${isCacheHit ? 'HIT' : 'MISS'}`);

// API 호출
console.log(`[API] calling naver-directions - direction=${dir}, distance=${dist}m`);

// 응답 시간
console.log(`[PERFORMANCE] total=${duration}ms, api_calls=${apiCallCount}, cache_hit_rate=${hitRate}%`);
```

**우선순위:** ⭐⭐ (P2)

---

### H5: 상태 관리 불일치

**파일:** `app/page.tsx`, `app/SearchForm.tsx`, `app/NaverMap.tsx`

**문제:**
- 각 컴포넌트 간 상태 동기화 미흡
- Props drilling
- 단일 데이터 소스 불명확

**권장사항:**
```typescript
// Context 사용으로 개선
export const IsochroneContext = React.createContext<{
  params: IsochroneParams | null;
  setParams: (params: IsochroneParams) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onMapClick: (coord: { lat: number; lng: number }) => void;
}>(null);
```

**우선순위:** ⭐⭐ (P2)

---

## 🟢 Medium Priority Issues

### M1: API 라우트 입력 검증 부족

**파일:** `app/api/isochrone/route.ts`

**문제:**
- 요청 본문 검증 미흡
- 범위 검증 없음 (lat/lng/time)
- 타입 검증 미흡

**권장사항:**
```typescript
function validateIsochroneRequest(body: any) {
  const { center, time, mode } = body;
  
  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
    throw new Error('Invalid center');
  }
  
  if (center.lat < -90 || center.lat > 90 || center.lng < -180 || center.lng > 180) {
    throw new Error('Coordinates out of range');
  }
  
  if (!Number.isInteger(time) || time < 1 || time > 120) {
    throw new Error('Time must be between 1 and 120 minutes');
  }
  
  if (!['walking', 'driving', 'transit'].includes(mode)) {
    throw new Error('Invalid mode');
  }
  
  return { center, time, mode };
}
```

**우선순위:** ⭐ (P3)

---

### M2: 성능 모니터링 미흡

**파일:** `app/NaverMap.tsx`

**문제:**
- 폴리곤 렌더링 시간 미측정
- 메모리 누수 가능성 (이벤트 리스너)
- 번들 크기 최적화 미흡

**권장사항:**
- Performance API 사용
- 이벤트 리스너 정리 (cleanup)
- 코드 분할 (dynamic import)

**우선순위:** ⭐ (P3)

---

### M3: 환경 변수 관리

**파일:** `.env.local`

**문제:**
- 환경 변수 명명 규칙 불일치
- 민감 정보 노출 위험

**권장사항:**
```bash
# 클라이언트 사이드 (노출 OK)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=xxx

# 서버 사이드 (비공개)
NAVER_CLIENT_SECRET=yyy

# 문서화
# .env.local.example 포함
```

**우선순위:** ⭐ (P3)

---

### M4: 배포 설정

**파일:** `vercel.json` (미존재)

**문제:**
- Vercel 배포 설정 없음
- 환경 변수 자동 설정 불가
- 빌드 최적화 미흡

**권장사항:**
```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "env": {
    "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID": "@naver_map_client_id"
  }
}
```

**우선순위:** ⭐ (P3)

---

## ✅ Positive Findings

### 좋은 점들

**1. 명확한 컴포넌트 분리**
- ✅ SearchForm, NaverMap 분리
- ✅ Props 기반 통신
- ✅ 책임 분명

**2. TypeScript 사용**
- ✅ IsochroneParams 타입 정의
- ✅ Props 타입 명시
- ✅ 안정성 기초 마련

**3. Tailwind CSS 활용**
- ✅ 반응형 디자인 기초
- ✅ 일관된 스타일링
- ✅ 유지보수 용이

**4. Next.js App Router**
- ✅ 최신 스택 사용
- ✅ API Routes 활용
- ✅ 서버/클라이언트 분리 명확

---

## 🎯 권장 개선 로드맵

### Phase 1 (Emergency - 1주)
1. **길찾기 API 통합** (C1)
   - 8개 방향 샘플링 구현
   - Catmull-Rom 보간 추가

2. **지도 클릭 기능** (C2)
   - 클릭 이벤트 핸들러 추가
   - SearchForm 동기화

3. **캐싱 시스템** (C3)
   - 메모리 캐시 구현
   - TTL 관리

### Phase 2 (Important - 2주)
4. 에러 처리 강화 (H1)
5. 타입 안정성 개선 (H2)
6. 테스트 작성 (H3)

### Phase 3 (Nice to Have - 3주+)
7. 로깅 및 모니터링 (H4)
8. 상태 관리 리팩토링 (H5)
9. 성능 최적화

---

## 📋 Implementation Checklist

### 필수 구현 항목

- [ ] C1: 길찾기 API 8개 방향 호출
- [ ] C1: Catmull-Rom 보간 알고리즘
- [ ] C2: 지도 클릭 이벤트 핸들러
- [ ] C2: SearchForm 동기화
- [ ] C3: 메모리 기반 캐시 (TTL 1시간)
- [ ] H1: 재시도 로직 (3회, exponential backoff)
- [ ] H1: 부분 실패 처리
- [ ] H2: Naver Maps 타입 정의
- [ ] H3: 단위 테스트 80% 커버리지
- [ ] H3: 통합 테스트
- [ ] H4: 구조화된 로깅
- [ ] H5: Context API 상태 관리

---

## 📊 메트릭 추적

### 현재 상태
| 메트릭 | 현재 | 목표 |
|-------|------|------|
| 테스트 커버리지 | 0% | 80% |
| 타입 안정성 (@ts-ignore) | 5+ | 0 |
| 에러 처리 | 기본 | 완전 |
| 캐시 히트율 | 0% | 60% |
| 응답 시간 (캐시 미스) | ? | 5-10초 |
| 응답 시간 (캐시 히트) | ? | <1초 |

---

## 🎓 결론

**현재 상태:** ⚠️ 초기 단계  
**준비도:** 📊 50% (기본 구조는 양호하지만 핵심 기능 미완성)

**다음 단계:**
1. ✅ PRD 완성 → Epic & Stories 완성
2. ⏭️ **이번 리뷰 이슈 해결**
3. ⏭️ 개발 시작 (Dev Story 실행)
4. ⏭️ 통합 테스트 및 배포

**예상 완료 기간:** 4주 (MVP)

---

**리뷰 완료:** 2025-12-13  
**다음 리뷰:** 개발 50% 진행 후
