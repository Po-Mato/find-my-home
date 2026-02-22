# E2E (Playwright)

## 실행

```bash
pnpm test:e2e
```

## UI 모드

```bash
pnpm test:e2e:ui
```

## 참고
- `playwright.config.ts`에서 dev 서버를 자동 실행/재사용합니다.
- API E2E는 `/api/isochrone`의 기본 응답 형식을 검증합니다.
