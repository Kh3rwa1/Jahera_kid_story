import { ValidationError } from './errorHandler';

export const validateKidName = (name: string): string => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new ValidationError('Name cannot be empty');
  }

  if (trimmed.length < 2) {
    throw new ValidationError('Name must be at least 2 characters');
  }

  if (trimmed.length > 50) {
    throw new ValidationError('Name must be less than 50 characters');
  }

  if (!/^[\p{L}\s'-]+$/u.test(trimmed)) {
    throw new ValidationError('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  return trimmed;
};

export const validateMemberName = (name: string): string => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new ValidationError('Name cannot be empty');
  }

  if (trimmed.length < 2) {
    throw new ValidationError('Name must be at least 2 characters');
  }

  if (trimmed.length > 30) {
    throw new ValidationError('Name must be less than 30 characters');
  }

  return trimmed;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ');
};

export const validateLanguageSelection = (languages: unknown[]): boolean => {
  if (!Array.isArray(languages)) {
    throw new ValidationError('Languages must be an array');
  }

  if (languages.length === 0) {
    throw new ValidationError('At least one language must be selected');
  }

  return true;
};
