# Find My Home - 프로젝트 문서

**최종 업데이트:** 2025-12-11  
**프로젝트 유형:** Web (Full-Stack Next.js)  
**언어:** TypeScript / React  
**패키지 매니저:** pnpm

---

## 📚 문서 색인

이 문서는 `find-my-home` 프로젝트의 종합 참고 자료입니다. 각 섹션에서 프로젝트의 아키텍처, API, 컴포넌트 구조를 확인할 수 있습니다.

### 핵심 문서

1. **[프로젝트 개요](#-프로젝트-개요)** — 프로젝트의 목표, 기능, 기술 스택
2. **[아키텍처](#-아키텍처)** — 시스템 설계, 레이어 분리, 데이터 흐름
   - [Architecture – Frontend](./architecture-frontend.md) — React 컴포넌트, 상태 관리, UI 구조
   - [Architecture – Backend](./architecture-backend.md) — API 라우트, 비즈니스 로직, 데이터 처리
3. **[API 계약](#-api-계약)** — 엔드포인트 명세, 요청/응답 형식 [→ 보기](./api-contracts.md)
4. **[데이터 모델](#-데이터-모델)** — 타입 정의, 인터페이스, 데이터 스키마 [→ 보기](./data-models.md)
5. **[컴포넌트 인벤토리](#-컴포넌트-인벤토리)** — React 컴포넌트 목록 및 사용법 [→ 보기](./component-inventory.md)
6. **[개발 가이드](#-개발-가이드)** — 로컬 개발 환경 설정, 코딩 규칙, 워크플로우 [→ 보기](./development-guide.md)
7. **[배포 가이드](#-배포-가이드)** — 배포 설정, 환경 변수, 프로덕션 체크리스트 [→ 보기](./deployment-guide.md)
8. **[통합 아키텍처](#-통합-아키텍처)** — 외부 API 통합, 의존성 맵 [→ 보기](./integration-architecture.md)

---

## 🎯 프로젝트 개요

### 개요
사용자가 중심 지점(예: 집)과 시간(분)을 입력하면, 네이버 지도 API를 사용하여 해당 시간 내 도달 가능한 지역(isochrone)을 지도에 시각화하는 Next.js 풀스택 웹 애플리케이션입니다.

### 핵심 기능
- 🗺️ **중심 지점 선택** — 마커 드래그 또는 좌표 입력으로 시작점 설정
- ⏱️ **도달 시간 설정** — 분 단위로 이동 가능 시간 지정
- 🚶 **이동 수단 선택** — 도보, 자동차, 대중교통 중 선택
- 📍 **도달 영역 시각화** — 지도에 폴리곤으로 가능 지역 표시
- 📱 **반응형 UI** — 모바일/데스크톱 환경에 최적화

### 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| **프레임워크** | Next.js (App Router) | 15.5.0 |
| **UI 라이브러리** | React | 19.1.0 |
| **타입 체크** | TypeScript | ^5 |
| **스타일링** | Tailwind CSS | ^4 |
| **지도 API** | 네이버 Maps JavaScript API | - |
| **패키지 매니저** | pnpm | - |

### 프로젝트 구조

```
find-my-home/
├── app/                          # Next.js App Router 디렉터리
│   ├── page.tsx                 # 메인 홈페이지
│   ├── layout.tsx               # 글로벌 레이아웃
│   ├── NaverMap.tsx             # 네이버 지도 컴포넌트
│   ├── SearchForm.tsx           # 검색 폼 컴포넌트
│   └── api/                     # API 라우트
│       ├── isochrone/route.ts   # Isochrone 계산 엔드포인트
│       └── client-id/route.ts   # 클라이언트 ID 제공 엔드포인트
├── lib/                          # 공유 유틸리티
│   └── bmad.ts                  # Isochrone 계산 로직
├── public/                       # 정적 자산
├── docs/                         # 프로젝트 문서 (이 폴더)
├── package.json                 # 프로젝트 의존성
├── tsconfig.json                # TypeScript 설정
├── next.config.ts               # Next.js 설정
└── tailwind.config.mjs           # Tailwind CSS 설정
```

### 환경 요구사항

- **Node.js:** >= 18.x
- **pnpm:** >= 8.x
- **네이버 클라우드 플랫폼 계정:** API 키 발급 필요

### 환경 변수 설정

`.env.local` 파일에 다음 변수를 설정하세요:

```bash
# 필수: 네이버 지도 클라이언트 ID (클라이언트 측 사용)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_ncp_client_id

# 선택: 서버 측 보안 키 (향후 추가 API 호출용)
NAVER_CLIENT_SECRET=your_client_secret
```

---

## 🏗️ 아키텍처

### 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                     클라이언트 (Browser)              │
├─────────────────────────────────────────────────────┤
│  SearchForm (입력) → NaverMap (렌더링) → 폴리곤 표시  │
└──────────────┬──────────────────────────────────────┘
               │ HTTP POST /api/isochrone
               │ { center, time, mode }
               │
┌──────────────▼──────────────────────────────────────┐
│              Next.js 서버 (Backend)                  │
├─────────────────────────────────────────────────────┤
│  /api/isochrone/route.ts → lib/bmad.ts              │
│  → GeoJSON 응답 { type, coordinates, properties }   │
└─────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│         네이버 지도 API (외부 서비스)                │
├─────────────────────────────────────────────────────┤
│  Maps JavaScript API                                 │
│  - 지도 렌더링                                       │
│  - 폴리곤 표시                                       │
│  - (향후) 길찾기 API 호출                            │
└─────────────────────────────────────────────────────┘
```

### 계층 분리 (Layered Architecture)

#### 프론트엔드 계층 (Frontend Layer)

**파일:** `app/page.tsx`, `app/NaverMap.tsx`, `app/SearchForm.tsx`

- **책임:**
  - 사용자 입력 수집 (중심 좌표, 시간, 이동수단)
  - 네이버 지도 렌더링
  - 서버 API 호출 및 응답 처리
  - 도달 영역 폴리곤 시각화

- **주요 컴포넌트:**
  - `SearchForm` — 입력 폼 (좌표, 시간, 이동수단)
  - `NaverMap` — 지도 렌더링 및 폴리곤 표시
  - `Home (page.tsx)` — 페이지 레이아웃 및 컴포넌트 조합

#### 백엔드 계층 (Backend Layer)

**파일:** `app/api/isochrone/route.ts`, `app/api/client-id/route.ts`

- **책임:**
  - API 엔드포인트 정의
  - 요청 검증
  - 비즈니스 로직 실행 (isochrone 계산)
  - GeoJSON 형식 응답

- **주요 엔드포인트:**
  - `POST /api/isochrone` — Isochrone 계산 요청
  - `GET /api/client-id` — 클라이언트 ID 제공

#### 유틸리티 계층 (Utility Layer)

**파일:** `lib/bmad.ts`

- **책임:**
  - Isochrone 계산 알고리즘 구현
  - 좌표 생성 및 필터링
  - GeoJSON 포맷 생성

- **주요 함수:**
  - `computeIsochroneBMAD(center, time, mode)` — Isochrone 계산

### 데이터 흐름

```
1. 사용자 입력
   SearchForm에서 중심 좌표, 시간(분), 이동수단 입력
   
2. 요청 전송
   NaverMap에서 /api/isochrone으로 POST 요청
   페이로드: { center: { lat, lng }, time: number, mode: string }
   
3. 서버 처리
   route.ts에서 요청 검증
   lib/bmad.ts의 computeIsochroneBMAD() 실행
   GeoJSON 생성: { type: "Polygon", coordinates: [...] }
   
4. 응답 반환
   GeoJSON 응답 클라이언트로 전달
   
5. UI 렌더링
   NaverMap에서 응답받은 폴리곤을 지도에 그리기
```

---

더 자세한 내용은 다음 문서를 참고하세요:

- **[Architecture – Frontend](./architecture-frontend.md)** — React 컴포넌트 상세 분석
- **[Architecture – Backend](./architecture-backend.md)** — API 라우트 및 서버 로직 상세 분석

---

## 📡 API 계약

[**→ 전체 API 계약 문서 보기**](./api-contracts.md)

**개요:** 모든 API 엔드포인트의 명세, 요청/응답 형식, 에러 코드 정의

**주요 엔드포인트:**
- `POST /api/isochrone` — Isochrone 계산
- `GET /api/client-id` — 클라이언트 ID 제공

---

## 📊 데이터 모델

[**→ 전체 데이터 모델 문서 보기**](./data-models.md)

**개요:** TypeScript 인터페이스, 타입 정의, 데이터 구조 명세

**주요 타입:**
- `IsochroneParams` — 사용자 입력 파라미터
- `Center` — 지리적 좌표
- `IsochroneFeature` — GeoJSON Feature 응답

---

## 🧩 컴포넌트 인벤토리

[**→ 전체 컴포넌트 인벤토리 보기**](./component-inventory.md)

**개요:** React 컴포넌트 목록, Props 정의, 사용 예제

**주요 컴포넌트:**
1. **Home** (`app/page.tsx`) — 메인 페이지
2. **SearchForm** (`app/SearchForm.tsx`) — 입력 폼
3. **NaverMap** (`app/NaverMap.tsx`) — 지도 렌더링
4. **RootLayout** (`app/layout.tsx`) — 글로벌 레이아웃

---

## 📖 개발 가이드

[**→ 전체 개발 가이드 보기**](./development-guide.md)

**개요:** 로컬 개발 환경 설정, 코딩 규칙, Git 워크플로우, 테스트 방법

**빠른 시작:**
```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정
echo "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_key" > .env.local

# 3. 개발 서버 실행
pnpm dev

# 4. 브라우저에서 http://localhost:8080 열기
```

**코딩 규칙:**
- TypeScript 필수 (any 타입 금지)
- camelCase 변수명, PascalCase 컴포넌트명
- 함수형 React 컴포넌트 사용
- 의미 있는 커밋 메시지 작성

---

## 🚀 배포 가이드

[**→ 전체 배포 가이드 보기**](./deployment-guide.md)

**개요:** Vercel 배포, 환경 변수 설정, 프로덕션 체크리스트, 모니터링

**배포 프로세스:**
1. 코드 push to main
2. Vercel 자동 빌드
3. 환경 변수 확인
4. 프로덕션 배포

**배포 전 체크리스트:**
- ✅ 모든 테스트 통과
- ✅ 린팅 검사 완료
- ✅ 환경 변수 설정
- ✅ 기능 검증

---

## 🔌 통합 아키텍처

[**→ 전체 통합 아키텍처 보기**](./integration-architecture.md)

**개요:** 외부 API 통합, 의존성 맵, 시스템 수준 아키텍처

**통합 서비스:**
- **네이버 Maps JavaScript API** (현재)
  - 지도 렌더링
  - 폴리곤 시각화
  
- **향후 계획**
  - Naver Directions API (길찾기)
  - Sentry (에러 추적)
  - 데이터베이스 (사용자 저장 위치)

---

## 추가 리소스

- 📚 [프로젝트 README](../README.md)
- 🗂️ [디렉터리 구조](../app)
- ⚙️ [환경 설정](../.env.local.example)

---

**문서 생성 도구:** BMAD Document Project Workflow  
**생성 일시:** 2025-12-11T12:44:30.918Z
