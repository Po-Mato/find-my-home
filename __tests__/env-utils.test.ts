// __tests__/env-utils.test.ts
import { getNaverClientId } from "@/lib/env-utils";

// Mock process.env before running tests
const originalEnv = process.env;

describe('Environment Utility Tests (env-utils)', () => {
  beforeEach(() => {
    // Clear environment variables for each test
    process.env = { ...originalEnv };
    // Ensure the mock is clean before running
    delete process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  });

  afterEach(() => {
    // Restore the original environment variables
    process.env = originalEnv;
  });

  test('1. Should return the Client ID when NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is set', () => {
    const mockClientId = "MOCK_PUBLIC_CLIENT_ID_12345";
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID = mockClientId;

    const result = getNaverClientId();
    
    // Assertion (Step 5: Verification)
    expect(result).toBe(mockClientId);
  });

  test('2. Should throw an error when NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is not set', () => {
    // Variable is already deleted in beforeEach setup

    // Assertion (Step 5: Verification)
    expect(() => getNaverClientId()).toThrow(
      "Naver Map Client ID (NEXT_PUBLIC_NAVER_MAP_CLIENT_ID) is missing. Please check your .env.local file."
    );
  });
});
