/**
 * Attribute Derivation Module
 * ============================
 * Derives 14 granular player attributes from a single `rating` value
 * based on the player's natural position.
 */

import { PlayerAttributes } from '@/types/game';
import { POSITION_ATTRIBUTE_OFFSETS, RANDOMNESS_CONFIG, POSITIONAL_FIT } from '@/lib/matchConfig';

export type PositionCategory = 'goalkeeper' | 'defender' | 'midfielder' | 'attacker';

/**
 * Returns the line category of any football position.
 */
export function getPositionCategory(position: string): PositionCategory {
  const p = position.toUpperCase();
  if (p === 'GK') return 'goalkeeper';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'defender';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p)) return 'midfielder';
  if (['ST', 'CF', 'LW', 'RW'].includes(p)) return 'attacker';
  return 'midfielder'; // default fallback
}

/**
 * Seeded pseudo-random number generator (mulberry32)
 * Used to ensure consistent attribute derivation for the same player+seed combo.
 */
function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

/**
 * Derive a simple numeric seed from a player ID string.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Derive granular player attributes from a player's overall rating and position.
 *
 * Example:
 *   ST with rating 88 → finishing: 93, shooting: 91, defending: 55, goalkeeping: 28
 *   CB with rating 88 → defending: 93, tackling: 93, finishing: 55, goalkeeping: 35
 *
 * Uses the player's ID as a seed for consistent variance, so the same player
 * always gets the same derived attributes.
 */
export function derivePlayerAttributes(
  playerId: string,
  position: string,
  rating: number,
  matchSeed?: number
): PlayerAttributes {
  const offsets = POSITION_ATTRIBUTE_OFFSETS[position] || POSITION_ATTRIBUTE_OFFSETS['CM'];
  const variance = RANDOMNESS_CONFIG.attributeVariance;
  const seed = hashString(playerId) + (matchSeed || 0);
  const rng = seededRandom(seed);

  const derive = (attr: string): number => {
    const offset = offsets[attr] || 0;
    const randomOffset = (rng() * variance * 2) - variance; // -variance to +variance
    return clamp(rating + offset + randomOffset, 1, 99);
  };

  return {
    finishing: derive('finishing'),
    shooting: derive('shooting'),
    attacking: derive('attacking'),
    pace: derive('pace'),
    passing: derive('passing'),
    creativity: derive('creativity'),
    ballControl: derive('ballControl'),
    stamina: derive('stamina'),
    defending: derive('defending'),
    tackling: derive('tackling'),
    positioning: derive('positioning'),
    goalkeeping: derive('goalkeeping'),
    reflexes: derive('reflexes'),
    handling: derive('handling'),
  };
}

/**
 * Get the positional fit multiplier for a player playing in a specific slot.
 * Returns 0.0-1.0 where 1.0 = perfect fit.
 */
export function getPositionalFit(naturalPosition: string, playedPosition: string): number {
  if (naturalPosition === playedPosition) return 1.0;

  const fits = POSITIONAL_FIT[naturalPosition];
  if (fits && fits[playedPosition] !== undefined) {
    return fits[playedPosition];
  }

  // Fallback based on category distance if direct key combination is not mapped
  const natCat = getPositionCategory(naturalPosition);
  const playCat = getPositionCategory(playedPosition);

  if (natCat === 'goalkeeper' || playCat === 'goalkeeper') {
    return 0.15; // Goalkeeper out of position or outfield player as GK
  }

  if (natCat === playCat) {
    return 0.88; // Same line fallback
  }

  const categoryOrder: Record<PositionCategory, number> = {
    goalkeeper: 0,
    defender: 1,
    midfielder: 2,
    attacker: 3,
  };

  const distance = Math.abs(categoryOrder[natCat] - categoryOrder[playCat]);
  if (distance === 1) return 0.72; // Adjacent line (DEF <-> MID or MID <-> FWD)
  return 0.45; // 2 steps away (DEF <-> FWD)
}

/**
 * Apply positional fit penalty to attributes.
 * Reduces attributes proportionally to how badly the player fits the slot.
 */
export function applyPositionalPenalty(
  attributes: PlayerAttributes,
  fitMultiplier: number
): PlayerAttributes {
  // Perfect fit = no penalty. Bad fit = attributes reduced proportionally.
  // We use a softer penalty curve: effective = base * (0.4 + 0.6 * fit)
  // This ensures even terrible fit doesn't reduce to near-zero.
  const effective = 0.4 + 0.6 * fitMultiplier;

  return {
    finishing: Math.round(attributes.finishing * effective),
    shooting: Math.round(attributes.shooting * effective),
    attacking: Math.round(attributes.attacking * effective),
    pace: Math.round(attributes.pace * effective),
    passing: Math.round(attributes.passing * effective),
    creativity: Math.round(attributes.creativity * effective),
    ballControl: Math.round(attributes.ballControl * effective),
    stamina: Math.round(attributes.stamina * effective),
    defending: Math.round(attributes.defending * effective),
    tackling: Math.round(attributes.tackling * effective),
    positioning: Math.round(attributes.positioning * effective),
    goalkeeping: Math.round(attributes.goalkeeping * effective),
    reflexes: Math.round(attributes.reflexes * effective),
    handling: Math.round(attributes.handling * effective),
  };
}
