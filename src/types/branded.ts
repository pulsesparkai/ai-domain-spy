// Branded types for type safety and domain modeling

declare const __brand: unique symbol;

/**
 * Creates a branded type that prevents accidental mixing of similar primitive types
 */
export type Brand<T, TBrand extends string> = T & {
  readonly [__brand]: TBrand;
};

// ID Types
export type UserId = Brand<string, 'UserId'>;
export type ScanId = Brand<string, 'ScanId'>;
export type ProfileId = Brand<string, 'ProfileId'>;
export type RequestId = Brand<string, 'RequestId'>;

export type StripeCustomerId = Brand<string, 'StripeCustomerId'>;

// URL Types
export type TargetUrl = Brand<string, 'TargetUrl'>;
export type AvatarUrl = Brand<string, 'AvatarUrl'>;

// Email Type
export type Email = Brand<string, 'Email'>;

// Timestamp Types
export type ISODateString = Brand<string, 'ISODateString'>;

// Utility functions for creating branded types
export const createUserId = (id: string): UserId => id as UserId;
export const createScanId = (id: string): ScanId => id as ScanId;
export const createProfileId = (id: string): ProfileId => id as ProfileId;
export const createRequestId = (): RequestId => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as RequestId;
export const createStripeCustomerId = (id: string): StripeCustomerId => id as StripeCustomerId;
export const createTargetUrl = (url: string): TargetUrl => url as TargetUrl;
export const createAvatarUrl = (url: string): AvatarUrl => url as AvatarUrl;
export const createEmail = (email: string): Email => email as Email;
export const createISODateString = (date: string): ISODateString => date as ISODateString;

// Type guards for branded types
export const isUserId = (value: string): value is UserId => {
  // UUID v4 pattern validation
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
};

export const isEmail = (value: string): value is Email => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
};

export const isTargetUrl = (value: string): value is TargetUrl => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const isISODateString = (value: string): value is ISODateString => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
};