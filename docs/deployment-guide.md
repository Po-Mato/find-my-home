# 배포 가이드

**버전:** 1.0.0  
**작성일:** 2025-12-11

---

## 📋 개요

이 가이드는 Find My Home 프로젝트를 프로덕션 환경에 배포하고 관리하는 방법을 설명합니다.

---

## 🚀 Vercel 배포

### 1단계: Vercel 계정 설정

1. [Vercel](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. `find-my-home` 저장소 선택

### 2단계: 프로젝트 설정

**프로젝트 이름:** `find-my-home`

**Framework Preset:** `Next.js`

**Root Directory:** `./` (기본값)

**Build Command:** `pnpm build --turbopack` (Next.js 자동 감지)

**Output Directory:** `.next` (기본값)

**Install Command:** `pnpm install` (기본값)

### 3단계: 환경 변수 설정

Vercel Dashboard → 프로젝트 → Settings → Environment Variables

**필수 변수:**
```
Name: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
Value: your_ncp_client_id
Type: Plaintext
Environment: Production, Preview, Development
```

**선택 변수:**
```
Name: NAVER_CLIENT_SECRET
Value: your_client_secret
Type: Encrypted (보안)
Environment: Production
```

### 4단계: 자동 배포 활성화

```bash
# main 브랜치에 push하면 자동 배포
git push origin main
# → Vercel이 자동으로 빌드 및 배포
```

---

## 📦 배포 전 체크리스트

### 코드 품질

- [ ] 모든 테스트 통과
  ```bash
  pnpm test
  ```

- [ ] 린팅 검사 통과
  ```bash
  pnpm lint
  ```

- [ ] 타입 스크립트 컴파일 성공
  ```bash
  pnpm build
  ```

- [ ] 콘솔 에러 확인
  ```bash
  pnpm dev
  # 브라우저 DevTools → Console 확인
  ```

### 환경 설정

- [ ] `.env.local` 파일 **git에 커밋되지 않음** 확인
  ```bash
  git check-ignore .env.local
  ```

- [ ] 모든 필수 환경 변수 설정 확인
  ```bash
  grep "NEXT_PUBLIC_" .env.local
  ```

- [ ] Vercel 환경 변수 설정 완료

### 기능 검증

- [ ] 로컬에서 전체 워크플로우 테스트
  1. 좌표 입력
  2. 시간 설정
  3. 이동수단 선택
  4. 지도에 폴리곤 표시 확인

- [ ] 반응형 디자인 확인
  - [ ] 데스크톱 (1920x1080)
  - [ ] 태블릿 (768x1024)
  - [ ] 모바일 (375x667)

- [ ] 다양한 브라우저 테스트
  - [ ] Chrome
  - [ ] Safari
  - [ ] Firefox
  - [ ] Edge

### 문서 및 커밋

- [ ] 주요 변경사항 `CHANGELOG.md` 기록
- [ ] 모든 커밋 메시지 명확함
- [ ] PR 병합 전 리뷰 완료

---

## 🔐 보안 체크리스트

- [ ] API 키가 클라이언트에 노출되지 않음
  - `NEXT_PUBLIC_` 접두사 확인
  - 비밀 키는 서버 환경 변수만 사용

- [ ] `.env.local` 파일이 `.gitignore` 에 추가됨
  ```
  # .gitignore
  .env.local
  .env.*.local
  ```

- [ ] 민감한 정보가 로그에 출력되지 않음
  - 토큰, 키, 비밀번호 제거

- [ ] HTTPS 활성화 확인
  - Vercel은 자동으로 HTTPS 제공

- [ ] CORS 정책 검토
  - 필요시 Origin 제한

---

## 📊 배포 모니터링

### Vercel Dashboard

**배포 상태:**
- Deployments 탭에서 실시간 상태 확인
- 빌드 로그 확인
- 에러 발생 시 자동 알림

**성능 모니터링:**
- Analytics → Web Vitals
- 페이지 로드 시간
- 사용자 상호작용

### 에러 추적

**프로덕션 에러 처리:**
```typescript
// 에러 로깅 (선택)
try {
  const result = await fetch('/api/isochrone', {...});
} catch (error) {
  console.error('API Error:', error);
  // Sentry, LogRocket 등으로 전송 가능
}
```

---

## 🔄 배포 후 검증

### 1단계: URL 접속 확인

```bash
# Vercel 제공 URL 확인
https://find-my-home-<random>.vercel.app
```

### 2단계: 기능 테스트

1. 페이지 로드 확인
2. 좌표 입력 및 검색
3. 지도 폴리곤 표시
4. API 응답 확인 (Network 탭)

### 3단계: 성능 확인

```bash
# Lighthouse 분석
1. Chrome DevTools 열기
2. Lighthouse 탭
3. "Analyze page load" 클릭
```

**목표:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## 🆘 배포 문제 해결

### 빌드 실패

**일반적인 원인:**
- 타입 에러
- 누락된 환경 변수
- 의존성 설치 실패

**해결:**
```bash
# 로컬에서 재현
pnpm install
pnpm build

# 로그 확인 및 문제 수정
# Vercel 대시보드에서 재배포
```

### 환경 변수 미설정

**증상:** 지도가 표시되지 않음

**확인:**
```bash
# Vercel 대시보드
Settings → Environment Variables
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 값 확인
```

**해결:**
1. 환경 변수 추가/수정
2. Redeploy 클릭
3. 새로고침 (Ctrl+F5)

### API 호출 실패

**증상:** "API Error" 메시지

**확인:**
1. 네이버 API 호출 한도 확인
2. 클라이언트 ID 유효성 확인
3. Network 탭에서 API 응답 상태 코드 확인

---

## 📈 성능 최적화

### 이미지 최적화

```typescript
import Image from 'next/image';

// ✅ Next.js Image 최적화
<Image src="/map.png" alt="Map" width={800} height={600} />

// ❌ 일반 img 태그
<img src="/map.png" alt="Map" />
```

### 코드 분할 (Code Splitting)

```typescript
import dynamic from 'next/dynamic';

// ✅ 동적 로드
const NaverMap = dynamic(() => import('@/app/NaverMap'), {
  loading: () => <Spinner />
});

// 사용
export default function Home() {
  return <NaverMap clientId="..." />;
}
```

### API 캐싱

```typescript
// 같은 요청 결과 캐싱
export async function computeIsochroneBMAD(
  center: Center,
  timeMinutes: number,
  mode: string
) {
  // 캐시 키 생성
  const cacheKey = `${center.lat}_${center.lng}_${timeMinutes}_${mode}`;
  
  // 캐시 확인
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  // 계산 후 캐시 저장
  const result = /* ... */;
  cache.set(cacheKey, result);
  return result;
}
```

---

## 🔄 지속적 배포 (CI/CD)

### GitHub Actions (자동 배포)

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 배포 규칙

| 브랜치 | 동작 | 환경 |
|--------|------|------|
| `main` | 자동 배포 | 프로덕션 |
| `develop` | 자동 배포 | 스테이징 |
| 기타 | PR Preview | 임시 |

---

## 📝 버전 관리

### 시맨틱 버전 (Semantic Versioning)

**형식:** `MAJOR.MINOR.PATCH`
- `MAJOR`: 하위 호환성 없는 변경
- `MINOR`: 하위 호환성 있는 기능 추가
- `PATCH`: 버그 수정

**예시:**
```
v1.0.0  → v1.1.0  (기능 추가)
v1.1.0  → v1.1.1  (버그 수정)
v1.1.1  → v2.0.0  (주요 변경)
```

### 버전 태그 생성

```bash
# 태그 생성
git tag -a v1.0.0 -m "Release version 1.0.0"

# 푸시
git push origin v1.0.0

# 모든 태그 푸시
git push origin --tags
```

---

## 🆘 지원

**배포 문제 발생 시:**

1. [Vercel 문서](https://vercel.com/docs)
2. [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
3. 팀 채널 또는 이슈 트래커

---

## 📚 관련 문서

- [개발 가이드](./development-guide.md)
- [아키텍처 – 백엔드](./architecture-backend.md)
- [API 계약](./api-contracts.md)

---

**마지막 업데이트:** 2025-12-11
