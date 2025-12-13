# 통합 아키텍처

**버전:** 1.0.0  
**작성일:** 2025-12-11

---

## 📋 개요

이 문서는 Find My Home 프로젝트의 외부 API 통합, 제3자 서비스, 의존성, 데이터 흐름을 시스템 수준에서 설명합니다.

---

## 🌐 외부 서비스 통합

### 1. 네이버 클라우드 플랫폼 (NCP)

**서비스:** Maps JavaScript API

**용도:**
- 지도 렌더링
- 폴리곤 시각화
- 사용자 상호작용 처리

**통합 방식:**
```
클라이언트 (Browser)
    ↓
<script src="https://openapi.map.naver.com/openapi/v3/maps.js">
    ↓
window.naver.maps (글로벌 객체)
    ↓
app/NaverMap.tsx에서 사용
```

**필수 설정:**
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 환경 변수
- NCP Console에서 API 활성화

**API 한도:**
- 현재: 무제한 (클라이언트 키)
- 주의: 클라이언트에서 노출됨

**향후 계획:**
- 길찾기 API (Directions API)
  ```
  네이버 길찾기 API
    ↓ (서버사이드)
  /api/isochrone
    ↓
  경로 계산 → Isochrone 생성
  ```

- 역지오코딩 (Reverse Geocoding)
  ```
  좌표 입력
    ↓
  /api/reverse-geocode (서버사이드)
    ↓
  주소 반환
  ```

---

## 🏗️ 시스템 아키텍처 (High-Level)

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 (User)                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌─────────────────────▼────────────────────────────────────┐
│                웹 브라우저 (Client)                       │
├──────────────────────────────────────────────────────────┤
│  Find My Home Web App                                    │
│  ├─ React Components (NaverMap, SearchForm)             │
│  ├─ State Management                                    │
│  ├─ Tailwind CSS (스타일링)                             │
│  └─ Naver Maps API SDK (동적 로드)                      │
└──────────┬──────────────────────────────────┬───────────┘
           │ HTTP/REST                        │ SDK
           │ (Fetch API)                      │
     ┌─────▼─────────┐              ┌────────▼──────────┐
     │ Next.js       │              │ Naver Cloud       │
     │ Backend       │              │ Platform          │
     ├───────────────┤              ├──────────────────┤
     │ API Routes    │              │ Maps API          │
     │ ├─ /api/      │              │ ├─ 지도 렌더링    │
     │ │  isochrone  │              │ ├─ 폴리곤 표시    │
     │ └─ /api/      │              │ └─ (향후) 길찾기  │
     │    client-id  │              └──────────────────┘
     ├───────────────┤
     │ lib/bmad.ts   │
     │ (계산 로직)    │
     └───────────────┘
```

---

## 📊 데이터 흐름 (End-to-End)

```
1. 사용자 입력
   ┌──────────────────────────────────┐
   │ SearchForm                       │
   │ - 위도 입력 (37.5651)            │
   │ - 경도 입력 (126.9787)           │
   │ - 시간 입력 (15분)                │
   │ - 이동수단 선택 (walking)         │
   └──────────────┬───────────────────┘
                  │ IsochroneParams
                  ▼
2. 상태 업데이트
   ┌──────────────────────────────────┐
   │ Home (page.tsx)                  │
   │ setParams(searchParams)           │
   │ setIsLoading(true)               │
   └──────────────┬───────────────────┘
                  │ props 전달
                  ▼
3. API 호출
   ┌──────────────────────────────────┐
   │ NaverMap.tsx                     │
   │ fetch('/api/isochrone', {        │
   │   method: 'POST',                │
   │   body: JSON.stringify(params)    │
   │ })                               │
   └──────────────┬───────────────────┘
                  │ POST /api/isochrone
                  ▼
