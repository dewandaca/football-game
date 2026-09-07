/**
 * Fuzzy match a user's guess against an answer and its aliases.
 * Handles case-insensitive, trimmed, and partial matching.
 */
export function fuzzyMatch(guess: string, answer: string, aliases: string[]): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s]/g, '') // remove special chars
      .replace(/\s+/g, ' ');

  const normalizedGuess = normalize(guess);
  if (!normalizedGuess) return false;

  const allTargets = [answer, ...aliases].map(normalize);

  for (const target of allTargets) {
    // Exact match
    if (normalizedGuess === target) return true;
    // Contains match (e.g., "messi" matches "lionel messi")
    if (target.includes(normalizedGuess) && normalizedGuess.length >= 3) return true;
    if (normalizedGuess.includes(target) && target.length >= 3) return true;
  }

  return false;
}

/**
 * Format a number as currency (e.g., 50000 -> "50.000")
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('id-ID');
}

/**
 * Format a number with leading zeros for display (e.g., timers)
 */
export function padNumber(n: number, digits = 2): string {
  return String(n).padStart(digits, '0');
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get position label for display
 */
export function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    GK: '#F59E0B',
    RB: '#10B981',
    CB: '#10B981',
    LB: '#10B981',
    CDM: '#3B82F6',
    CM: '#3B82F6',
    RW: '#EF4444',
    ST: '#EF4444',
    LW: '#EF4444',
  };
  return colors[position] ?? '#94A3B8';
}
