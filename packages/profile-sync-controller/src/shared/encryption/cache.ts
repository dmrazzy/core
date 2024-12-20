import { SHARED_SALT } from './constants';
import { byteArrayToBase64 } from './utils';

type CachedEntry = {
  salt: Uint8Array;
  base64Salt: string;
  key: Uint8Array;
};

const MAX_PASSWORD_CACHES = 100;
const MAX_SALT_CACHES = 100;

/**
 * In-Memory Caching derived keys based from a given salt and password.
 */
type PasswordMemCachedKDF = {
  [hashedPassword: string]: Map<string, Uint8Array>;
};
let inMemCachedKDF: PasswordMemCachedKDF = {};
const getPasswordCache = (hashedPassword: string) => {
  inMemCachedKDF[hashedPassword] ??= new Map();
  return inMemCachedKDF[hashedPassword];
};

/**
 * Returns a given cached derived key from a hashed password and salt
 *
 * @param hashedPassword - hashed password for cache lookup
 * @param salt - provide salt to receive cached key
 * @returns cached key
 */
export function getCachedKeyBySalt(
  hashedPassword: string,
  salt: Uint8Array,
): CachedEntry | undefined {
  const cache = getPasswordCache(hashedPassword);
  const base64Salt = byteArrayToBase64(salt);
  const cachedKey = cache.get(base64Salt);
  if (!cachedKey) {
    return undefined;
  }

  return {
    salt,
    base64Salt,
    key: cachedKey,
  };
}

/**
 * Gets the cached key that was generated without a salt, if it exists.
 * This is unique per hashed password.
 *
 * @param hashedPassword - hashed password for cache lookup
 * @returns the cached key
 */
export function getCachedKeyGeneratedWithSharedSalt(
  hashedPassword: string,
): CachedEntry | undefined {
  const cache = getPasswordCache(hashedPassword);
  const base64Salt = byteArrayToBase64(SHARED_SALT);
  const cachedKey = cache.get(base64Salt);

  if (!cachedKey) {
    return undefined;
  }

  return {
    salt: SHARED_SALT,
    base64Salt,
    key: cachedKey,
  };
}

/**
 * Sets a key to the in memory cache.
 * We have set an arbitrary size of 10 cached keys per hashed password.
 *
 * @param hashedPassword - hashed password for cache lookup
 * @param salt - salt to set new derived key
 * @param key - derived key we are setting
 */
export function setCachedKey(
  hashedPassword: string,
  salt: Uint8Array,
  key: Uint8Array,
): void {
  // Max password caches
  if (Object.keys(inMemCachedKDF).length > MAX_PASSWORD_CACHES) {
    inMemCachedKDF = {};
  }

  const cache = getPasswordCache(hashedPassword);
  const base64Salt = byteArrayToBase64(salt);

  // Max salt caches
  if (cache.size > MAX_SALT_CACHES) {
    cache.clear();
  }

  cache.set(base64Salt, key);
}
