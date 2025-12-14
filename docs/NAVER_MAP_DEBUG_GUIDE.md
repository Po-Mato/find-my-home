# 네이버 지도 디버깅 가이드

**작성일**: 2025년 12월 7일  
**목적**: 브라우저 콘솔에서 네이버 지도 로드 및 API 호출 과정 추적

---

## 🎯 콘솔 로그 확인 방법

### 1️⃣ Chrome DevTools 열기
```
macOS: Cmd + Option + J
Windows: Ctrl + Shift + J
```

### 2️⃣ 콘솔 탭 선택
DevTools > **Console** 탭 클릭

### 3️⃣ 로그 메시지 확인
페이지 새로고침 후 아래 순서대로 메시지가 나타나는지 확인:

---

## 📋 예상되는 콘솔 로그 순서

### Phase 1: NaverMap 초기화
```
✅ [NaverMap] 초기화 시작 — clientId: ual7****ij
📥 [NaverMap] 스크립트 로드 URL: https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=ual79sk3ij&callback=initNaverMap
📥 [NaverMap] naver.maps 스크립트 동적 로드 시작...
```

### Phase 2: API 스크립트 로드 (콜백)
```
🔔 [NaverMap] initNaverMap 콜백 호출됨 — naver.maps API 로드 완료
✅ [NaverMap] naver.maps 감지됨 — 지도 인스턴스 생성 중...
✅ [NaverMap] 지도 인스턴스 생성 완료
✅ [NaverMap] 지도 인스턴스 설정 완료 — Isochrone 그리기 시작
```

### Phase 3: Isochrone 계산 (기본값 또는 사용자 입력)
```
📍 [NaverMap.drawIsochrone] 호출됨 — 파라미터: {center: {...}, time: 15, mode: "walking"}
🔄 [NaverMap.drawIsochrone] API 호출 시작...
📡 [NaverMap.drawIsochrone] API 응답 상태: 200
✅ [NaverMap.drawIsochrone] GeoJSON 수신: {...}
📍 [NaverMap.drawIsochrone] 폴리곤 좌표 개수: 64
🎨 [NaverMap.drawIsochrone] 폴리곤 색상: {fill: '#ff7f50', ...} 이동수단: walking
✅ [NaverMap.drawIsochrone] 폴리곤 생성 완료
⏹️ [NaverMap.drawIsochrone] 완료
```

---

## ⚠️ 문제 진단

### 문제 1: "⚠️ [NaverMap] clientId가 없습니다."
**원인**: 환경 변수 미설정

**해결책**:
```bash
# .env.local 확인
cat /Users/sjlee/develop/find-my-home/.env.local

# NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 있는지 확인
grep NEXT_PUBLIC_NAVER_MAP_CLIENT_ID .env.local
```

**필요한 설정**:
```
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=ual79sk3ij
```

---

### 문제 2: "⚠️ [NaverMap] naver.maps API가 아직 로드되지 않았습니다."
**원인**: 스크립트 로드 지연 또는 CORS 오류

**확인 사항**:
1. Network 탭에서 maps.js 요청 상태 확인
2. Status가 200이 아닌 경우: CORS 오류 또는 네트워크 문제
3. 20회 이상 반복되면: 스크립트 로드 실패

**해결책**:
```bash
# 콘솔에서 실행
curl -I "https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=ual79sk3ij&callback=initNaverMap"

# 상태가 200이면 정상
```

---

### 문제 3: "❌ [NaverMap] 스크립트 로드 실패"
**원인**: 네이버 API 서버 연결 불가 또는 잘못된 클라이언트 ID

**해결책**:
1. 클라이언트 ID 재확인
2. 인터넷 연결 확인
3. VPN 사용 중이면 비활성화

---

### 문제 4: "❌ [NaverMap.drawIsochrone] 네트워크 또는 API 오류"
**원인**: 서버 API 호출 실패

**확인 사항**:
1. `/api/isochrone` 엔드포인트 상태 확인
2. Network 탭에서 POST 요청 상태 확인
3. 응답 JSON 확인

**테스트**:
```bash
curl -X POST http://localhost:3000/api/isochrone \
  -H "Content-Type: application/json" \
  -d '{"center":{"lat":37.5665,"lng":126.9784},"time":15,"mode":"walking"}' | jq
```

---

### 문제 5: 폴리곤이 지도에 표시되지 않음
**확인 사항**:
1. "✅ [NaverMap.drawIsochrone] 폴리곤 생성 완료" 메시지 있는지 확인
2. 폴리곤 색상이 지도 배경색과 같지 않은지 확인
3. 좌표가 유효한지 확인

**Console에서 테스트**:
```javascript
// 현재 폴리곤 확인
window.mapInstance  // map 객체
window.polygonRef   // polygon 객체
```

---

## 📊 디버깅 체크리스트

```
☐ clientId 환경 변수 설정 확인
☐ 스크립트 로드 완료 확인 (Phase 1-2)
☐ 지도 인스턴스 생성 확인
☐ API 호출 응답 상태 200 확인 (Phase 3)
☐ GeoJSON 데이터 수신 확인
☐ 폴리곤 생성 완료 확인
☐ 지도에서 폴리곤 시각화 확인
```

---

## 🔍 Chrome DevTools 활용 팁

### Network 탭
1. **Fetch/XHR** 필터로 API 요청만 표시
2. `/api/isochrone` POST 요청 확인
3. Response 탭에서 GeoJSON 데이터 확인

### Console 필터
```
// 특정 메시지만 필터링
[NaverMap]      # NaverMap 관련
[drawIsochrone] # Isochrone 관련
❌              # 에러만
```

### 수동 테스트
```javascript
// 콘솔에서 직접 실행
console.log('naver.maps 존재:', !!window.naver?.maps);
console.log('clientId:', 'ual79sk3ij');
```

---

## 📸 스크린샷 수집 방법

문제 발생 시 다음 정보를 캡처:

1. **Console 탭 전체** (Cmd+A → Cmd+C로 복사)
2. **Network 탭** (maps.js 요청)
3. **Network 탭** (/api/isochrone 요청)
4. **Elements 탭** (naver-maps-js script 태그 확인)

---

## 🚀 Quick Test Commands

### 서버 상태 확인
```bash
curl -s http://localhost:3000 | grep -o "<title>.*</title>"
# 출력: <title>Create Next App</title>
```

### API 엔드포인트 테스트
```bash
curl -X POST http://localhost:3000/api/isochrone \
  -H "Content-Type: application/json" \
  -d '{"center":{"lat":37.5665,"lng":126.9784},"time":15,"mode":"walking"}' | jq '.properties'
```

### 지도 페이지 열기
```
http://localhost:3000
```

---

## 📞 추가 정보

**현재 설정**:
- clientId: `ual79sk3ij` (마스킹됨: `ual7****ij`)
- API 엔드포인트: `https://openapi.map.naver.com/openapi/v3/maps.js`
- 서버: http://localhost:3000
- 콘솔 로그 레벨: INFO, WARN, ERROR

**로그 포맷**:
- ✅ = 성공
- ⚠️ = 경고
- ❌ = 오류
- 📍📥🔔🔄📡🎨 = 프로세스 진행 상황

---

**가이드 완료** ✅  
콘솔에서 위 메시지들이 정상적으로 나타나면 지도가 정상 작동하고 있습니다.
