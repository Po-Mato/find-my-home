# Architecture – Backend

**부분:** Backend Layer  
**디렉터리:** `app/api/`  
**유틸리티:** `lib/bmad.ts`

---

## 📋 개요

백엔드는 **Next.js 15.5** API Routes를 사용하여 서버사이드 로직을 처리합니다. 사용자로부터 받은 요청을 검증하고, isochrone 계산을 수행한 후, GeoJSON 형식의 응답을 반환합니다.

### 핵심 책임
- 🔐 API 엔드포인트 정의 및 요청 검증
- 📍 Isochrone 계산 로직 실행
- 📤 GeoJSON 형식 응답 반환
- 🛡️ 민감 정보 보호 (환경 변수 보안)

---

## 🌐 API 엔드포인트

### 1. `POST /api/isochrone` – Isochrone 계산

**파일:** `app/api/isochrone/route.ts`

**설명:** 중심 좌표, 시간, 이동수단을 받아 도달 가능 영역을 계산하여 GeoJSON으로 반환합니다.

#### 요청 (Request)

**메서드:** `POST`

**Content-Type:** `application/json`

**페이로드:**
```json
{
  "center": {
    "lat": 37.5651,
    "lng": 126.9787
  },
  "time": 15,
  "mode": "walking"
}
```

**필드 설명:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `center` | Object | ✅ | 중심 좌표 |
| `center.lat` | number | ✅ | 위도 (-90 ~ 90) |
| `center.lng` | number | ✅ | 경도 (-180 ~ 180) |
| `time` | number | ✅ | 도달 시간 (분, 1 이상) |
| `mode` | string | ❌ | 이동수단: `"walking"`, `"driving"`, `"transit"` (기본: `"walking"`) |

#### 응답 (Response)

**성공 (200 OK):**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [126.9787, 37.5651],
        [126.98, 37.5651],
        ...
        [126.9787, 37.5651]
      ]
    ]
  },
  "properties": {
    "center": { "lat": 37.5651, "lng": 126.9787 },
    "timeMinutes": 15,
    "mode": "walking",
    "method": "bmad-placeholder",
    "radiusMeters": 1200
  }
}
```

**실패 (400 Bad Request):**
```json
{
  "error": "invalid_input"
}
```

**설명:**
- 입력 검증 실패 (center 또는 time 누락/잘못된 형식)

**실패 (500 Internal Server Error):**
```json
{
  "error": "server_error",
  "detail": "에러 메시지 상세 정보"
}
```

**설명:**
- 서버에서 예상치 못한 에러 발생 (Isochrone 계산 실패 등)

#### 데이터 흐름

```
1. POST 요청 수신
   ↓
2. 요청 본문 파싱 (req.json())
   ↓
3. 입력 검증
   - center 존재 여부 확인
   - time이 숫자인지 확인
   ↓
4. computeIsochroneBMAD() 호출
   ├─ center, time, mode 전달
   └─ GeoJSON 반환
   ↓
5. NextResponse.json() 으로 응답
```

---

### 2. `GET /api/client-id` – 클라이언트 ID 제공

**파일:** `app/api/client-id/route.ts`

**설명:** 프론트엔드에서 사용할 네이버 지도 클라이언트 ID를 제공합니다.

#### 요청 (Request)

**메서드:** `GET`

**예시:**
```bash
curl http://localhost:8080/api/client-id
```

#### 응답 (Response)

**성공 (200 OK):**
```json
{
  "clientId": "your_ncp_client_id"
}
```

**주의사항:**
- clientId는 공개적으로 노출됨 (클라이언트 키이므로 의도된 동작)
- 비밀 키(NAVER_CLIENT_SECRET)는 절대 노출하지 않음

---

## 📚 유틸리티 함수

### `lib/bmad.ts` – Isochrone 계산 로직

**설명:** Isochrone 계산의 핵심 비즈니스 로직을 담당합니다.

#### 함수: `computeIsochroneBMAD()`

```typescript
async function computeIsochroneBMAD(
  center: Center,
  timeMinutes: number,
  mode: 'walking' | 'driving' | 'transit' = 'walking',
  opts: BMADOptions = {}
): Promise<GeoJSONFeature>
```

**파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `center` | `{ lat: number, lng: number }` | ✅ | 중심 좌표 |
| `timeMinutes` | number | ✅ | 도달 시간 (분) |
| `mode` | string | ❌ | 이동수단 (기본: `'walking'`) |
| `opts` | object | ❌ | 옵션 (예: `points` 개수) |

**반환값:**
```typescript
{
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[...]]
  },
  properties: {
    center: { lat, lng },
    timeMinutes: number,
    mode: 'walking' | 'driving' | 'transit',
    method: 'bmad-placeholder',
    radiusMeters: number
  }
}
```

#### 구현 알고리즘

**현재 구현 (Placeholder):**

1. **속도 결정:**
   ```
   walking  → 80 m/min
   driving  → 800 m/min
   transit  → 600 m/min
   ```

2. **반경 계산:**
   ```
   radiusMeters = timeMinutes × speed
   예: 15분 도보 = 15 × 80 = 1200m
   ```

3. **원형 폴리곤 생성:**
   - 중심에서 여러 방향으로 같은 거리의 점 생성
   - 지구 좌표계 (위도/경도) 변환 사용
   - 점의 개수: 기본 64개 (옵션으로 조정 가능)
   - 마지막 좌표 = 첫 번째 좌표 (폴리곤 폐곡선 완성)

4. **GeoJSON 반환:**
   ```
   Feature 형식으로 geometry(Polygon) + properties 포함
   ```

**수학 공식:**
```
위도 변위: dLat = dy / R
경도 변위: dLng = dx / (R * cos(lat))
R = 6378137 (지구 반지름, 미터)

