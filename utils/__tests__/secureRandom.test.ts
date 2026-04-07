import { randomInt, randomFloat, randomChoice, randomBool } from '../secureRandom';

describe('secureRandom', () => {
  describe('randomInt', () => {
    it('returns 0 if maxExclusive is less than or equal to 1', () => {
      expect(randomInt(1)).toBe(0);
      expect(randomInt(0)).toBe(0);
    });

    it('returns an integer within the range [0, maxExclusive)', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe('randomFloat', () => {
    it('returns min if max <= min', () => {
      expect(randomFloat(10, 5)).toBe(10);
      expect(randomFloat(5, 5)).toBe(5);
    });

    it('returns a float within the range [min, max)', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(5, 10);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThan(10);
      }
    });
  });

  describe('randomChoice', () => {
    it('throws error for empty array', () => {
      expect(() => randomChoice([])).toThrow();
    });

    it('returns an item from the array', () => {
      const arr = ['a', 'b', 'c'];
      for (let i = 0; i < 50; i++) {
        const result = randomChoice(arr);
        expect(arr).toContain(result);
      }
    });
  });

  describe('randomBool', () => {
    it('returns a boolean', () => {
      const result = randomBool();
      expect(typeof result).toBe('boolean');
    });
  });
});
