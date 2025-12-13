# 네이버 지도 인증 오류 해결 가이드

**오류 메시지**:
```
네이버 지도 Open API 인증이 실패하였습니다. 클라이언트 아이디와 웹 서비스 URL을 확인해 주세요.
Error Code / Error Message: 200 / Authentication Failed
Client ID: ual79sk3ij
URI: http://localhost:8080/
```

**문제**: ✅ Client ID는 정상 → ❌ **도메인/URI 허용 설정 부족**

---

## 🔍 근본 원인 분석

### 네이버 API Gateway 인증 규칙

네이버 클라우드 플랫폼(NCP)은 Application 등록 시 **접근 가능한 도메인**을 화이트리스트로 관리합니다.

**현재 상황**:
```
등록된 도메인:  ???
요청 출처:      http://localhost:8080/
결과:           일치 ❌ → 인증 실패
```

---

## ✅ 해결 방법

### Step 1: NCP 콘솔 접속
```
https://console.ncloud.com
```

### Step 2: Maps Application 확인
1. 좌측 메뉴: **Application Services** → **Maps**
2. 생성된 Application 이름 클릭
3. **Application 정보** 탭

### Step 3: 웹 서비스 URL 추가
**현재 상황**:
- "웹 서비스 URL"에 `http://localhost:8080` 이 없을 가능성

**필요한 URL들**:
```
개발 환경:
- http://localhost:8080
- http://localhost:8080/
- http://127.0.0.1:8080

프로덕션:
- https://yourdomain.com (Vercel 배포 시)
```

### Step 4: URL 등록하기
1. **[수정]** 버튼 클릭
2. **웹 서비스 URL** 섹션 찾기
3. 아래 URL들을 모두 추가:
   ```
   http://localhost:8080
   http://localhost:8080/
   http://127.0.0.1:8080
   ```
4. **저장** 클릭

### Step 5: 캐시 초기화 (중요!)
```bash
# 1. 개발 서버 종료
pkill -f "pnpm dev"

# 2. .next 폴더 삭제 (캐시 제거)
rm -rf /Users/sjlee/develop/find-my-home/.next

# 3. 개발 서버 재시작
cd /Users/sjlee/develop/find-my-home
pnpm dev
```

### Step 6: 페이지 새로고침
```
Ctrl + Shift + R (강제 새로고침)
또는
개발자 도구 > Network 탭 > "Disable cache" 체크
```

---

## 📋 확인 체크리스트

- [ ] NCP 콘솔 로그인
- [ ] Maps Application 찾기
- [ ] **웹 서비스 URL** 섹션 확인
  - [ ] `http://localhost:8080` 있는지 확인
  - [ ] 없으면 추가
- [ ] **저장** 클릭
- [ ] 개발 서버 재시작
- [ ] 페이지 강제 새로고침 (Ctrl+Shift+R)

---

## 🧪 테스트 방법

### 콘솔에서 확인
```javascript
// Chrome DevTools Console에서 실행
console.log(window.naver?.maps ? '✅ 지도 API 로드됨' : '❌ 로드 실패');
```

### 예상 결과
```
페이지 로드 후 콘솔에 아래 메시지가 나타나야 함:
✅ [NaverMap] 초기화 시작 — clientId: ual7****ij
📥 [NaverMap] 스크립트 로드 URL: https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=ual79sk3ij&callback=initNaverMap
📥 [NaverMap] naver.maps 스크립트 동적 로드 시작...
🔔 [NaverMap] initNaverMap 콜백 호출됨 — naver.maps API 로드 완료
✅ [NaverMap] naver.maps 감지됨 — 지도 인스턴스 생성 중...
```

**인증 오류가 사라져야 합니다!** ✅

---

## 🎯 추가 팁

### 만약 여전히 오류가 나면

#### 1. Application 설정 재확인
```
NCP 콘솔 > Maps > Application 수정
☐ Client ID: ual79sk3ij (확인)
☐ Maps 서비스: 활성화 ✅
☐ 웹 서비스 URL: http://localhost:8080 추가 (필수!)
☐ API Gateway 키: 설정 완료
```

#### 2. 브라우저 캐시 완전 초기화
```bash
# macOS
rm -rf ~/Library/Caches/Google/Chrome
# 또는 Chrome 설정 > 개인정보 > 검색 데이터 삭제
```

#### 3. 다른 포트로 테스트
```bash
# 기본 포트(8080) 대신 다른 포트 사용
pnpm dev -- -p 3001
```

만약 3001에서 인증 성공하면:
- NCP 콘솔에 `http://localhost:3001` 도 추가

#### 4. VPN 비활성화
- VPN 사용 중이면 비활성화 후 재시도

---

## 📞 참고

**현재 설정**:
- Client ID: `ual79sk3ij` ✅
- Application: Maps ✅
- 웹 서비스 URL: **❌ 미설정 (추측)**

**필요한 조치**:
1. NCP 콘솔에서 웹 서비스 URL 추가
2. 개발 서버 재시작 + 캐시 삭제
3. 브라우저 강제 새로고침

---

**해결 방법 완료** ✅

이 방법으로 대부분의 인증 오류가 해결됩니다!
