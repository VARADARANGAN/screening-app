/**
 * Deterministically shuffles an array based on a seed string.
 * This guarantees the exact same shuffle order for the same seed,
 * which is useful for keeping randomized options stable per student/question.
 */
export function seededShuffle<T>(array: T[], seedStr: string): T[] {
  if (!array || array.length === 0) return array;

  // Simple string hashing function
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = Math.imul(31, seed) + seedStr.charCodeAt(i) | 0;
  }

  // Mulberry32 PRNG
  const mulberry32 = (a: number) => {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  const random = mulberry32(seed);
  
  const shuffled = [...array];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
