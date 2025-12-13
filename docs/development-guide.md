# 개발 가이드

**버전:** 1.0.0  
**작성일:** 2025-12-11

---

## 📋 개요

이 가이드는 Find My Home 프로젝트에서 로컬 개발 환경 설정, 코딩 규칙, Git 워크플로우, 테스트 방법을 설명합니다.

---

## 🚀 빠른 시작

### 사전 요구사항

- **Node.js:** >= 18.x
- **pnpm:** >= 8.x ([설치](https://pnpm.io/installation))
- **Git:** >= 2.x
- **네이버 클라우드 플랫폼 계정:** API 키 발급 필요

### 1단계: 저장소 클론

```bash
git clone https://github.com/username/find-my-home.git
cd find-my-home
```

### 2단계: 의존성 설치

```bash
pnpm install
```

**주의:** npm이나 yarn을 사용하지 마세요. 이 프로젝트는 pnpm을 사용합니다.

### 3단계: 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하세요:

```bash
# 필수: 네이버 지도 클라이언트 ID
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_ncp_client_id_here

# 선택: 서버 측 보안 키 (향후 사용)
NAVER_CLIENT_SECRET=your_client_secret
```

**네이버 API 키 발급:**
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
2. Console → Application → Maps
3. 클라이언트 ID 발급 및 복사

### 4단계: 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:8080](http://localhost:8080) 을 열어 앱을 확인하세요.

---

## 📁 프로젝트 구조

```
find-my-home/
├── app/
│   ├── page.tsx              # 메인 페이지
│   ├── layout.tsx            # 글로벌 레이아웃
│   ├── NaverMap.tsx          # 지도 컴포넌트
│   ├── SearchForm.tsx        # 입력 폼 컴포넌트
│   ├── api/
│   │   ├── isochrone/
│   │   │   └── route.ts      # Isochrone API
│   │   └── client-id/
│   │       └── route.ts      # 클라이언트 ID API
│   └── globals.css           # 글로벌 스타일
├── lib/
│   └── bmad.ts               # Isochrone 계산 로직
├── public/                   # 정적 자산
├── docs/                     # 프로젝트 문서 (이 디렉터리)
├── package.json              # 의존성 정의
├── tsconfig.json             # TypeScript 설정
├── next.config.ts            # Next.js 설정
└── tailwind.config.mjs        # Tailwind CSS 설정
```

---

## 💻 개발 워크플로우

### 브랜치 규칙

**주요 브랜치:**
- `main` — 프로덕션 코드 (보호됨)
- `develop` — 개발 통합 브랜치

**피처 브랜치:**
```
feature/{기능명}
```

**버그 픽스 브랜치:**
```
fix/{버그설명}
```

**예시:**
```bash
git checkout -b feature/isochrone-algorithm
git checkout -b fix/map-rendering-issue
```

### 커밋 메시지 규칙

**형식:**
```
[타입]: 한글 설명

본문 (선택사항):
- 상세한 변경 내용
- 여러 줄 가능
```

**타입:**
| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 코드 리팩토링 |
| `docs` | 문서 변경 |
| `style` | 코드 스타일 (세미콜론, 들여쓰기 등) |
| `chore` | 빌드, 의존성 등 |
| `test` | 테스트 추가/수정 |

**예시:**
```
feat: 지도에 isochrone 폴리곤 표시

- 네이버 Maps API 통합
- GeoJSON 좌표를 폴리곤으로 변환
- 폴리곤 스타일 (색상, 투명도) 설정

Closes #123
```

### Pull Request 프로세스

1. **피처 브랜치에서 작업:**
   ```bash
   git checkout -b feature/my-feature
   # ... 코드 작성 ...
   git add .
   git commit -m "feat: 새로운 기능"
   git push origin feature/my-feature
   ```

2. **PR 생성:**
   - GitHub에서 "Create Pull Request" 클릭
   - 제목: 변경 요약
   - 설명: 변경 이유, 테스트 방법 기술

3. **코드 리뷰:**
   - 팀원의 피드백 반영
   - 요청된 변경사항 적용

4. **병합:**
   - `develop` 또는 `main` 브랜치로 병합
   - PR 자동 닫기

---

## 🎨 코딩 규칙

### TypeScript

**타입 정의는 필수:**
```typescript
// ❌ 나쁜 예
const handleSearch = (params) => {
  // ...
};

// ✅ 좋은 예
const handleSearch = (params: IsochroneParams): void => {
  // ...
};
```

**any 타입 금지:**
```typescript
// ❌ 금지
const result: any = fetchData();

// ✅ 올바른 방법
const result: IsochroneResponse = fetchData();
```

**인터페이스 활용:**
```typescript
interface UserInput {
  lat: number;
  lng: number;
  time: number;
}

const validate = (input: UserInput): boolean => {
  return input.lat >= -90 && input.lat <= 90;
};
```

### React

**함수형 컴포넌트 사용:**
```typescript
// ✅ 함수형 (권장)
const MyComponent: React.FC<Props> = ({ prop1 }) => {
  return <div>{prop1}</div>;
};

// ❌ 클래스형 (지양)
class MyComponent extends React.Component {
  render() { return <div />; }
}
```

**Props 분해 (Destructuring):**
```typescript
// ✅ 좋은 예
const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  // ...
};

// ❌ 나쁜 예
const SearchForm = (props: SearchFormProps) => {
  return <form onSubmit={props.onSearch} />;
};
```

**조건부 렌더링:**
```typescript
// ✅ && 연산자 (간단한 경우)
{isLoading && <Spinner />}

// ✅ 삼항 연산자 (조건이 복잡한 경우)
{isLoading ? <Spinner /> : <Content />}

// ❌ if 문 (JSX 외부에서만)
if (isLoading) return <Spinner />;
```

### 네이밍 컨벤션

**변수 & 함수:**
```typescript
// ✅ camelCase
const userData = {};
const fetchUserData = () => {};

// ❌ snake_case (금지)
const user_data = {};
const fetch_user_data = () => {};
```

**컴포넌트:**
```typescript
// ✅ PascalCase
export const SearchForm = () => {};
export const NaverMap = () => {};

// ❌ camelCase (금지)
export const searchForm = () => {};
```

**상수:**
```typescript
// ✅ UPPER_SNAKE_CASE
const API_TIMEOUT = 5000;
const DEFAULT_ZOOM_LEVEL = 11;

// ❌ camelCase (금지)
const apiTimeout = 5000;
```

### 주석 작성

**필요한 경우에만 작성:**
```typescript
// ✅ 유용한 주석
// 지구 반지름 (미터) - WGS84 기준
const EARTH_RADIUS = 6378137;

// ❌ 불필요한 주석
// 변수 i를 0으로 초기화
let i = 0;
```

**복잡한 로직 설명:**
```typescript
// ✅ 로직 설명
// 데카르트 좌표를 지리 좌표로 변환
// dLat = dy / R, dLng = dx / (R * cos(lat))
const newLat = (lat_rad + dLat) * (180 / Math.PI);
```

---

## 🧪 테스트

### 테스트 작성 가이드

**파일 위치:**
- 컴포넌트: `app/__tests__/ComponentName.test.tsx`
- 유틸리티: `lib/__tests__/utility.test.ts`

**테스트 작성 (Jest + React Testing Library):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import SearchForm from '@/app/SearchForm';

describe('SearchForm', () => {
  test('renders input fields', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    expect(screen.getByLabelText(/위도/i)).toBeInTheDocument();
  });

  test('validates latitude input', () => {
    render(<SearchForm onSearch={jest.fn()} />);
    const latInput = screen.getByLabelText(/위도/i);
    fireEvent.change(latInput, { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText(/검색/i));
    // alert 호출 확인
  });
});
```

### 테스트 실행

```bash
# 모든 테스트 실행
pnpm test

# 특정 파일 테스트
pnpm test SearchForm

# 감시 모드
pnpm test --watch
```

---

## 🔍 린팅 및 포맷팅

### ESLint (코드 품질)

```bash
# 린트 검사
pnpm lint

# 자동 수정
pnpm lint --fix
```

### Prettier (코드 포맷팅)

```bash
# 포맷팅 확인
pnpm format:check

# 자동 포맷팅
pnpm format
```

### Pre-commit 훅

커밋 전 자동으로 린팅 및 포맷팅을 실행합니다.

---

## 🚀 빌드 및 배포

### 로컬 빌드

```bash
pnpm build
```

### 프로덕션 실행

```bash
pnpm start
```

### Vercel 배포

```bash
# 자동 배포 (main 브랜치)
git push origin main
# → Vercel이 자동으로 빌드 및 배포
```

**환경 변수 설정:**
1. Vercel 대시보드 → 프로젝트
2. Settings → Environment Variables
3. 추가:
   - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
   - `NAVER_CLIENT_SECRET` (선택)

---

## 🐛 디버깅

### 브라우저 DevTools

**Console:**
```typescript
// 로그 출력
console.log('params:', params);

// 에러 추적
console.error('API Error:', error);

// 성능 측정
console.time('api-call');
// ... 코드 ...
console.timeEnd('api-call');
```

**Network 탭:**
- API 요청/응답 확인
- 상태 코드, 헤더, 본문 검사

**Elements/Inspector:**
- DOM 구조 확인
- 클래스, 속성 검사

### VS Code 디버거

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 📚 학습 리소스

### 프로젝트 관련
- [프로젝트 README](../README.md)
- [아키텍처 – 프론트엔드](./architecture-frontend.md)
- [아키텍처 – 백엔드](./architecture-backend.md)

### 기술
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 지도
- [네이버 Maps JavaScript API](https://navermaps.github.io/maps.js.ncp/docs/)
- [GeoJSON 명세](https://tools.ietf.org/html/rfc7946)

---

## 🆘 문제 해결

### "clientId가 없습니다" 에러

**원인:** `.env.local` 파일이 없거나 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 변수가 설정되지 않음

**해결:**
```bash
# .env.local 생성
echo "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_key" > .env.local
```

### "pnpm: command not found"

**원인:** pnpm이 설치되지 않음

**해결:**
```bash
# npm으로 pnpm 설치
npm install -g pnpm

# 또는 Homebrew (macOS)
brew install pnpm

# 버전 확인
pnpm --version
```

### 지도가 표시되지 않음

**확인 사항:**
1. clientId 설정 확인
2. 브라우저 콘솔의 에러 메시지 확인
3. 네이버 API 호출 상한 확인 (NCP 콘솔)

---

## 📞 지원

문제가 발생하면:
1. 이 문서의 관련 섹션 확인
2. 프로젝트 이슈 트래커에 문제 등록
3. 팀 채널에서 도움 요청

---

**마지막 업데이트:** 2025-12-11
