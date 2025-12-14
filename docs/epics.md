---
stepsCompleted: [1]
inputDocuments:
  - prd.md
  - architecture-frontend.md
  - architecture-backend.md
  - api-contracts.md
  - data-models.md
  - component-inventory.md
  - development-guide.md
  - integration-architecture.md
project_name: 'Find My Home'
user_name: 'Sjlee'
date: '2025-12-13'
workflowType: 'epics-and-stories'
---

# Epics & User Stories - Find My Home

**작성일:** 2025-12-13  
**상태:** Ready for Development  
**버전:** 1.0.0

---

## 📊 요구사항 추출 요약

### Functional Requirements (FRs)

**지도 클릭 기능:**
- FR1: 사용자가 지도 위의 임의 지점을 클릭하여 위치 선택 가능
- FR2: 클릭 위치가 자동으로 위도/경도 필드에 입력
- FR3: 클릭 지점에 시작점 마커 표시

**길찾기 API 통합:**
- FR4: 8개 방향(N, NE, E, SE, S, SW, W, NW)별 길찾기 API 호출
- FR5: 각 방향에서 사용자 입력 시간 내 도달 가능 지점 계산
- FR6: 도달 지점 좌표 추출 및 저장

**보간 알고리즘:**
- FR7: 8개 샘플 지점으로부터 Catmull-Rom 곡선 생성
- FR8: 매끄러운 폴리곤 좌표 배열 생성 (최소 16개 포인트)
- FR9: GeoJSON Feature 형식으로 변환

**캐싱:**
- FR10: 메모리 기반 캐시 구현 (TTL 1시간)
- FR11: 캐시 키: {lat}_{lng}_{time}_{mode}
- FR12: 캐시 히트 시 1초 이내 응답

**에러 처리:**
- FR13: API 호출 실패 시 최대 3회 재시도 (exponential backoff)
- FR14: 일부 방향만 실패해도 부분 결과 제공
- FR15: 사용자 친화적 에러 메시지 표시

**UI/UX:**
- FR16: 로딩 상태 인디케이터 표시
- FR17: 반응형 디자인 (모바일/태블릿/데스크톱)
- FR18: 폴리곤을 지도에 렌더링

### Non-Functional Requirements (NFRs)

**성능:**
- NFR1: 캐시 미스 응답 시간: 5-10초 이내
- NFR2: 캐시 히트 응답 시간: 1초 이내
- NFR3: 폴리곤 렌더링 시간: 1초 이내
- NFR4: p95 응답 시간: 10초 이내

**신뢰성:**
- NFR5: API 호출 재시도 성공률: 95% 이상
- NFR6: 부분 실패 처리로 인한 안정성
- NFR7: 에러율: 1% 이하

**캐싱:**
- NFR8: 캐시 히트율: 60% 이상
- NFR9: 실제 API 호출: 50% 이상 감소

**호환성:**
- NFR10: Chrome, Safari, Firefox, Edge 지원
- NFR11: iOS/Android 모바일 브라우저 지원

**보안:**
- NFR12: HTTPS 통신 강제
- NFR13: 환경 변수로 민감 정보 보호

### 추가 요구사항

**기술 아키텍처:**
- 클라이언트: React 19, Next.js 15.5, TypeScript, Tailwind CSS
- 백엔드: Next.js API Routes, Node.js
- 캐싱: 메모리 기반 (향후 Redis)
- 배포: Vercel (자동 스케일링)

**데이터 처리:**
- GeoJSON 표준 준수 (RFC 7946)
- WGS84 좌표 체계
- 좌표 순서: [lng, lat]

**모니터링:**
- API 호출 로깅
- 에러 로깅 및 추적
- 성능 메트릭 수집
- 캐시 히트율 모니터링

---

## 🏗️ Epic 구조

Find My Home의 개선 기능은 **4개 Epic**으로 분해됩니다:

| Epic # | 이름 | 설명 | 기간 |
|--------|------|------|------|
| E1 | 지도 클릭 인터페이스 | 직관적인 위치 선택 기능 | Week 1-2 |
| E2 | 길찾기 API 통합 | 정확한 isochrone 계산 | Week 1-3 |
| E3 | 캐싱 & 성능 최적화 | 반복 검색 고속화 | Week 2-3 |
| E4 | 에러 처리 & 안정성 | 신뢰할 수 있는 서비스 | Week 2-4 |