4. 서버 처리
   ┌──────────────────────────────────┐
   │ /api/isochrone/route.ts          │
   │ 1. req.json() 파싱                │
   │ 2. 입력 검증                     │
   │ 3. computeIsochroneBMAD() 호출   │
   └──────────────┬───────────────────┘
                  │ (center, time, mode)
                  ▼
5. 비즈니스 로직
   ┌──────────────────────────────────┐
   │ lib/bmad.ts                      │
   │ 1. 속도 결정                     │
   │ 2. 반경 계산                     │
   │ 3. 원형 폴리곤 생성               │
   │ 4. GeoJSON 반환                  │
   └──────────────┬───────────────────┘
                  │ GeoJSON Feature
                  ▼
6. 응답 반환
   ┌──────────────────────────────────┐
   │ NextResponse.json(result)         │
   │ {                                │
   │   type: 'Feature',               │
   │   geometry: { ... },             │
   │   properties: { ... }            │
   │ }                                │
   └──────────────┬───────────────────┘
                  │ JSON 응답
                  ▼
7. 클라이언트 처리
   ┌──────────────────────────────────┐
   │ NaverMap.tsx                     │
   │ 1. 응답 파싱                     │
   │ 2. 좌표 배열 추출                │
   │ 3. naver.maps.Polygon 생성       │
   │ 4. 지도에 추가                   │
   │ 5. setIsLoading(false) 호출      │
   └──────────────┬───────────────────┘
                  │
                  ▼
8. UI 렌더링
   ┌──────────────────────────────────┐
   │ 지도에 폴리곤 표시                │
   │ ├─ 파란색 폴리곤                  │
   │ ├─ 중심 마커                     │
   │ └─ 상호작용 (줌, 패닝)            │
   └──────────────────────────────────┘
```

---

## 🔄 의존성 맵

```
find-my-home (프로젝트)
│
├── Next.js 15.5
│   ├── React 19
│   ├── TypeScript 5
│   ├── Tailwind CSS 4
│   └── PostCSS
│
├── 네이버 Maps JavaScript API
│   └── (CDN에서 동적 로드)
│
├── Node.js 18+
│
└── pnpm (패키지 매니저)
```

---

## 🛡️ 보안 아키텍처

```
┌────────────────────────────────────────────────────┐
│           클라이언트 환경 (Browser)                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ✅ (공개)        │
│  → NaverMap.tsx에서 사용                           │
│  → 클라이언트 키 (노출 가능)                        │
│                                                    │
└────────────────────────────────────────────────────┘
                      │
         ┌────────────┴──────────────┐
         │                           │
         ▼                           ▼
    1️⃣ Maps API              2️⃣ /api/isochrone
  (공개 클라이언트)         (Next.js 백엔드)
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            Private 환경에서만:        계획: 길찾기 API
            NAVER_CLIENT_SECRET 사용  (민감한 기능)
            - 비밀 키 보호
            - 환경 변수
            - 서버 전용
```

---

## 🔐 인증 및 권한

### 현재 상태
- **인증:** 없음 (공개 API)
- **권한:** 없음 (모든 사용자 접근 가능)

### 향후 계획
- **API 키 기반 인증:**
  ```typescript
  // 헤더에 API 키 전달
  fetch('/api/isochrone', {
    headers: { 'X-API-Key': process.env.API_KEY }
  })
  ```

- **Rate Limiting:**
  ```typescript
  // 사용자당 요청 수 제한
  // 예: 분당 10회 요청
  ```

---

## 📈 확장성 고려사항

### 수평 확장 (Horizontal Scaling)

**현재 상태:** Vercel 자동 관리
- 무상태 함수 (Serverless)
- 자동 스케일링

**권장사항:**
- API 응답 캐싱 (Redis 등)
- CDN 활용 (정적 자산)
- 데이터베이스 필요 시 (향후)

### 수직 확장 (Vertical Scaling)

**병목 현상 예상:**
1. Naver Maps API 호출 한도
2. 복잡한 Isochrone 계산
3. 동시 사용자 수

**해결 방안:**
- API 호출 캐싱
- 계산 결과 캐싱
- 비동기 작업 큐 (Bull, Bull MQ)

---

## 🔄 에러 처리 아키텍처

```
사용자 요청
    │
    ▼