데카르트 좌표 → 지리 좌표 변환:
newLat = (lat_rad + dLat) × (180 / π)
newLng = (lng_rad + dLng) × (180 / π)
```

#### 타입 정의

```typescript
export type Center = {
  lat: number;   // 위도
  lng: number;   // 경도
};

export type BMADOptions = {
  points?: number;  // 폴리곤 점의 개수 (기본: 64)
};
```

---

## 🔄 요청 처리 흐름

```
Frontend (NaverMap)
    ↓ POST /api/isochrone
    │ { center, time, mode }
    ↓
Backend (route.ts)
    ├─ 1. req.json() 파싱
    ├─ 2. center, time 검증
    │   ├─ center 필수 확인
    │   ├─ time이 number인지 확인
    │   └─ 실패 → 400 Bad Request
    ├─ 3. computeIsochroneBMAD() 호출
    │   └─ lib/bmad.ts 실행
    └─ 4. GeoJSON 응답
        └─ NextResponse.json(result)
    ↓
Frontend (NaverMap)
    └─ 응답받은 좌표로 폴리곤 렌더링
```

---

## 🛡️ 보안 고려사항

### 환경 변수 관리

**공개 변수:**
```
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
```
- 클라이언트 측에서 사용 가능
- 리포지토리에 노출해도 무관 (공개 키)

**비공개 변수 (계획):**
```
NAVER_CLIENT_SECRET
```
- 서버 측에서만 사용
- `.env.local` 에만 저장 (git에 커밋 금지)
- 향후 길찾기, 역지오코딩 등 민감 API 호출 시 사용

### 요청 검증

현재 구현:
- ✅ 입력값 타입 확인 (center 객체, time 숫자)
- ❌ 좌표 범위 검증 미흡 (lat: -90~90, lng: -180~180)
- ❌ 시간 상한선 검증 미흡 (합리적인 범위, 예: 1~480분)
- ❌ Rate limiting 미구현

**개선 권장:**
```typescript
if (latNum < -90 || latNum > 90) throw new Error('Invalid latitude');
if (lngNum < -180 || lngNum > 180) throw new Error('Invalid longitude');
if (timeNum < 1 || timeNum > 480) throw new Error('Time out of range');
```

---

## 🚀 배포 및 환경 설정

### 환경 변수 설정

**.env.local (로컬 개발):**
```bash
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_test_client_id
NAVER_CLIENT_SECRET=your_test_secret
```

**Vercel 환경 변수 설정:**
1. Vercel 대시보드 → 프로젝트 → Settings
2. Environment Variables 섹션
3. 추가:
   - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (public)
   - `NAVER_CLIENT_SECRET` (secret)

### 배포 시 주의사항

- NEXT_PUBLIC_* 접두사는 클라이언트에 노출됨
- 비밀 정보는 절대 NEXT_PUBLIC_ 접두사 사용 금지
- 배포 전 `.env.local` 파일 git 커밋 금지

---

## 🐛 에러 처리

### 현재 에러 처리

**route.ts 에러 핸들링:**
```typescript
try {
  // 요청 처리
  const result = await computeIsochroneBMAD(center, time, mode);
  return NextResponse.json(result);
} catch (err) {
  return NextResponse.json(
    { error: 'server_error', detail: String(err) },
    { status: 500 }
  );
}
```

### 개선 기회

- **구체적인 에러 타입 정의**
  ```typescript
  enum IsochroneErrorCode {
    INVALID_INPUT = 'invalid_input',
    CALCULATION_ERROR = 'calculation_error',
    API_ERROR = 'api_error',
    SERVER_ERROR = 'server_error'
  }
  ```

- **로깅 시스템 추가**
  - 모든 에러를 구조화된 로그로 기록
  - 프로덕션 모니터링 (Sentry 등)

- **사용자 친화적 메시지**
  ```json
  {
    "error": "calculation_error",
    "message": "도달 가능 영역 계산에 실패했습니다.",
    "detail": "..."
  }
  ```

---

## 📊 성능 고려사항

### 현재 성능 특성

- **계산 속도:** ⚡ 매우 빠름 (기하학 계산만)
- **응답 시간:** < 100ms
- **메모리 사용:** 매우 낮음
- **확장성:** 제한 없음 (무상태 함수)

### 최적화 기회

- **결과 캐싱**
  ```typescript
  // 같은 center + time + mode 요청 캐시
  Cache: {
    'center_lat_lng_time_mode': geojson
  }
  ```

- **배치 처리 (향후)**
  - 여러 요청을 한 번에 처리
  - 네이버 API 길찾기 통합 시 필요

---

## 📝 개발 노트

### BMAD Placeholder 관련

현재 구현은 **임시 플레이스홀더**입니다:
- ✅ 원형 폴리곤 생성 (기하학적 근사)
- ⚠️ 실제 길찾기 미포함
- ⚠️ 교통 상황, 도로망 미반영

**향후 개선:**
- 네이버 길찾기 API 통합
- 샘플링 + 경로 검사 알고리즘
- 격자(그리드) 방식 isochrone 계산
- OpenRouteService 등 외부 서비스 통합

### 주의사항

- `computeIsochroneBMAD`는 `async` 함수이지만 현재 비동기 작업 없음
- 향후 네이버 API 호출 시 `await` 필요

---

## 📚 관련 파일

- `app/api/isochrone/route.ts` — Isochrone API
- `app/api/client-id/route.ts` — 클라이언트 ID API
- `lib/bmad.ts` — 계산 로직
- `next.config.ts` — Next.js 설정

---

**마지막 업데이트:** 2025-12-11
