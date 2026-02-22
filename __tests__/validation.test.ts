import {
  validateCoordinates,
  isKoreanCoordinate,
  normalizeCoordinates,
} from '../lib/utils/validation';

describe('Unit: 좌표 유효성/정규화 시나리오', () => {
  describe('validateCoordinates', () => {
    it('정상 WGS84 좌표는 true를 반환한다', () => {
      expect(validateCoordinates(37.5665, 126.9784)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
    });

    it('위도/경도가 범위를 벗어나면 false를 반환한다', () => {
      expect(validateCoordinates(90.0001, 127)).toBe(false);
      expect(validateCoordinates(-90.0001, 127)).toBe(false);
      expect(validateCoordinates(37, 180.0001)).toBe(false);
      expect(validateCoordinates(37, -180.0001)).toBe(false);
    });
  });

  describe('isKoreanCoordinate', () => {
    it('한국 범위 좌표는 true를 반환한다', () => {
      expect(isKoreanCoordinate(37.5665, 126.9784)).toBe(true);
      expect(isKoreanCoordinate(33, 124)).toBe(true);
      expect(isKoreanCoordinate(43, 132)).toBe(true);
    });

    it('한국 범위 밖 좌표는 false를 반환한다', () => {
      expect(isKoreanCoordinate(35, 140)).toBe(false);
      expect(isKoreanCoordinate(50, 127)).toBe(false);
      expect(isKoreanCoordinate(10, 10)).toBe(false);
    });
  });

  describe('normalizeCoordinates', () => {
    it('위도는 -90~90으로 clamp된다', () => {
      expect(normalizeCoordinates(100, 127).lat).toBe(90);
      expect(normalizeCoordinates(-100, 127).lat).toBe(-90);
    });

    it('경도는 -180~180 범위로 wrap된다', () => {
      expect(normalizeCoordinates(37, 190).lng).toBe(-170);
      expect(normalizeCoordinates(37, -190).lng).toBe(170);
      expect(normalizeCoordinates(37, 540).lng).toBe(180);
    });
  });
});