클라이언트 검증 (SearchForm)
    │
    ├─ 실패 → alert() → 사용자 안내
    │
    └─ 성공
        │
        ▼
    API 요청 (/api/isochrone)
        │
        ├─ 요청 실패
        │   ├─ 네트워크 에러 → 재시도 또는 에러 메시지
        │   └─ 타임아웃 → 재시도 또는 취소
        │
        ├─ 400 Bad Request
        │   └─ 입력 검증 실패 → 사용자 안내
        │
        ├─ 500 Server Error
        │   └─ 서버 에러 → 에러 메시지 + 로그
        │
        └─ 200 Success
            ├─ Isochrone 계산 성공
            └─ 폴리곤 렌더링
```

---

## 🚀 성능 최적화 전략

### 1. 캐싱 전략

```
클라이언트 캐시 (Browser Cache)
    ├─ 정적 자산 (JS, CSS)
    ├─ API 응답 (LocalStorage)
    └─ 이미지 (Service Worker)

서버 캐시 (Server-Side)
    ├─ API 응답 (메모리/Redis)
    ├─ 계산 결과 (Isochrone)
    └─ 데이터 (데이터베이스)
```

### 2. 로드 밸런싱

```
Vercel CDN
    ├─ 정적 파일 배포
    ├─ Edge Functions
    └─ Automatic Scaling
```

### 3. 모니터링

```
Vercel Analytics
    ├─ 페이지 로드 시간
    ├─ 사용자 상호작용
    └─ 에러율

Sentry (향후)
    ├─ 에러 추적
    ├─ 성능 프로파일링
    └─ 세션 재생
```

---

## 📚 마이크로 서비스 고려사항

### 현재
- **모놀리식 구조** (단일 Next.js 앱)
- 간단하고 배포 용이

### 향후 (대규모 화)
```
마이크로 서비스 아키텍처
├─ API Gateway
│   └─ /api/* 엔드포인트
├─ Isochrone Service
│   ├─ 계산 로직
│   └─ 캐싱
├─ Geocoding Service (향후)
│   ├─ 주소 검색
│   └─ 역지오코딩
└─ User Service (향후)
    ├─ 인증
    └─ 선호도
```

---

## 🔗 타사 통합 계획

### 1순위
- **Naver Directions API** (길찾기)
  ```
  사용자 입력
    ↓
  중심에서 여러 반경의 샘플 포인트 생성
    ↓
  각 포인트의 소요 시간 계산 (Directions API)
    ↓
  도달 가능 포인트만 필터링
    ↓
  Isochrone 생성
  ```

### 2순위
- **Sentry** (에러 추적)
- **Vercel Analytics** (성능 모니터링)
- **PostHog** (사용자 분석)

### 3순위
- **데이터베이스** (사용자 저장된 위치)
  - PostgreSQL + Prisma
  - 또는 MongoDB

---

## 📝 시스템 설계 원칙

1. **단순성 (Simplicity)**
   - 불필요한 복잡성 제거
   - 명확한 책임 분리

2. **확장성 (Scalability)**
   - 무상태 설계
   - 캐싱 활용

3. **보안 (Security)**
   - 환경 변수로 민감 정보 보호
   - 입력 검증 강화

4. **유지보수성 (Maintainability)**
   - 명확한 문서화
   - 일관된 코드 스타일

5. **성능 (Performance)**
   - 불필요한 API 호출 최소화
   - 결과 캐싱

---

## 📚 관련 문서

- [아키텍처 – 프론트엔드](./architecture-frontend.md)
- [아키텍처 – 백엔드](./architecture-backend.md)
- [API 계약](./api-contracts.md)
- [배포 가이드](./deployment-guide.md)

---

**마지막 업데이트:** 2025-12-11
