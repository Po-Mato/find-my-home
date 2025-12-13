# 컴포넌트 인벤토리

**버전:** 1.0.0  
**작성일:** 2025-12-11

---

## 📋 개요

이 문서는 Find My Home 프로젝트의 모든 React 컴포넌트를 나열하고, Props, 상태, 사용 방법을 설명합니다.

---

## 📚 컴포넌트 목록

| 컴포넌트 | 파일 | 타입 | 설명 |
|---------|------|------|------|
| **Home** | `app/page.tsx` | Page | 메인 페이지 (레이아웃 + 상태 관리) |
| **SearchForm** | `app/SearchForm.tsx` | 입력 컴포넌트 | 사용자 입력 폼 |
| **NaverMap** | `app/NaverMap.tsx` | 시각화 컴포넌트 | 지도 렌더링 |
| **RootLayout** | `app/layout.tsx` | 레이아웃 | 글로벌 레이아웃 |

---

## 🧩 상세 컴포넌트 명세

### 1. Home (page.tsx)

**파일:** `app/page.tsx`

**타입:** Page Component (Next.js)

**책임:**
- 전체 페이지 레이아웃 구성
- SearchForm과 NaverMap 상태 관리
- 컴포넌트 간 데이터 흐름 조정

#### Props

없음 (페이지 컴포넌트)

#### 상태

```typescript
const [params, setParams] = useState<IsochroneParams | null>(null);
const [isLoading, setIsLoading] = useState(false);
const naverMapRef = useRef<any>(null);
```

| 상태 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `params` | `IsochroneParams \| null` | `null` | 현재 검색 파라미터 |
| `isLoading` | `boolean` | `false` | 로딩 상태 |
| `naverMapRef` | `React.Ref` | - | NaverMap 참조 |

#### 콜백

```typescript
const handleSearch = useCallback(async (searchParams: IsochroneParams) => {
  setIsLoading(true);
  setParams(searchParams);
}, []);
```

#### 구조

```
<Home>
  ├─ <header className="bg-white shadow-md">
  │  └─ 제목 및 설명
  │
  └─ <main className="container mx-auto px-4 py-8">
     ├─ <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
     │  ├─ <SearchForm>
     │  │  └─ onSearch={handleSearch}
     │  │
     │  └─ <NaverMap wrapper>
     │     ├─ <NaverMap>
     │     │  ├─ clientId
     │     │  ├─ params
     │     │  └─ onLoadingChange
     │     │
     │     └─ <guide message>
     │        (params가 없을 때만 표시)
```

#### 스타일

- **배경:** Tailwind `bg-gradient-to-br from-blue-50 to-indigo-100`
- **레이아웃:** Grid (모바일: 1칼럼, 데스크톱: 4칼럼)
- **반응형:** `lg:col-span-1` (SearchForm), `lg:col-span-3` (NaverMap)

#### 라이프사이클

```typescript
useCallback(() => {
  setIsLoading(true);
  setParams(searchParams);
  // NaverMap의 useEffect가 params 변경 감지
  // → API 호출 → setIsLoading(false) 호출
}, [])
```

#### 사용 예제

```typescript
// 사용자가 SearchForm에서 검색
const params: IsochroneParams = {
  center: { lat: 37.5651, lng: 126.9787 },
  time: 15,
  mode: 'walking'
};

// handleSearch(params) 호출
// → setParams(params)
// → NaverMap에서 params 변경 감지
// → API 호출 → 폴리곤 렌더링
```

---

### 2. SearchForm (SearchForm.tsx)

**파일:** `app/SearchForm.tsx`

**타입:** Controlled Input Component

**책임:**
- 사용자 입력 수집
- 입력값 검증
- 부모 컴포넌트에 데이터 전달

#### Props

```typescript
interface SearchFormProps {
  onSearch: (params: IsochroneParams) => void;  // 필수
  isLoading?: boolean;                           // 선택 (기본: false)
}
```

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `onSearch` | function | ✅ | 검색 버튼 클릭 시 호출 |
| `isLoading` | boolean | ❌ | 로딩 중일 때 입력 필드 비활성화 |

#### 상태

```typescript
const [lat, setLat] = useState<string>("37.5728");
const [lng, setLng] = useState<string>("126.9774");
const [time, setTime] = useState<string>("15");
const [mode, setMode] = useState<"walking" | "driving" | "transit">("walking");
```

| 상태 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `lat` | string | "37.5728" | 위도 입력값 |
| `lng` | string | "126.9774" | 경도 입력값 |
| `time` | string | "15" | 시간 입력값 |
| `mode` | string | "walking" | 이동수단 선택값 |

