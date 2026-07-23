import bcrypt from 'bcryptjs';

/**
 * Hashes a plain-text password using bcrypt.
 * @param password The plain-text password to hash
 * @returns The hashed password string
 */
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

/**
 * Compares a plain-text password with a bcrypt hash.
 * @param password The plain-text password to check
 * @param hash The bcrypt hash to compare against
 * @returns True if they match, false otherwise
 */
export function comparePassword(password: string, hash: string): boolean {
  try {
    if (!password || !hash) return false;
    // Fallback for legacy plain-text passwords or during transition
    if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
      return password === hash;
    }
    return bcrypt.compareSync(password, hash);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return password === hash; // Fallback in case of error
  }
}
