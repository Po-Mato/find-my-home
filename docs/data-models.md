# 데이터 모델

**버전:** 1.0.0  
**작성일:** 2025-12-11

---

## 📋 개요

이 문서는 Find My Home 프로젝트의 모든 타입 정의, 인터페이스, 데이터 구조를 명시합니다.

---

## 🧩 핵심 타입

### IsochroneParams

**파일:** `app/SearchForm.tsx`, `app/NaverMap.tsx`

**설명:** 사용자가 입력한 도달 가능 영역 계산 파라미터

```typescript
export type IsochroneParams = {
  center: {
    lat: number;      // 중심 위도 (-90 ~ 90)
    lng: number;      // 중심 경도 (-180 ~ 180)
  };
  time: number;       // 도달 시간 (분, 최소 1)
  mode: 'walking' | 'driving' | 'transit';  // 이동수단
};
```

**사용 위치:**
- `Home.page.tsx` — 상태 저장
- `SearchForm.tsx` — 입력 수집
- `NaverMap.tsx` — API 호출에 전달

**예시:**
```typescript
const params: IsochroneParams = {
  center: { lat: 37.5651, lng: 126.9787 },
  time: 15,
  mode: 'walking'
};
```

---

### Center

**파일:** `lib/bmad.ts`, `app/api/isochrone/route.ts`

**설명:** 지리적 좌표를 나타내는 기본 타입

```typescript
export type Center = {
  lat: number;   // 위도 (-90 ~ 90)
  lng: number;   // 경도 (-180 ~ 180)
};
```

**사용 위치:**
- Isochrone 계산 함수 입력
- API 응답 properties

**예시:**
```typescript
const center: Center = {
  lat: 37.5651,
  lng: 126.9787
};
```

---

### BMADOptions

**파일:** `lib/bmad.ts`

**설명:** Isochrone 계산 알고리즘 옵션

```typescript
export type BMADOptions = {
  points?: number;  // 폴리곤 점의 개수 (기본값: 64)
};
```

**사용 위치:**
- `computeIsochroneBMAD()` 함수의 선택적 파라미터

**예시:**
```typescript
const options: BMADOptions = {
  points: 128  // 더 상세한 폴리곤 생성
};
```

---

## 📡 GeoJSON 타입

### GeoJSON Feature (Isochrone)

**파일:** `lib/bmad.ts`, `app/api/isochrone/route.ts`

**설명:** Isochrone 계산 결과를 GeoJSON Feature 형식으로 반환

```typescript
interface IsochroneFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: Array<Array<[number, number]>>;  // [lng, lat] 순서
  };
  properties: {
    center: Center;                               // 입력된 중심 좌표
    timeMinutes: number;                          // 입력된 시간
    mode: 'walking' | 'driving' | 'transit';      // 입력된 이동수단
    method: 'bmad-placeholder';                   // 계산 방법
    radiusMeters: number;                         // 계산된 반경
  };
}
```

**구조:**
- **Feature:** GeoJSON Feature 객체
- **geometry:** 폴리곤 도형 정보
  - **Polygon:** 닫힌 경로로 이루어진 면
  - **coordinates:** 위도/경도 배열
    - 외부 링: 폴리곤 경계
    - 내부 링: 폴리곤 구멍 (현재 미사용)
- **properties:** 메타데이터

**좌표 포맷:**
```
[lng, lat] — GeoJSON 표준 (WGS84)
예: [126.9787, 37.5651]
```

**예시:**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [126.9787, 37.5651],
        [126.9815, 37.5651],
        [126.9815, 37.5680],
        [126.9787, 37.5680],
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

---

## 🎨 컴포넌트 Props 타입

### SearchFormProps

**파일:** `app/SearchForm.tsx`

```typescript
interface SearchFormProps {
  onSearch: (params: IsochroneParams) => void;  // 검색 콜백
  isLoading?: boolean;                           // 로딩 상태 (기본값: false)
}
```

**필드:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `onSearch` | function | ✅ | 검색 버튼 클릭 시 호출될 콜백 함수 |
| `isLoading` | boolean | ❌ | 로딩 중일 때 입력 폼 비활성화 |

---

### NaverMapProps

**파일:** `app/NaverMap.tsx`

```typescript
interface NaverMapProps {
  clientId: string;                                    // 네이버 API 클라이언트 ID
  params?: IsochroneParams | null;                    // 검색 파라미터
  onLoadingChange?: (loading: boolean) => void;       // 로딩 상태 콜백
}
```

**필드:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `clientId` | string | ✅ | 네이버 클라우드 플랫폼 클라이언트 ID |
| `params` | object | ❌ | Isochrone 계산 파라미터 |
| `onLoadingChange` | function | ❌ | 로딩 상태 변경 시 콜백 |

---

## 🔄 상태 타입

### Home 컴포넌트 상태

**파일:** `app/page.tsx`

```typescript
// params 상태
const [params, setParams] = useState<IsochroneParams | null>(null);

// isLoading 상태
const [isLoading, setIsLoading] = useState(false);
```

**상태 전이:**
```
초기 상태: params = null, isLoading = false
    ↓ (사용자가 검색)
검색 중: params = {...}, isLoading = true
    ↓ (API 응답)
완료: params = {...}, isLoading = false
```

---

## 📊 API 요청/응답 타입

### IsochroneRequest

**파일:** `app/api/isochrone/route.ts`

```typescript
type IsochroneRequest = {
  center: { lat: number; lng: number };
  time: number;
  mode?: 'walking' | 'driving' | 'transit';
};
```

---

### IsochroneResponse

**파일:** `app/api/isochrone/route.ts`

```typescript
type IsochroneResponse = {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: Array<Array<[number, number]>>;
  };
  properties: {
    center: { lat: number; lng: number };
    timeMinutes: number;
    mode: 'walking' | 'driving' | 'transit';
    method: 'bmad-placeholder';
    radiusMeters: number;
  };
};
```

---

## 🌍 외부 타입

### Naver Maps API 타입

**사용 위치:** `app/NaverMap.tsx`

```typescript
// 네이버 지도 인스턴스
declare namespace naver.maps {
  class Map {
    constructor(element: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setZoom(zoomLevel: number): void;
  }

  class Polygon {
    constructor(options: PolygonOptions);
    setMap(map: Map | null): void;
  }

  interface MapOptions {
    center: LatLng;
    zoom: number;
    mapTypeControl: boolean;
  }

  interface PolygonOptions {
    paths: LatLng[];
    map: Map;
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWeight: number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
  }
}
```

---

## 📈 타입 안전성

### TypeScript 컴파일 설정

**파일:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,           // 엄격한 타입 체크
    "noImplicitAny": true,    // any 타입 금지
    "strictNullChecks": true  // null 체크 강제
  }
}
```

---

## 🔄 타입 흐름도

```
SearchForm.tsx
  └─ IsochroneParams (출력)
      ↓
  page.tsx
  state: [params, setParams]
      ↓
  NaverMap.tsx
  props: params
      ↓
  API 호출
  POST /api/isochrone (IsochroneRequest)
      ↓
  route.ts
      ↓
  lib/bmad.ts
  computeIsochroneBMAD() 호출
      ↓
  IsochroneResponse (GeoJSON)
      ↓
  NaverMap.tsx
  폴리곤 렌더링
```

---

## 📚 타입 참고 문헌

- [GeoJSON 명세](https://tools.ietf.org/html/rfc7946)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [네이버 Maps API 문서](https://navermaps.github.io/maps.js.ncp/docs/)

---

**마지막 업데이트:** 2025-12-11