#### 입력 필드

```
┌─────────────────────────────────────┐
│ 도달 가능 영역 검색                   │
├─────────────────────────────────────┤
│ 위도 (Latitude)                      │
│ [입력 필드: 37.5728]                 │
├─────────────────────────────────────┤
│ 경도 (Longitude)                     │
│ [입력 필드: 126.9774]                │
├─────────────────────────────────────┤
│ 도달 시간 (분)                       │
│ [입력 필드: 15]                      │
├─────────────────────────────────────┤
│ 이동수단                             │
│ [드롭다운: walking ▼]                │
├─────────────────────────────────────┤
│ [검색 버튼 (로딩 중이면 비활성)]     │
└─────────────────────────────────────┘
```

#### 핸들러

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // 입력값 파싱
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const timeNum = parseInt(time, 10);
  
  // 검증
  if (isNaN(latNum) || isNaN(lngNum) || isNaN(timeNum)) {
    alert("올바른 좌표와 시간을 입력해주세요.");
    return;
  }
  if (timeNum <= 0) {
    alert("시간은 1분 이상이어야 합니다.");
    return;
  }
  
  // 부모에 전달
  onSearch({
    center: { lat: latNum, lng: lngNum },
    time: timeNum,
    mode
  });
};
```

#### 검증 규칙

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| `lat` | 유효한 숫자 | "올바른 좌표와 시간을 입력해주세요." |
| `lng` | 유효한 숫자 | "올바른 좌표와 시간을 입력해주세요." |
| `time` | 유효한 숫자 + >= 1 | "시간은 1분 이상이어야 합니다." |
| `mode` | 고정값 선택 | (검증 필요 없음) |

#### 스타일

- **폼 컨테이너:** `max-w-md mx-auto p-6 bg-white rounded-lg shadow-md`
- **입력 필드:** `px-3 py-2 border border-gray-300 rounded-md`
- **포커스:** `focus:ring-blue-500 focus:border-blue-500`
- **비활성:** `disabled:bg-gray-100`
- **버튼:** `px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700`

#### 사용 예제

```typescript
<SearchForm 
  onSearch={(params) => {
    console.log("검색:", params);
    // → { center: {lat, lng}, time, mode }
  }}
  isLoading={isLoading}
/>
```

---

### 3. NaverMap (NaverMap.tsx)

**파일:** `app/NaverMap.tsx`

**타입:** Visualization Component

**책임:**
- 네이버 지도 초기화
- API 호출 및 응답 처리
- 폴리곤 렌더링

#### Props

```typescript
interface NaverMapProps {
  clientId: string;
  params?: IsochroneParams | null;
  onLoadingChange?: (loading: boolean) => void;
}
```

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `clientId` | string | ✅ | 네이버 API 클라이언트 ID |
| `params` | object | ❌ | Isochrone 계산 파라미터 |
| `onLoadingChange` | function | ❌ | 로딩 상태 변경 콜백 |

#### 상태

```typescript
const mapElRef = useRef<HTMLDivElement | null>(null);
const mapInstanceRef = useRef<any>(null);
const polygonRef = useRef<any>(null);
const [errorVisible, setErrorVisible] = useState(false);
```

| 상태 | 타입 | 설명 |
|------|------|------|
| `mapElRef` | Ref | 지도 DOM 컨테이너 참조 |
| `mapInstanceRef` | Ref | 네이버 지도 인스턴스 |
| `polygonRef` | Ref | 폴리곤 인스턴스 |
| `errorVisible` | boolean | 에러 메시지 표시 여부 |

#### 라이프사이클

**효과 1: 지도 초기화**
```typescript
useEffect(() => {
  if (!clientId) return;
  
  // 1. 네이버 API 스크립트 동적 로드
  // 2. window.naver.maps 확인
  // 3. 지도 인스턴스 생성
  // 4. 초기 설정 (중심, 줌)
}, [clientId])
```

**효과 2: Isochrone 계산 및 폴리곤 렌더링**
```typescript
useEffect(() => {
  if (!params || !mapInstanceRef.current) return;
  
  // 1. onLoadingChange(true) 호출
  // 2. POST /api/isochrone 호출
  // 3. GeoJSON 응답 파싱
  // 4. 기존 폴리곤 제거
  // 5. 새 폴리곤 생성 및 지도에 추가
  // 6. onLoadingChange(false) 호출
}, [params, onLoadingChange])
```

#### API 호출

```typescript
const response = await fetch('/api/isochrone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(params)
});

