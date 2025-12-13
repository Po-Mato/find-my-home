# Architecture – Frontend

**부분:** Frontend Layer  
**디렉터리:** `app/`  
**주요 파일:** `page.tsx`, `NaverMap.tsx`, `SearchForm.tsx`, `layout.tsx`

---

## 📋 개요

프론트엔드는 **Next.js 15.5** (App Router)와 **React 19**를 기반으로 하며, 사용자 입력을 받아 도달 가능 영역(isochrone)을 지도에 시각화합니다.

### 핵심 책임
- 🗺️ 사용자 입력 폼 렌더링
- 📍 네이버 지도 초기화 및 렌더링
- 🔄 서버 API 호출 및 응답 처리
- 📌 폴리곤 시각화

---

## 🧩 컴포넌트 구조

### 1. `app/page.tsx` – Home (메인 페이지)

**역할:** 페이지 레이아웃 및 컴포넌트 조합

```typescript
// 주요 상태
- params: IsochroneParams | null  // 현재 검색 파라미터
- isLoading: boolean              // 로딩 상태

// 주요 콜백
- handleSearch(searchParams)  // SearchForm에서 호출됨
```

**구조:**
```
<Home (page.tsx)>
  ├── <Header> 
  │   └── 제목 및 설명
  └── <main grid>
      ├── <SearchForm> (좌측)
      │   └── 입력 폼
      └── <NaverMap wrapper> (우측)
          ├── <NaverMap>
          │   └── 지도 렌더링
          └── 안내 메시지
```

---

### 2. `app/SearchForm.tsx` – 검색 폼

**역할:** 사용자 입력 수집 및 검증

**Props:**
```typescript
interface SearchFormProps {
  onSearch: (params: IsochroneParams) => void;  // 검색 콜백
  isLoading?: boolean;                           // 로딩 상태
}
```

**상태:**
```typescript
- lat: string        // 위도 입력값
- lng: string        // 경도 입력값
- time: string       // 도달 시간 입력값 (분)
- mode: string       // 이동수단 ('walking' | 'driving' | 'transit')
```

**주요 기능:**
1. **입력 필드:**
   - 위도 (Latitude) — 숫자, 소수점 4자리까지
   - 경도 (Longitude) — 숫자, 소수점 4자리까지
   - 도달 시간 — 1~120분
   - 이동수단 선택 (드롭다운)

2. **검증:**
   - 입력값이 유효한 숫자인지 확인
   - 시간이 1분 이상인지 확인
   - 검증 실패 시 alert로 사용자에게 알림

3. **핸들러:**
   - `handleSubmit` — 폼 제출 시 부모 컴포넌트에 데이터 전달

**기본값:**
```typescript
lat: "37.5728"   // 광화문 위도
lng: "126.9774"  // 광화문 경도
time: "15"       // 15분
mode: "walking"  // 도보
```

**스타일:** Tailwind CSS
- 반응형 폼 (max-width: 28rem)
- 입력 포커스 상태 (focus:ring-blue-500)
- 로딩 상태 시 비활성화 처리

---

### 3. `app/NaverMap.tsx` – 네이버 지도

**역할:** 지도 렌더링 및 폴리곤 시각화

**Props:**
```typescript
interface NaverMapProps {
  clientId: string;                     // 네이버 API 클라이언트 ID
  params?: IsochroneParams | null;      // 검색 파라미터
  onLoadingChange?: (loading: boolean) => void;  // 로딩 상태 콜백
}
```

**상태:**
```typescript
- mapInstance: naver.maps.Map      // 지도 인스턴스
- polygon: naver.maps.Polygon      // 폴리곤 인스턴스
- errorVisible: boolean            // 에러 메시지 표시 여부
```

**주요 기능:**

1. **지도 초기화:**
   - clientId를 사용하여 네이버 Maps API 스크립트 동적 로드
   - 지도 컨테이너 DOM 요소에 지도 렌더링
   - 중심: 37.5651, 126.9787 (광화문)
   - 줌 레벨: 11

2. **API 호출:**
   - params 변경 시 `/api/isochrone` 으로 POST 요청
   - 요청 페이로드:
     ```json
     {
       "center": { "lat": number, "lng": number },
       "time": number,
       "mode": "walking" | "driving" | "transit"
     }
     ```

3. **폴리곤 렌더링:**
   - 응답받은 GeoJSON 좌표를 네이버 지도 폴리곤으로 변환
   - 기존 폴리곤 제거 후 새 폴리곤 생성
   - 폴리곤 스타일: 반투명 파란색 (fillColor, strokeColor 설정)

4. **에러 처리:**
   - API 호출 실패 시 에러 메시지 표시
   - 사용자 친화적인 에러 메시지 (한국어)

