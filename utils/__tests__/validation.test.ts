import {
  validateKidName,
  validateMemberName,
  sanitizeInput,
  validateLanguageSelection,
} from '../validation';

describe('validateKidName', () => {
  it('accepts valid names', () => {
    expect(() => validateKidName('Aarav')).not.toThrow();
    expect(() => validateKidName('Priya')).not.toThrow();
    expect(() => validateKidName('Jean Pierre')).not.toThrow();
    expect(validateKidName('Aarav')).toBe('Aarav');
  });

  it('trims whitespace from names', () => {
    expect(validateKidName('  Riya  ')).toBe('Riya');
  });

  it('rejects empty names', () => {
    expect(() => validateKidName('')).toThrow();
    expect(() => validateKidName('   ')).toThrow();
  });

  it('rejects names that are too short', () => {
    expect(() => validateKidName('A')).toThrow();
  });

  it('rejects names that are too long', () => {
    expect(() => validateKidName('A'.repeat(51))).toThrow();
  });
});

describe('validateMemberName', () => {
  it('accepts valid member names', () => {
    expect(() => validateMemberName('Papa')).not.toThrow();
    expect(() => validateMemberName('Dadi Ji')).not.toThrow();
  });

  it('rejects empty member names', () => {
    expect(() => validateMemberName('')).toThrow();
  });

  it('rejects names that are too long', () => {
    expect(() => validateMemberName('A'.repeat(31))).toThrow();
  });
});

describe('sanitizeInput', () => {
  it('removes HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>Hello')).not.toContain(
      '<script>',
    );
  });

  it('trims and normalizes whitespace', () => {
    const result = sanitizeInput('  hello    world  ');
    expect(result).toBe('hello world');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('preserves safe characters', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
  });
});

describe('validateLanguageSelection', () => {
  it('accepts valid language arrays', () => {
    expect(() => validateLanguageSelection(['en', 'hi'])).not.toThrow();
  });

  it('rejects empty arrays', () => {
    expect(() => validateLanguageSelection([])).toThrow();
  });
});
