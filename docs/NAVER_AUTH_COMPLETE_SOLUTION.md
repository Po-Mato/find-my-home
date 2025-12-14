# 네이버 지도 인증 오류 완전 해결 가이드

**문제**: 네이버 지도 Open API 인증이 실패 (Authentication Failed)  
**원인**: NCP 콘솔에서 로컬 개발 도메인 미등록  
**해결 시간**: 약 5분

---

## 🎯 해결 방법 (3단계)

### 1️⃣ NCP 콘솔에서 도메인 추가 (5분)

**URL**: https://console.ncloud.com

**경로**: 
```
좌측 메뉴 
→ Application Services 
→ Maps 
→ Application 선택 
→ [수정] 클릭
```

**추가할 URL** (3개):
```
http://localhost:3000
http://localhost:3000/
http://127.0.0.1:3000
```

**저장**: [저장] 버튼 클릭

---

### 2️⃣ 로컬 캐시 삭제 (1분)

```bash
# 개발 서버 종료
pkill -f "pnpm dev"

# .next 캐시 삭제 (중요!)
rm -rf /Users/sjlee/develop/find-my-home/.next

# 서버 재시작
cd /Users/sjlee/develop/find-my-home
pnpm dev
```

---

### 3️⃣ 브라우저 새로고침 (1분)

```
1. http://localhost:3000 열기
2. Cmd + Shift + R 누르기 (강제 새로고침)
3. Chrome DevTools Console 열기 (Cmd + Option + J)
4. 아래 메시지 확인:
   ✅ [NaverMap] 초기화 시작
   🔔 [NaverMap] initNaverMap 콜백 호출됨
   ✅ [NaverMap] 지도 인스턴스 생성 완료
```

---

## ✅ 확인 사항

### 인증 오류 메시지가 사라졌는가?

**이전 (❌ 오류)**:
```
네이버 지도 Open API 인증이 실패하였습니다.
Error Code / Error Message: 200 / Authentication Failed
Client ID: ual79sk3ij
URI: http://localhost:3000/
```

**이후 (✅ 정상)**:
```
✅ [NaverMap] 초기화 시작 — clientId: ual7****ij
🔔 [NaverMap] initNaverMap 콜백 호출됨
✅ [NaverMap] 지도 인스턴스 생성 완료
```

---

## 📋 문제 해결 체크리스트

```
Step 1: NCP 콘솔
☐ https://console.ncloud.com 로그인
☐ Application Services → Maps 메뉴
☐ Application 상세 페이지 진입 (클릭)
☐ [수정] 버튼 클릭
☐ 웹 서비스 URL 섹션 찾기
☐ 다음 3개 URL 추가:
  ☐ http://localhost:3000
  ☐ http://localhost:3000/
  ☐ http://127.0.0.1:3000
☐ [저장] 클릭
☐ "정상적으로 수정되었습니다" 메시지 확인

Step 2: 로컬 캐시 삭제
☐ 개발 서버 종료 (pkill -f "pnpm dev")
☐ .next 폴더 삭제 (rm -rf .next)
☐ 개발 서버 재시작 (pnpm dev)

Step 3: 브라우저 확인
☐ http://localhost:3000 열기
☐ Cmd + Shift + R (강제 새로고침)
☐ Chrome DevTools 열기 (Cmd + Option + J)
☐ Console 탭에서 ✅ 메시지 확인
```

---

## 🔍 원인 분석

### 네이버 Open API 인증 메커니즘

**요청 흐름**:
```
1. 브라우저에서 maps.js 스크립트 로드
2. 요청 출처 (Origin): http://localhost:3000/
3. 네이버 서버에서 인증 확인
4. NCP 콘솔의 "웹 서비스 URL" 화이트리스트와 비교
5. 일치 → 인증 성공 ✅
   불일치 → 인증 실패 ❌
```

**현재 상황**:
```
요청 출처:       http://localhost:3000/
등록된 도메인:   ??? (비어있거나 다른 도메인만 등록)
결과:            불일치 → 인증 실패 ❌
```

**해결 후**:
```
요청 출처:       http://localhost:3000/
등록된 도메인:   http://localhost:3000, http://localhost:3000/, http://127.0.0.1:3000
결과:            일치 → 인증 성공 ✅
```

---

## 🎓 참고: 프로덕션 배포 시

### Vercel에 배포할 때

**Vercel 배포 URL 예시**:
```
https://find-my-home.vercel.app
```

**추가해야 할 URL**:
```
NCP 콘솔 > 웹 서비스 URL에 추가:
https://find-my-home.vercel.app
```

### 커스텀 도메인 사용 시

**예**: `https://findmyhome.com`

**추가해야 할 URL**:
```
NCP 콘솔 > 웹 서비스 URL에 추가:
https://findmyhome.com
https://www.findmyhome.com (www 포함)
```

---

## 📚 참고 문서

| 문서 | 용도 |
|------|------|
| `docs/NCP_CONSOLE_SETUP_GUIDE.md` | NCP 콘솔 단계별 가이드 (스크린샷 설명) |
| `docs/NAVER_AUTH_ERROR_FIX.md` | 인증 오류 해결 방법 |
| `docs/NAVER_API_FINAL_VALIDATION.md` | API 적용 검증 |

---

## 🚀 다음 단계

**인증 오류 해결 후**:

1. ✅ 지도가 정상 표시되는지 확인
2. ✅ 검색 폼에서 좌표/시간 입력 후 폴리곤 표시 확인
3. ✅ Chrome DevTools에서 콘솔 로그 메시지 확인

**이후 진행**:
- [ ] 알고리즘 개선 (샘플링 + 길찾기 API)
- [ ] UX 개선 (마커 드래그, 주소 검색)
- [ ] Vercel 배포
- [ ] 성능 최적화 (캐싱, 속도 개선)

---

## ✨ 예상 결과

### 인증 성공 후 화면

```
┌─────────────────────────────────────┐
│  🗺️ Find My Home                   │
├─────────────────────────────────────┤
│  좌측: 검색 폼                      │
│  우측: 네이버 지도 + 폴리곤        │
│                                     │
│  ✅ 지도 정상 표시                 │
│  ✅ 폴리곤 렌더링                  │
│  ✅ 콘솔 오류 없음                 │
└─────────────────────────────────────┘
```

### Chrome DevTools 콘솔

```
✅ [NaverMap] 초기화 시작 — clientId: ual7****ij
📥 [NaverMap] 스크립트 로드 URL: https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=ual79sk3ij&callback=initNaverMap
📥 [NaverMap] naver.maps 스크립트 동적 로드 시작...
🔔 [NaverMap] initNaverMap 콜백 호출됨 — naver.maps API 로드 완료
✅ [NaverMap] naver.maps 감지됨 — 지도 인스턴스 생성 중...
✅ [NaverMap] 지도 인스턴스 생성 완료
✅ [NaverMap] 지도 인스턴스 설정 완료 — Isochrone 그리기 시작
📍 [NaverMap.drawIsochrone] 호출됨 — 파라미터: {...}
🔄 [NaverMap.drawIsochrone] API 호출 시작...
📡 [NaverMap.drawIsochrone] API 응답 상태: 200
✅ [NaverMap.drawIsochrone] GeoJSON 수신
📍 [NaverMap.drawIsochrone] 폴리곤 좌표 개수: 64
🎨 [NaverMap.drawIsochrone] 폴리곤 색상: {...}
✅ [NaverMap.drawIsochrone] 폴리곤 생성 완료
```

---

**문제 해결 완료!** ✅

이제 로컬 개발 환경에서 네이버 지도가 정상 작동합니다.
