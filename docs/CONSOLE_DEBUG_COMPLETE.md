# 네이버 지도 디버깅 - 콘솔 로그 추가 완료 ✅

**완료일**: 2025년 12월 7일 14:45 KST  
**상태**: 🟢 콘솔 로그 추적 기능 완료

---

## ✨ 추가된 기능

### 1. 상세한 콘솔 로깅
**파일**: `app/NaverMap.tsx`

- ✅ 초기화 단계 로그 (clientId 확인)
- ✅ 스크립트 로드 단계 로그 (URL, 진행 상황)
- ✅ 지도 생성 단계 로그 (인스턴스 생성, 시도 횟수)
- ✅ API 호출 단계 로그 (요청, 응답, 상태 코드)
- ✅ 폴리곤 생성 단계 로그 (좌표 수, 색상, 완료)
- ✅ Cleanup 단계 로그 (언마운트)

### 2. 이모지 기반 시각적 구분
```
✅ = 성공 (진행)
⚠️ = 경고 (대기/확인 필요)
❌ = 오류 (실패/대응 필요)
📍 = 프로세스 시작
🔔 = 콜백/이벤트
🔄 = 진행 중
📡 = 데이터 수신
🎨 = 스타일 적용
🗑️ = 정리/삭제
🧹 = 최종 정리
```

### 3. 상세 파라미터 로깅
- clientId (마스킹됨)
- API URL
- 시도 횟수
- 파라미터 (center, time, mode)
- 응답 상태 (HTTP 코드)
- 폴리곤 정보 (좌표 수, 색상)

---

## 🎯 사용 방법

### Step 1: 개발 서버 시작
```bash
cd /Users/sjlee/develop/find-my-home
pnpm dev
```

### Step 2: 브라우저 열기
```
http://localhost:3000
```

### Step 3: Chrome DevTools 열기
```
macOS: Cmd + Option + J
```

### Step 4: Console 탭 확인
- 페이지 새로고침 후 로그 확인
- 로그 메시지 순서대로 진행되는지 확인

### Step 5: 검색 폼 사용
- 좌측 폼에서 좌표, 시간, 이동수단 입력
- 검색 버튼 클릭
- 콘솔에서 drawIsochrone 로그 확인

---

## 📋 예상 콘솔 출력

### 페이지 로드 시
```
✅ [NaverMap] 초기화 시작 — clientId: ual7****ij
📥 [NaverMap] 스크립트 로드 URL: https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=ual79sk3ij&callback=initNaverMap
📥 [NaverMap] naver.maps 스크립트 동적 로드 시작...
🔔 [NaverMap] initNaverMap 콜백 호출됨 — naver.maps API 로드 완료
✅ [NaverMap] naver.maps 감지됨 — 지도 인스턴스 생성 중...
✅ [NaverMap] 지도 인스턴스 생성 완료
✅ [NaverMap] 지도 인스턴스 설정 완료 — Isochrone 그리기 시작
📍 [NaverMap.drawIsochrone] 호출됨 — 파라미터: {center: {lat: 37.5665, lng: 126.978}, time: 15, mode: "walking"}
🔄 [NaverMap.drawIsochrone] API 호출 시작...
📡 [NaverMap.drawIsochrone] API 응답 상태: 200
✅ [NaverMap.drawIsochrone] GeoJSON 수신: {type: "Feature", geometry: {...}, properties: {...}}
📍 [NaverMap.drawIsochrone] 폴리곤 좌표 개수: 64
🎨 [NaverMap.drawIsochrone] 폴리곤 색상: {fill: '#ff7f50', stroke: '#ff4500'} 이동수단: walking
✅ [NaverMap.drawIsochrone] 폴리곤 생성 완료
⏹️ [NaverMap.drawIsochrone] 완료
```

### 검색 폼 사용 시 (예: 차량 모드 20분)
```
📍 [NaverMap.drawIsochrone] 호출됨 — 파라미터: {center: {lat: 37.5665, lng: 126.9784}, time: 20, mode: "driving"}
🗑️ [NaverMap.drawIsochrone] 기존 폴리곤 제거
🔄 [NaverMap.drawIsochrone] API 호출 시작...
📡 [NaverMap.drawIsochrone] API 응답 상태: 200
✅ [NaverMap.drawIsochrone] GeoJSON 수신: {...}
📍 [NaverMap.drawIsochrone] 폴리곤 좌표 개수: 64
🎨 [NaverMap.drawIsochrone] 폴리곤 색상: {fill: '#1e90ff', stroke: '#00008b'} 이동수단: driving
✅ [NaverMap.drawIsochrone] 폴리곤 생성 완료
⏹️ [NaverMap.drawIsochrone] 완료
```