---

## 📖 Epic 1: 지도 클릭 인터페이스

**설명:** 사용자가 지도를 클릭하여 직관적으로 위치를 선택할 수 있는 기능

**비즈니스 가치:**
- 사용성 50% 향상 (좌표 입력 제거)
- 입력 오류 100% 제거
- 온보딩 시간 50% 단축

**기술 요구사항:**
- 네이버 Maps API 클릭 이벤트 처리
- 좌표 추출 및 시작점 마커 표시
- React 상태 관리 (SearchForm과 동기화)

### User Story 1.1: 지도 클릭으로 위치 설정

**제목:** 사용자는 지도를 클릭하여 위치를 선택하고 싶습니다.

**설명:**
사용자가 지도 위의 원하는 위치를 클릭하면, 클릭된 지점이 자동으로 검색 시작점으로 설정됩니다. 사용자는 더 이상 복잡한 좌표 입력을 할 필요가 없습니다.

**Acceptance Criteria:**
- AC1.1.1: 사용자가 지도 위의 임의 지점을 클릭하면 클릭 이벤트 발생
- AC1.1.2: 클릭된 지점의 위도/경도 좌표가 추출됨
- AC1.1.3: SearchForm의 위도/경도 필드에 자동으로 입력됨
- AC1.1.4: 필드값이 반영되어 폼 상태가 업데이트됨
- AC1.1.5: 클릭 지점에 시작점 마커가 표시됨
- AC1.1.6: 기존 마커는 새 마커로 교체됨

**기술 상세:**
- 네이버 Maps: naver.maps.Map 인스턴스의 'click' 이벤트 리스너
- 좌표 추출: event.latLng.lat(), event.latLng.lng()
- 상태 업데이트: SearchForm의 setLat(), setLng()
- 마커 표시: naver.maps.Marker 생성 및 setMap()

**스토리 포인트:** 5  
**우선순위:** 높음

---

### User Story 1.2: 수동 입력 필드 동기화

**제목:** SearchForm의 수동 입력 필드와 지도 클릭이 동기화됩니다.

**설명:**
지도를 클릭할 수도, 수동으로 입력할 수도 있지만, 한 곳에서의 변경이 다른 곳에 반영되어야 합니다.

**Acceptance Criteria:**
- AC1.2.1: 지도 클릭 후 필드의 값 변경됨
- AC1.2.2: 필드 입력 후 지도 마커 위치 변경됨 (검색 전)
- AC1.2.3: 필드 및 지도가 항상 동기화됨
- AC1.2.4: 양방향 바인딩 구현

**기술 상세:**
- useState로 lat, lng 상태 관리
- onChange 핸들러로 필드 업데이트
- useEffect로 상태 변경 시 마커 위치 업데이트

**스토리 포인트:** 3  
**우선순위:** 중간

---

### User Story 1.3: 사용자 피드백 메시지

**제목:** 사용자는 위치가 설정되었을 때 명확한 피드백을 받습니다.

**설명:**
사용자가 위치를 설정하면 "위치가 설정되었습니다" 또는 좌표 정보를 표시하여 확인할 수 있게 합니다.

**Acceptance Criteria:**
- AC1.3.1: 지도 클릭 후 피드백 메시지 표시 (토스트 또는 필드 아래)
- AC1.3.2: 메시지: "위치가 설정되었습니다: 37.5665°N, 126.9780°E" (형식 예시)
- AC1.3.3: 3초 후 자동 사라짐 (토스트인 경우)
- AC1.3.4: 모바일/데스크톱 모두 가독성 확보

**기술 상세:**
- Toast 컴포넌트 또는 Alert 상태 관리
- setTimeout으로 자동 사라짐 구현
- 반응형 CSS로 모바일 최적화

**스토리 포인트:** 3  
**우선순위:** 낮음

---

## 📖 Epic 2: 길찾기 API 통합

**설명:** 네이버 길찾기 API를 8개 방향으로 호출하여 정확한 isochrone 폴리곤 생성

**비즈니스 가치:**
- 정확도 80% 향상 (원형 → 도로 기반)
- API 비용 95% 절감 (무한 → 8회)
- 기술 혁신으로 경쟁력 확보

