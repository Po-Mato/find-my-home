// lib/env-utils.ts
// Next.js 환경 변수 (클라이언트에서 안전하게 접근 가능한 변수)
const getNaverClientId = (): string => {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  
  if (!clientId) {
    // README 경고에 따라 명확한 오류 메시지 제공
    throw new Error("Naver Map Client ID (NEXT_PUBLIC_NAVER_MAP_CLIENT_ID) is missing. Please check your .env.local file.");
  }
  return clientId;
};

export { getNaverClientId };