---

## 🔍 문제 진단 시 확인 사항

### ❌ 로그 1단계에서 멈춤
**원인**: 환경 변수 미설정
```
⚠️ [NaverMap] clientId가 없습니다.
```
**해결**: `.env.local` 확인
```bash
grep NEXT_PUBLIC_NAVER_MAP_CLIENT_ID .env.local
```

### ❌ 로그 3단계 도중 멈춤
**원인**: 스크립트 로드 실패
```
❌ [NaverMap] 스크립트 로드 실패
⚠️ [NaverMap] naver.maps API가 아직 로드되지 않았습니다.
```
**확인**: Network 탭에서 maps.js 요청 확인
- Status 200 아닌가?
- CORS 오류?
- 네트워크 연결?

### ❌ 로그 5단계 도중 멈춤
**원인**: API 호출 실패
```
❌ [NaverMap.drawIsochrone] 네트워크 또는 API 오류
```
**테스트**:
```bash
curl -X POST http://localhost:3000/api/isochrone \
  -H "Content-Type: application/json" \
  -d '{"center":{"lat":37.5665,"lng":126.9784},"time":15,"mode":"walking"}' | jq
```

### ❌ 폴리곤이 보이지 않음
**원인**: 색상 또는 좌표 문제
**확인**:
1. 🎨 로그의 색상 확인
2. 📍 로그의 좌표 개수 확인 (64개여야 함)
3. 지도 줌 레벨 확인

---

## 📚 참고 문서

| 문서 | 용도 |
|------|------|
| `docs/NAVER_MAP_DEBUG_GUIDE.md` | 콘솔 메시지 해석 + 문제 진단 |
| `docs/CONSOLE_LOGS_REFERENCE.md` | 콘솔 로그 전체 목록 |
| `docs/sprint-artifacts/NAVER_API_FINAL_VALIDATION.md` | API 적용 검증 결과 |

---

## 🛠️ 개발 팁

### 특정 로그만 필터링
Chrome DevTools Console에서:
```
Filter: [NaverMap]     // NaverMap 관련만
Filter: drawIsochrone   // Isochrone 관련만
Filter: ❌             // 에러만
```

### 콘솔 메시지 복사
```javascript
// 1. 콘솔 우클릭
// 2. "Save as..." 선택
// 또는
// 1. Cmd + A (모든 로그 선택)
// 2. Cmd + C (복사)
```

### 수동 테스트 (콘솔에서)
```javascript
// naver.maps 로드 상태 확인
console.log(window.naver?.maps ? '✅ 로드됨' : '❌ 미로드');

// 현재 지도 인스턴스 확인
console.log('Map:', window.mapInstance);

// 폴리곤 정보 확인
console.log('Polygon:', window.polygonRef?.current);
```

---

## ✅ 완료 체크리스트

- ✅ 콘솔 로그 추가 (20+ 메시지)
- ✅ 이모지 기반 구분
- ✅ 단계별 추적 가능
- ✅ 디버깅 가이드 작성
- ✅ 콘솔 로그 레퍼런스 작성
- ✅ 문제 진단 가능

---

## 🎯 다음 단계

### 지금 할 수 있는 것
1. 로컬에서 페이지 열기
2. Chrome DevTools Console 열기
3. 로그 메시지 확인
4. 검색 폼 사용 후 로그 확인

### 향후 개선
- [ ] 로그 레벨 필터링 (DEBUG/INFO/WARN/ERROR)
- [ ] 성능 측정 로그
- [ ] 네트워크 타이밍 로그
- [ ] 로컬 스토리지에 로그 저장

---

**콘솔 로그 추가 완료** ✅

이제 브라우저 개발자 도구에서 실시간으로 다음을 확인할 수 있습니다:
- 네이버 지도 API 스크립트 로드 과정
- 지도 인스턴스 생성 과정  
- Isochrone API 호출 및 응답
- 폴리곤 생성 및 렌더링

**문제 발생 시 콘솔 로그를 첫 번째로 확인하세요!** 🔍
