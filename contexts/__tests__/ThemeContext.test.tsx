/**
 * Tests for ThemeContext — getThemeById, APP_ICONS, and theme constants
 * Includes both happy-path and edge-case/error tests.
 */
import { COLOR_SCHEMES, DEFAULT_THEME, getThemeById } from '@/constants/themeSchemes';
import { APP_ICONS } from '../ThemeContext';

describe('getThemeById', () => {
  it('returns the correct theme for a valid ID', () => {
    const theme = getThemeById('mint');
    expect(theme.id).toBe('mint');
    expect(theme.name).toBe('Mint Fresh');
  });

  it('returns default theme for an unknown ID', () => {
    const theme = getThemeById('nonexistent');
    expect(theme.id).toBe(DEFAULT_THEME.id);
  });

  it('returns the correct theme for each known scheme', () => {
    for (const scheme of COLOR_SCHEMES) {
      const result = getThemeById(scheme.id);
      expect(result.id).toBe(scheme.id);
      expect(result.name).toBe(scheme.name);
    }
  });

  // Edge cases
  it('returns default theme for empty string', () => {
    const theme = getThemeById('');
    expect(theme.id).toBe(DEFAULT_THEME.id);
  });

  it('is case-sensitive (uppercase ID should not match)', () => {
    const theme = getThemeById('MINT');
    expect(theme.id).toBe(DEFAULT_THEME.id);
  });

  it('returns default theme for special characters', () => {
    const theme = getThemeById('!@#$%');
    expect(theme.id).toBe(DEFAULT_THEME.id);
  });
});

describe('DEFAULT_THEME', () => {
  it('has a valid structure', () => {
    expect(DEFAULT_THEME.id).toBeDefined();
    expect(DEFAULT_THEME.name).toBeDefined();
    expect(DEFAULT_THEME.emoji).toBeDefined();
    expect(DEFAULT_THEME.colors).toBeDefined();
  });

  it('has all required color properties', () => {
    const { colors } = DEFAULT_THEME;
    expect(colors.primary).toBeDefined();
    expect(colors.primaryDark).toBeDefined();
    expect(colors.primaryLight).toBeDefined();
    expect(colors.background).toBeDefined();
    expect(colors.cardBackground).toBeDefined();
    expect(colors.text.primary).toBeDefined();
    expect(colors.text.secondary).toBeDefined();
    expect(colors.gradients.primary).toHaveLength(3);
  });

  // Edge case: verify colors are valid hex strings
  it('primary color is a valid hex color', () => {
    expect(DEFAULT_THEME.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('background color is a valid hex color', () => {
    expect(DEFAULT_THEME.colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('COLOR_SCHEMES', () => {
  it('contains at least 5 themes', () => {
    expect(COLOR_SCHEMES.length).toBeGreaterThanOrEqual(5);
  });

  it('has unique IDs across all schemes', () => {
    const ids = COLOR_SCHEMES.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('each scheme has valid gradient arrays', () => {
    for (const scheme of COLOR_SCHEMES) {
      expect(scheme.colors.gradients.primary.length).toBeGreaterThanOrEqual(2);
      expect(scheme.colors.backgroundGradient.length).toBeGreaterThanOrEqual(2);
    }
  });

  // Edge case: verify each scheme has all required properties
  it('each scheme has non-empty name and emoji', () => {
    for (const scheme of COLOR_SCHEMES) {
      expect(scheme.name.length).toBeGreaterThan(0);
      expect(scheme.emoji.length).toBeGreaterThan(0);
    }
  });

  it('each scheme has text sub-object with primary and secondary', () => {
    for (const scheme of COLOR_SCHEMES) {
      expect(scheme.colors.text.primary).toBeTruthy();
      expect(scheme.colors.text.secondary).toBeTruthy();
    }
  });
});

describe('APP_ICONS', () => {
  it('contains at least 5 icons', () => {
    expect(APP_ICONS.length).toBeGreaterThanOrEqual(5);
  });

  it('has unique IDs', () => {
    const ids = APP_ICONS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each icon has required fields', () => {
    for (const icon of APP_ICONS) {
      expect(icon.id).toBeTruthy();
      expect(icon.name).toBeTruthy();
      expect(icon.emoji).toBeTruthy();
      expect(icon.description).toBeTruthy();
    }
  });

  it('first icon is the default "Classic" icon', () => {
    expect(APP_ICONS[0].id).toBe('default');
    expect(APP_ICONS[0].name).toBe('Classic');
  });

  // Edge case: ID format validation
  it('all icon IDs are lowercase alphanumeric with hyphens', () => {
    for (const icon of APP_ICONS) {
      expect(icon.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('all icons have single emoji characters', () => {
    for (const icon of APP_ICONS) {
      expect(icon.emoji.length).toBeGreaterThan(0);
      expect(icon.emoji.length).toBeLessThanOrEqual(4); // emoji can be 1-4 JS chars
    }
  });
});