const geojson = await response.json();
// → GeoJSON Feature
```

#### 폴리곤 렌더링

```typescript
// GeoJSON coordinates → Naver LatLng 배열
const coordinates = geojson.geometry.coordinates[0];
const latLngs = coordinates.map(([lng, lat]) => 
  new naver.maps.LatLng(lat, lng)
);

// 폴리곤 생성
const polygon = new naver.maps.Polygon({
  paths: latLngs,
  map: mapInstanceRef.current,
  fillColor: '#4B5BDB',
  fillOpacity: 0.3,
  strokeColor: '#2D3DBD',
  strokeWeight: 2
});
```

#### 에러 처리

```typescript
if (!response.ok) {
  setErrorVisible(true);
  console.error('API Error:', geojson.error);
}
```

#### 지도 설정

| 설정 | 값 | 설명 |
|------|-----|------|
| 초기 중심 | 37.5651, 126.9787 | 광화문 |
| 초기 줌 | 11 | 도시 레벨 |
| 지도 타입 컨트롤 | true | 표준/위성 전환 |

#### 폴리곤 스타일

| 속성 | 값 | 설명 |
|------|-----|------|
| `fillColor` | #4B5BDB | 파란색 |
| `fillOpacity` | 0.3 | 30% 투명도 |
| `strokeColor` | #2D3DBD | 진파란색 |
| `strokeWeight` | 2 | 2픽셀 경계선 |

#### 사용 예제

```typescript
<NaverMap
  clientId={process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || ""}
  params={{
    center: { lat: 37.5651, lng: 126.9787 },
    time: 15,
    mode: 'walking'
  }}
  onLoadingChange={(loading) => {
    console.log("로딩:", loading);
  }}
/>
```

---

### 4. RootLayout (layout.tsx)

**파일:** `app/layout.tsx`

**타입:** Root Layout Component (Next.js)

**책임:**
- 글로벌 메타데이터 정의
- HTML 구조 설정
- 글로벌 스타일 로드

#### 메타데이터

```typescript
export const metadata: Metadata = {
  title: "Find My Home",
  description: "지도상 특정 지점을 기준으로 도달 가능한 지역을 시각화합니다."
};
```

#### 구조

```typescript
<html lang="ko">
  <body className="bg-gray-50">
    {children}
  </body>
</html>
```

#### 스타일 로드

- Tailwind CSS (자동 로드)
- 글로벌 스타일 (필요 시 추가)

---

## 🔄 컴포넌트 데이터 흐름

```
SearchForm (입력)
    ↓ onSearch() 콜백
    ↓ IsochroneParams
    ↓
Home (상태 관리)
    ├─ params 상태 업데이트
    └─ isLoading 상태 업데이트
    ↓
NaverMap (시각화)
    ├─ params prop 변경 감지
    ├─ API 호출
    └─ 폴리곤 렌더링
    ↓
onLoadingChange() 콜백
    ↓
Home (isLoading 상태 업데이트)
```

---

## 📊 컴포넌트 책임 매트릭스

| 책임 | Home | SearchForm | NaverMap | RootLayout |
|------|------|-----------|---------|------------|
| 상태 관리 | ✅ | - | - | - |
| 사용자 입력 | - | ✅ | - | - |
| 데이터 검증 | - | ✅ | - | - |
| API 호출 | - | - | ✅ | - |
| 지도 렌더링 | - | - | ✅ | - |
| 폴리곤 시각화 | - | - | ✅ | - |
| 메타데이터 | - | - | - | ✅ |
| 글로벌 스타일 | - | - | - | ✅ |

---

## 🧪 테스트 가이드

### SearchForm 테스트
```typescript
// 입력값 검증 테스트
test('displays error when latitude is invalid', () => {
  // lat 필드에 "invalid" 입력
  // 검색 클릭
  // → alert 표시 확인
});

// 콜백 테스트
test('calls onSearch with correct params', () => {
  // lat, lng, time 입력
  // 검색 클릭
  // → onSearch 호출 확인
  // → 올바른 IsochroneParams 확인
});
```

### NaverMap 테스트
```typescript
// 지도 초기화 테스트
test('initializes map when clientId is provided', () => {
  // clientId 제공
  // → 지도 인스턴스 생성 확인
});

// API 호출 테스트
test('fetches isochrone when params change', async () => {
  // params 업데이트
  // → /api/isochrone 호출 확인
  // → 폴리곤 렌더링 확인
});
```

---

## 📚 관련 문서

- [Architecture – Frontend](./architecture-frontend.md)
- [데이터 모델](./data-models.md)
- [API 계약](./api-contracts.md)

---

**마지막 업데이트:** 2025-12-11
