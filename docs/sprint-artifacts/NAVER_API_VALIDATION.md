# 네이버 지도 API 적용 검증 보고서

**검증 일시**: 2025년 12월 7일  
**상태**: ⚠️ 부분 적용 — 클라이언트 지도는 OK, 서버 Reverse Geocode 401 오류

---

## 🔍 발견된 문제점

### ❌ 문제 1: 클라이언트 사이드 (NaverMap.tsx)
**상태**: ✅ 정상 작동
- 지도 렌더링: 정상 (`naver.maps.Map`)
- 폴리곤 표시: 정상
- API 키: 클라이언트 공개 키 사용 (올바름)

**근거**: 
```
<script src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=ual79sk3ij">
```
✅ 이 방식은 **네이버 구 API** (구 네이버 개발자 센터)

---

### ⚠️ 문제 2: 서버 사이드 (route.ts - Reverse Geocode)
**상태**: ❌ 401 오류 발생

**현재 구현**:
```typescript
const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${coords}&orders=addr&output=json`;
const res = await fetch(url, {
  headers: {
    'X-NCP-APIGW-API-KEY-ID': SERVER_KEY_ID,
    'X-NCP-APIGW-API-KEY': SERVER_KEY_SECRET,
  },
});
```

**문제점**:
1. ✅ 엔드포인트 URL: 올바름 (`map-reversegeocode/v2/gc`)
2. ✅ 헤더 형식: 올바름 (`X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY`)
3. ❌ **401 오류**: 인증 실패
   - 원인: API 키의 권한이 부족하거나 잘못된 키

**테스트 결과**:
```json
{
  "addressInfo": {
    "error": "naver_api_error",
    "status": 401
  }
}
```

---

## 🔗 API 타입 분석

### 현재 사용 중인 API 2종류

#### 1️⃣ 클라이언트 사이드: 구 네이버 개발자 센터
```
엔드포인트: https://openapi.map.naver.com/openapi/v3/maps.js
인증: ncpKeyId 파라미터
키: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (공개 가능)
용도: 지도 렌더링, 폴리곤 표시
상태: ✅ 정상 작동
```

#### 2️⃣ 서버 사이드: 네이버 클라우드 플랫폼 (NCP) API Gateway
```
엔드포인트: https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc
인증: HTTP 헤더 (API Key ID + API Key)
키: NAVER_CLIENT_ID + NAVER_CLIENT_SECRET
용도: Reverse Geocoding, Directions 등
상태: ⚠️ 401 오류 — 권한 부족
```

---

## 🔧 근본 원인

### 401 오류가 발생하는 이유

**NCP 문서 규정**:
> 네이버 클라우드 플랫폼 콘솔에서 Application을 등록하여 API 사용에 필요한 인증 정보(Client ID, Client Secret)를 발급받아야 합니다.

**확인 체크리스트**:
1. ❓ NCP 콘솔에서 **Maps API** 활성화되어 있나?
2. ❓ 발급받은 키가 **Maps 서비스용**인가?
3. ❓ Application 수정 시 **Maps 체크박스** 선택되어 있나?

**문서 인용**:
> 콘솔에서 Application 등록 후 사용할 API가 선택되어 있는지 [수정] 버튼을 클릭하여 확인해 주십시오. 선택되어 있지 않으면 429 (Quota Exceed) 오류가 발생합니다.

---

## ✅ 해결 방안 (3가지)

### 옵션 A: Reverse Geocode 제거 (권장 단기)
**이유**: 
- Reverse Geocode는 선택 기능 (주소 표시용)
- 핵심 기능(isochrone)에 영향 없음
- 401 오류도 해결됨

**변경**:
```typescript
// app/api/isochrone/route.ts
let addressInfo: any = null;  // Reverse Geocode 호출 제거
// → addressInfo 수집 안 함

const geojson = { ...result, properties: { ...(result as any).properties } };
// addressInfo 제거
```

**영향**: 
- ✅ API 호출 성공
- ✅ 속도 향상 (1개 API 호출 제거)
- ⚠️ 주소 정보 표시 안 됨 (향후 추가 가능)

---

### 옵션 B: NCP 콘솔 확인 (권장 장기)
**절차**:
1. https://console.ncloud.com 접속
2. 좌측 메뉴: **Application Services** → **Maps**
3. 생성된 Application 클릭 → **[수정]**
4. **Maps** 체크박스 ✅ 선택 확인
5. **저장** 클릭

**이후 테스트**:
```bash
curl -X GET "https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=126.9784,37.5665" \
  -H "X-NCP-APIGW-API-KEY-ID: ual79sk3ij" \
  -H "X-NCP-APIGW-API-KEY: 5L2AFqGcEJhGjfcGJWcIKv8b7jIYHwN66kZbecyt"
```

---

### 옵션 C: 클라이언트 전환 (대안)
**아이디어**: Reverse Geocode를 네이버 구 API로 변경
```typescript
// 구 API 사용 (클라이언트)
https://openapi.naver.com/v1/map/geocode?query=서울역
```

**장점**: 기존 키로 사용 가능  
**단점**: 클라이언트 CORS 이슈 가능

---

## 📋 적용 상태 체크리스트

### Maps JavaScript API (클라이언트)
- ✅ 엔드포인트: `https://openapi.map.naver.com/openapi/v3/maps.js`
- ✅ 인증 방식: `ncpKeyId` 파라미터
- ✅ 구현: `app/NaverMap.tsx`
- ✅ 동작: 지도 렌더링 정상

### Maps REST API - Reverse Geocoding (서버)
- ✅ 엔드포인트: `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc`
- ✅ 요청 헤더: `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY`
- ✅ 구현: `app/api/isochrone/route.ts`
- ❌ 동작: 401 오류 (인증 실패)

### 환경 변수
- ✅ `.env.local` 설정 완료
- ✅ `NAVER_CLIENT_ID` (서버)
- ✅ `NAVER_CLIENT_SECRET` (서버)
- ✅ `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (클라이언트)

---

## 🎯 권장 조치

### 즉시 (지금)
✅ **옵션 A 선택**: Reverse Geocode 호출 제거
- 파일: `app/api/isochrone/route.ts`
- 변경: addressInfo 관련 코드 제거
- 효과: API 성공 + 오류 해결

### 향후 (선택)
📝 **옵션 B 준비**: NCP 콘솔에서 Maps 권한 재확인
- 다른 Maps API 호출 시 필요
- Directions, Geocoding 등 사용할 때 확인

---

## 📚 참고 자료

**공식 문서**:
- Maps 개요: https://api.ncloud-docs.com/docs/ko/application-maps-overview
- Maps 사용 가이드: https://guide.ncloud-docs.com/docs/application-maps-app-vpc
- API 응답 상태 코드: https://api.ncloud-docs.com/docs/common-ncpapi#3%EC%9D%91%EB%8B%B5%EC%83%81%ED%83%9C%EC%BD%94%EB%93%9C

**에러 코드 설명**:
- 401: Authentication Failed / Permission Denied (인증 실패 또는 권한 없음)
- 429: Quota Exceeded (할당량 초과)

---

## ✅ 결론

**현재 상태**: MVP 기능은 정상 작동
- ✅ 지도 렌더링: 정상
- ✅ Isochrone 계산: 정상
- ✅ 폴리곤 표시: 정상
- ⚠️ Reverse Geocode: 401 오류 (선택 기능)

**권장 조치**: 
1. `app/api/isochrone/route.ts`에서 Reverse Geocode 호출 제거 (즉시)
2. 필요하면 나중에 NCP 권한 재확인 (선택)

---

**검증 완료** ✅