**기술 요구사항:**
- 네이버 길찾기 API 호출 (8회)
- 도달 지점 계산 (각 방향별)
- Catmull-Rom 보간 알고리즘
- GeoJSON 변환

### User Story 2.1: 8개 방향 API 호출 구현

**제목:** 시스템은 8개 방향으로 길찾기 API를 호출하여 도달 지점을 계산합니다.

**설명:**
사용자가 위치, 시간, 이동수단을 입력하면, 시스템은 북/북동/동/남동/남/남서/서/북서 8개 방향으로 길찾기 API를 호출합니다.

**Acceptance Criteria:**
- AC2.1.1: 8개 방향 정의: N, NE, E, SE, S, SW, W, NW
- AC2.1.2: 각 방향별 거리 계산: distance = time * speed
- AC2.1.3: 거리별 끝점 좌표 생성 (haversine 공식)
- AC2.1.4: 길찾기 API 호출 (병렬 처리 권장)
- AC2.1.5: API 호출당 타임아웃: 5초
- AC2.1.6: 전체 호출 타임아웃: 30초
- AC2.1.7: 도달 지점 좌표 추출 및 저장

**기술 상세:**
```typescript
// 8개 방향 정의
const directions = [
  { name: 'N', angle: 0 },
  { name: 'NE', angle: 45 },
  // ...
];

// 병렬 API 호출
const results = await Promise.allSettled(
  directions.map(dir => callNaverDirections(center, endpoint, mode))
);
```

**스토리 포인트:** 8  
**우선순위:** 높음

---

### User Story 2.2: Catmull-Rom 보간 알고리즘

**제목:** 시스템은 8개 샘플 지점으로부터 매끄러운 폴리곤을 생성합니다.

**설명:**
8개 방향에서 얻은 도달 지점들을 Catmull-Rom 곡선으로 보간하여 매끄럽고 자연스러운 폴리곤을 생성합니다.

**Acceptance Criteria:**
- AC2.2.1: Catmull-Rom 곡선 알고리즘 구현
- AC2.2.2: 8개 포인트를 16개 이상의 폴리곤 포인트로 보간
- AC2.2.3: 폴리곤이 닫혀있음 (시작점 = 끝점)
- AC2.2.4: 곡선이 매끄러움 (급격한 각도 변화 없음)
- AC2.2.5: 보간 계산 시간 < 100ms

**기술 상세:**
```typescript
function catmullRom(p0, p1, p2, p3, t) {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
         (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
         v0 * t + p1;
}
```

**스토리 포인트:** 5  
**우선순위:** 높음

---

### User Story 2.3: GeoJSON 형식 변환

**제목:** 시스템은 계산 결과를 GeoJSON Feature로 변환합니다.

**설명:**
폴리곤 좌표를 GeoJSON Feature 형식으로 변환하여 지도에 렌더링할 수 있도록 합니다.

**Acceptance Criteria:**
- AC2.3.1: Feature 구조 준수 (type, geometry, properties)
- AC2.3.2: geometry.type = "Polygon"
- AC2.3.3: geometry.coordinates = [[lng, lat], ...] (좌표 순서)
- AC2.3.4: properties에 metadata 포함 (center, time, mode, method)
- AC2.3.5: RFC 7946 GeoJSON 표준 준수
- AC2.3.6: 검증 통과 (온라인 GeoJSON 검증 도구)

**기술 상세:**
```typescript
const geojson = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[[lng1, lat1], [lng2, lat2], ...]]
  },
  properties: {
    center: { lat, lng },
    time: timeMinutes,
    mode: transportMode,
    method: "catmull-rom-interpolation"
  }
};
```

**스토리 포인트:** 3  
**우선순위:** 높음

---

## 📖 Epic 3: 캐싱 & 성능 최적화

**설명:** 메모리 기반 캐싱으로 반복 검색을 1초 이내로 제공

**비즈니스 가치:**
- 반복 검색 시간 90% 단축 (10초 → 1초)
- 사용자 만족도 향상
- API 호출 50% 감소

**기술 요구사항:**
- 메모리 기반 캐시 구현
- TTL 기반 캐시 만료
- 캐시 키 전략

### User Story 3.1: 메모리 기반 캐시 구현

**제목:** 시스템은 검색 결과를 메모리에 캐싱합니다.