**라이프사이클:**
```typescript
useEffect(() => {
  // 1. clientId 확인
  // 2. 네이버 API 스크립트 로드 (window.naver.maps 확인)
  // 3. 지도 초기화
  // 4. 클린업: 컴포넌트 언마운트 시 정리
})

useEffect(() => {
  // params 변경 감지
  // → /api/isochrone 호출
  // → 폴리곤 업데이트
})
```

**디버깅:**
- 콘솔 로그로 API 호출, 응답, 에러 추적
- clientId 마스킹 (보안)
- 로딩 상태 부모 컴포넌트에 전달

---

### 4. `app/layout.tsx` – 글로벌 레이아웃

**역할:** 모든 페이지의 기본 레이아웃 및 메타데이터 정의

**주요 설정:**
```typescript
- metadata: {
    title: "Find My Home",
    description: "..."
  }
- RootLayout
  - <html lang="ko">
  - Tailwind CSS 클래스 적용
  - 글로벌 스타일 로드
```

---

## 🔄 상태 관리

### 부모-자식 통신 패턴

```
Home (page.tsx) — State 보유
  ├── params: IsochroneParams | null
  ├── isLoading: boolean
  │
  ├─→ SearchForm
  │    └─ onSearch callback 전달
  │        └─ user input → params 업데이트
  │
  └─→ NaverMap
      ├─ params prop 전달
      ├─ onLoadingChange callback 전달
      └─ 감지: params 변경 → API 호출 → 폴리곤 업데이트
```

### 상태 플로우

1. **초기 상태:** `params = null`, `isLoading = false`
2. **사용자 입력:** SearchForm에서 검색 버튼 클릭
3. **params 업데이트:** `setParams(searchParams)`
4. **로딩 시작:** `setIsLoading(true)`
5. **NaverMap 감지:** `params` prop 변경 감지
6. **API 호출:** `POST /api/isochrone`
7. **폴리곤 렌더링:** 응답받은 좌표 사용
8. **로딩 종료:** `onLoadingChange(false)` 콜백 호출 → `setIsLoading(false)`

---

## 🎨 스타일링

### Tailwind CSS 사용

**색상 스킴:**
- 배경: `from-blue-50 to-indigo-100` (그라데이션)
- 텍스트: `gray-800` (어두운 회색)
- 강조: `blue-500`, `indigo-100` (파란색 계열)
- 경계선: `gray-300`, `blue-200` (밝은 회색)

**레이아웃:**
- Grid 시스템 (`grid-cols-1 lg:grid-cols-4`)
- SearchForm: 좌측 1칼럼
- NaverMap: 우측 3칼럼
- 모바일 (lg 이하): 1칼럼 (전체 너비)

### 반응형 디자인

```css
/* 모바일 */
grid-cols-1

/* 태블릿 이상 (lg: 1024px) */
lg:grid-cols-4
```

---

## 🔌 외부 API 의존성

### 네이버 Maps JavaScript API

**로드 방식:** 동적 로드 (dynamic script injection)

```typescript
const script = document.createElement('script');
script.src = 'https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...';
document.head.appendChild(script);
```

**사용:**
- `window.naver.maps.Map()` — 지도 인스턴스 생성
- `window.naver.maps.Polygon()` — 폴리곤 생성
- 지도 컨트롤: 확대/축소, 지도 타입 선택

**주의사항:**
- clientId는 공개적으로 노출됨 (클라이언트 키)
- 민감한 API 호출(길찾기 등)은 서버에서 처리 권장

---

## 📊 Props & Types

### IsochroneParams

```typescript
export type IsochroneParams = {
  center: { lat: number; lng: number };  // 중심 좌표
  time: number;                           // 도달 시간 (분)
  mode: "walking" | "driving" | "transit"; // 이동수단
};
```

---

## 🐛 에러 처리

### SearchForm
- 입력 검증 실패 → `alert()` 메시지
- 검증 통과 → 부모 컴포넌트에 데이터 전달

### NaverMap
- API 호출 실패 → 에러 메시지 표시
- 네이버 API 로드 실패 → 인증 오류 안내
- 네트워크 오류 → 사용자 친화적 메시지

---

## 🚀 성능 최적화

### 현재 상태
- React 19의 자동 배치 (batching)
- 컴포넌트별 독립적인 `useEffect` 관리
- 불필요한 리렌더링 최소화

### 개선 기회
- `useMemo`, `useCallback` 활용으로 메모이제이션
- 폴리곤 렌더링 최적화 (대규모 좌표 세트)
- 네이버 API 스크립트 로드 캐싱

---

## 📚 관련 파일

- `app/layout.tsx` — 글로벌 레이아웃
- `app/page.tsx` — 메인 페이지
- `tailwind.config.mjs` — Tailwind 설정
- `next.config.ts` — Next.js 설정

---

**마지막 업데이트:** 2025-12-11
