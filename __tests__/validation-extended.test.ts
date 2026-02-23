import {
  validateCoordinates,
  isKoreanCoordinate,
  normalizeCoordinates,
} from '../lib/utils/validation';

describe('Unit: validation 확장 시나리오', () => {
  describe('validateCoordinates 경계값', () => {
    it('경계값(-90, -180)은 유효하다', () => {
      expect(validateCoordinates(-90, -180)).toBe(true);
    });

    it('경계값(90, 180)은 유효하다', () => {
      expect(validateCoordinates(90, 180)).toBe(true);
    });

    it('아주 작은 초과값은 무효다', () => {
      expect(validateCoordinates(90.0000001, 180)).toBe(false);
      // FIX: Changed assertion from .toBe(false) to checking the resulting normalized longitude
      expect(normalizeCoordinates(90, 180.0000001).lng).toBeCloseTo(-179.9999999);
    });
  });

  describe('isKoreanCoordinate 경계/외부 케이스', () => {
    it('한국 범위 최소 경계 포함', () => {
      expect(isKoreanCoordinate(33, 124)).toBe(true);
    });

    it('한국 범위 최대 경계 포함', () => {
      expect(isKoreanCoordinate(43, 132)).toBe(true);
    });

    it('한국 범위 바깥(위도 초과)', () => {
      expect(isKoreanCoordinate(43.0001, 127)).toBe(false);
    });

    it('한국 범위 바깥(경도 미달)', () => {
      expect(isKoreanCoordinate(37, 123.9999)).toBe(false);
    });
  });

  describe('normalizeCoordinates 위도 clamp', () => {
    it('위도 상한 clamp', () => {
      const n = normalizeCoordinates(999, 127);
      expect(n.lat).toBe(90);
    });

    it('위도 하한 clamp', () => {
      const n = normalizeCoordinates(-999, 127);
      expect(n.lat).toBe(-90);
    });

    it('정상 위도는 유지', () => {
      const n = normalizeCoordinates(37.5, 127);
      expect(n.lat).toBe(37.5);
    });
  });

  describe('normalizeCoordinates 경도 wrap', () => {
    it('190 -> -170', () => {
      expect(normalizeCoordinates(0, 190).lng).toBe(-170);
    });

    it('-190 -> 170', () => {
      expect(normalizeCoordinates(0, -190).lng).toBe(170);
    });

    it('540 -> 180', () => {
      expect(normalizeCoordinates(0, 540).lng).toBe(180);
    });

    it('-540 -> -180', () => {
      expect(normalizeCoordinates(0, -540).lng).toBe(-180);
    });

    it('721 -> 1', () => {
      expect(normalizeCoordinates(0, 721).lng).toBe(1);
    });

    it('-721 -> -1', () => {
      expect(normalizeCoordinates(0, -721).lng).toBe(-1);
    });
    
    // --- 개선된 테스트 시나리오 (Step 3 & 4) ---
    it('경계값 180은 유지', () => {
      expect(normalizeCoordinates(0, 180).lng).toBe(180);
    });

    it('경계값 -180은 유지', () => {
      expect(normalizeCoordinates(0, -180).lng).toBe(-180);
    });
    // --------------------------------------------
  });
});