**설명:**
같은 위치, 시간, 이동수단 조합으로 검색하면 캐시된 결과를 1초 이내에 반환합니다.

**Acceptance Criteria:**
- AC3.1.1: Map 데이터 구조로 캐시 구현
- AC3.1.2: 캐시 키: `{lat}_{lng}_{time}_{mode}`
- AC3.1.3: 캐시 값: GeoJSON Feature
- AC3.1.4: 캐시 히트 응답 시간: < 1초
- AC3.1.5: TTL: 1시간 (3600초)
- AC3.1.6: TTL 만료 후 자동 삭제

**기술 상세:**
```typescript
const cache = new Map();

function getCacheKey(lat, lng, time, mode) {
  return `${lat}_${lng}_${time}_${mode}`;
}

function setCache(key, value) {
  cache.set(key, { value, expires: Date.now() + 3600000 });
  // TTL 후 자동 삭제
  setTimeout(() => cache.delete(key), 3600000);
}

function getCache(key) {
  return cache.get(key)?.value || null;
}
```

**스토리 포인트:** 5  
**우선순위:** 높음

---

### User Story 3.2: 캐시 히트율 모니터링

**제목:** 시스템은 캐시 히트율을 추적합니다.

**설명:**
캐시 히트율을 모니터링하여 60% 이상 달성하고 성능 개선 효과를 측정합니다.

**Acceptance Criteria:**
- AC3.2.1: 캐시 요청 수 추적 (hit + miss)
- AC3.2.2: 캐시 히트율 계산: hits / (hits + misses)
- AC3.2.3: 히트율 >= 60% 목표
- AC3.2.4: 로깅: "[CACHE] Hit: 120, Miss: 80, Rate: 60%"
- AC3.2.5: 대시보드/콘솔에서 확인 가능

**기술 상세:**
```typescript
let cacheStats = { hits: 0, misses: 0 };

function logCacheStats() {
  const rate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);
  console.log(`[CACHE] Hit: ${cacheStats.hits}, Miss: ${cacheStats.misses}, Rate: ${(rate * 100).toFixed(1)}%`);
}
```

**스토리 포인트:** 3  
**우선순위:** 중간

---

## 📖 Epic 4: 에러 처리 & 안정성

**설명:** 강화된 에러 처리로 신뢰할 수 있는 서비스 제공

**비즈니스 가치:**
- 신뢰성 확보 (95% 재시도 성공률)
- 사용자 경험 개선 (명확한 에러 메시지)
- 운영 효율성 향상 (부분 실패 처리)

**기술 요구사항:**
- 재시도 로직 (exponential backoff)
- 부분 실패 처리
- 사용자 친화적 에러 메시지

### User Story 4.1: API 호출 재시도 로직

**제목:** API 호출 실패 시 자동 재시도합니다.

**설명:**
API 호출이 실패하면 exponential backoff를 사용하여 최대 3회 재시도합니다.

**Acceptance Criteria:**
- AC4.1.1: 재시도 횟수: 최대 3회
- AC4.1.2: Backoff 시간: 1초 → 2초 → 4초
- AC4.1.3: 재시도 성공 시 결과 반환
- AC4.1.4: 3회 실패 후 에러 반환
- AC4.1.5: 로깅: "[RETRY] Attempt 1/3, waiting 1s..."
- AC4.1.6: 재시도 성공률: 95% 이상

**기술 상세:**
```typescript
async function callWithRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries}, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**스토리 포인트:** 5  
**우선순위:** 높음

---

### User Story 4.2: 부분 실패 처리

**제목:** 일부 방향만 실패해도 부분 결과를 제공합니다.

**설명:**
8개 중 일부 방향 호출이 실패해도, 성공한 방향의 데이터로 보간하여 폴리곤을 생성합니다.

**Acceptance Criteria:**
- AC4.2.1: 부분 실패 감지 (일부 방향만 실패)
- AC4.2.2: 성공한 포인트로 보간 (최소 4개 필요)
- AC4.2.3: 사용자에게 "부분 계산됨" 표시
- AC4.2.4: 실패한 방향 포인트는 이웃 포인트로 보간
- AC4.2.5: 폴리곤 정확도: 90% 이상 유지

**기술 상세:**
```typescript
const results = await Promise.allSettled(directionCalls);
const successPoints = results
  .map((r, i) => r.status === 'fulfilled' ? { index: i, point: r.value } : null)
  .filter(x => x !== null);

