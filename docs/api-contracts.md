# API 계약

**버전:** 1.0.0  
**작성일:** 2025-12-11  
**상태:** Active

---

## 📋 개요

이 문서는 Find My Home 프로젝트의 모든 API 엔드포인트의 명세를 정의합니다.

---

## 🌐 엔드포인트 목록

| 메서드 | 경로 | 설명 | 상태 |
|--------|------|------|------|
| `POST` | `/api/isochrone` | Isochrone 계산 | ✅ Active |
| `GET` | `/api/client-id` | 클라이언트 ID 제공 | ✅ Active |

---

## 📡 상세 명세

### 1. POST /api/isochrone

**설명:** 중심 좌표, 시간, 이동수단을 기반으로 도달 가능 영역을 계산합니다.

**Base URL:** `http://localhost:3000` (로컬) | `https://find-my-home.vercel.app` (프로덕션)

#### 요청

```http
POST /api/isochrone HTTP/1.1
Content-Type: application/json

{
  "center": {
    "lat": 37.5651,
    "lng": 126.9787
  },
  "time": 15,
  "mode": "walking"
}
```

**요청 본문 (Request Body):**

```typescript
{
  center: {
    lat: number;      // 필수, 범위: -90 ~ 90
    lng: number;      // 필수, 범위: -180 ~ 180
  };
  time: number;       // 필수, 최소값: 1 (분)
  mode?: string;      // 선택, 기본값: "walking"
                      // 가능한 값: "walking" | "driving" | "transit"
}
```

#### 응답

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
        [126.9815, 37.5665],
        ...
        [126.9787, 37.5651]
      ]
    ]
  },
  "properties": {
    "center": {
      "lat": 37.5651,
      "lng": 126.9787
    },
    "timeMinutes": 15,
    "mode": "walking",
    "method": "bmad-placeholder",
    "radiusMeters": 1200
  }
}
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | GeoJSON 타입 (항상 "Feature") |
| `geometry.type` | string | 도형 타입 (항상 "Polygon") |
| `geometry.coordinates` | array | 폴리곤 좌표 (위도/경도 순서: [lng, lat]) |
| `properties.center` | object | 입력받은 중심 좌표 |
| `properties.timeMinutes` | number | 입력받은 시간 |
| `properties.mode` | string | 입력받은 이동수단 |
| `properties.method` | string | 계산 방법 (현재: "bmad-placeholder") |
| `properties.radiusMeters` | number | 계산된 반경 (미터) |

**에러 (400 Bad Request):**

```json
{
  "error": "invalid_input"
}
```

**조건:**
- center 필드가 없음
- time이 숫자가 아님
- center.lat 또는 center.lng가 숫자가 아님

**에러 (500 Internal Server Error):**

```json
{
  "error": "server_error",
  "detail": "에러 메시지"
}
```

**조건:**
- Isochrone 계산 중 예외 발생

#### 사용 예제

**cURL:**
```bash
curl -X POST http://localhost:3000/api/isochrone \
  -H "Content-Type: application/json" \
  -d '{
    "center": {"lat": 37.5651, "lng": 126.9787},
    "time": 15,
    "mode": "walking"
  }'
```

**JavaScript/Fetch:**
```typescript
const response = await fetch('/api/isochrone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    center: { lat: 37.5651, lng: 126.9787 },
    time: 15,
    mode: 'walking'
  })
});

const geojson = await response.json();
if (!response.ok) {
  console.error('Error:', geojson.error);
} else {
  console.log('Isochrone polygon:', geojson.geometry.coordinates);
}
```

**Python/Requests:**
```python
import requests

response = requests.post(
  'http://localhost:3000/api/isochrone',
  json={
    'center': {'lat': 37.5651, 'lng': 126.9787},
    'time': 15,
    'mode': 'walking'
  }
)

if response.status_code == 200:
    geojson = response.json()
    print('Radius:', geojson['properties']['radiusMeters'], 'meters')
else:
    print('Error:', response.json()['error'])
```

---

### 2. GET /api/client-id

**설명:** 프론트엔드에서 사용할 네이버 지도 클라이언트 ID를 제공합니다.

#### 요청

```http
GET /api/client-id HTTP/1.1
```

#### 응답

**성공 (200 OK):**

```json
{
  "clientId": "your_ncp_client_id_here"
}
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `clientId` | string | 네이버 클라우드 플랫폼 클라이언트 ID |

#### 사용 예제

**cURL:**
```bash
curl http://localhost:3000/api/client-id
```

**JavaScript/Fetch:**
```typescript
const response = await fetch('/api/client-id');
const { clientId } = await response.json();
console.log('Client ID:', clientId);
```

---

## 🔐 보안

### 인증 (Authentication)
현재 프로젝트는 공개 API이므로 인증이 필요하지 않습니다.

**향후 개선:**
- API 키 기반 인증 추가
- Rate limiting 구현
- CORS 정책 강화

### HTTPS
프로덕션에서는 반드시 HTTPS를 사용하세요.

---

## 📊 성능 고려사항

### 응답 시간
- 평균: < 100ms
- 최대: < 500ms

### 동시 요청
현재 제한 없음 (향후 Rate limiting 추가 예정)

---

## 🐛 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 400 | `invalid_input` | 입력 검증 실패 |
| 500 | `server_error` | 서버 내부 에러 |

---

## 📝 변경 로그

### v1.0.0 (2025-12-11)
- 초기 API 명세 작성
- `/api/isochrone` 엔드포인트 정의
- `/api/client-id` 엔드포인트 정의

---

**마지막 업데이트:** 2025-12-11