if (successPoints.length < 8) {
  console.warn(`[PARTIAL] Got ${successPoints.length}/8 points, using interpolation`);
  // 이웃 포인트로 보간
}
```

**스토리 포인트:** 5  
**우선순위:** 높음

---

### User Story 4.3: 사용자 친화적 에러 메시지

**제목:** 사용자는 명확한 에러 메시지를 받습니다.

**설명:**
기술적 오류 대신 사용자가 이해할 수 있는 메시지를 표시합니다.

**Acceptance Criteria:**
- AC4.3.1: 에러 메시지는 기술적 용어 제외
- AC4.3.2: 예시:
  - ❌ "Error: Cannot read property 'latLng' of undefined"
  - ✅ "위치를 찾을 수 없습니다. 다시 시도해주세요."
- AC4.3.3: 재시도 유도 메시지 포함
- AC4.3.4: 모바일/데스크톱 모두 가독성 확보
- AC4.3.5: 5초 또는 사용자 클릭으로 닫기

**기술 상세:**
```typescript
const errorMessages = {
  'API_TIMEOUT': '요청이 시간 초과되었습니다. 다시 시도해주세요.',
  'NETWORK_ERROR': '네트워크 오류가 발생했습니다.',
  'PARTIAL_FAILURE': '일부 경로만 계산되었습니다. 결과를 확인해주세요.',
  'INVALID_INPUT': '잘못된 입력입니다. 확인 후 다시 시도해주세요.',
};

function showError(errorType) {
  const message = errorMessages[errorType] || '오류가 발생했습니다.';
  showNotification(message, 'error', 5000);
}
```

**스토리 포인트:** 3  
**우선순위:** 중간

---

### User Story 4.4: 타임아웃 처리

**제목:** 요청이 오래 걸릴 경우 타임아웃 처리합니다.

**설명:**
개별 API 호출은 5초, 전체 요청은 30초 타임아웃으로 설정합니다.

**Acceptance Criteria:**
- AC4.4.1: 개별 API 호출 타임아웃: 5초
- AC4.4.2: 전체 요청 타임아웃: 30초
- AC4.4.3: 타임아웃 시 에러 메시지 표시
- AC4.4.4: 부분 결과 반환 (진행 중인 호출 캔슬)
- AC4.4.5: 로깅: "[TIMEOUT] Global timeout exceeded (30s)"

**기술 상세:**
```typescript
const INDIVIDUAL_TIMEOUT = 5000;
const GLOBAL_TIMEOUT = 30000;

async function callWithTimeout(fn, timeout) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeout)
    )
  ]);
}
```

**스토리 포인트:** 3  
**우선순위:** 높음

---

## 📊 Requirements Coverage Map

| FR | Epic | Story | Status |
|----|------|-------|--------|
| FR1-3 | E1 | S1.1-1.3 | ✅ |
| FR4-6 | E2 | S2.1 | ✅ |
| FR7-9 | E2 | S2.2-2.3 | ✅ |
| FR10-12 | E3 | S3.1-3.2 | ✅ |
| FR13-15 | E4 | S4.1-4.4 | ✅ |
| FR16-18 | E1-E4 | 전체 | ✅ |

---

## 🎯 Story 요약

**총 Story 수:** 12개

| Epic | Story 수 | 총 포인트 |
|------|---------|---------|
| E1 | 3 | 11 |
| E2 | 3 | 16 |
| E3 | 2 | 8 |
| E4 | 4 | 16 |
| **합계** | **12** | **51** |

---

## 📅 Sprint 계획

**Sprint 1 (2주):**
- E1 (지도 클릭): 11 포인트 → 완료
- E2 (API 통합): 16 포인트 → 진행 중

**Sprint 2 (2주):**
- E2 (API 통합): 16 포인트 → 완료
- E3 (캐싱): 8 포인트 → 완료
- E4 (에러 처리): 16 포인트 → 진행 중

---

**Epics & Stories 작성 완료!** ✅

이제 개발팀이 각 Story의 Acceptance Criteria를 기반으로 구현을 시작할 수 있습니다.

**다음 단계:** `*develop-story` — 실제 개발 시작
