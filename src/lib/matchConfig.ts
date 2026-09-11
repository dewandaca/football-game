/**
 * Match Simulation Configuration
 * ================================
 * All tunable constants for the match simulation engine.
 * Modify values here to rebalance the game without touching engine code.
 */

// =====================================================
// POSITION ATTRIBUTE WEIGHTS
// =====================================================
// Defines how each attribute is derived from the base rating per position.
// Values are offsets from base rating. e.g., +8 means attribute = rating + 8.

export const POSITION_ATTRIBUTE_OFFSETS: Record<string, Record<string, number>> = {
  GK: {
    finishing: -45, shooting: -40, attacking: -40, pace: -20,
    passing: -15, creativity: -30, ballControl: -20, stamina: -10,
    defending: -5, tackling: -15, positioning: +5,
    goalkeeping: +8, reflexes: +8, handling: +8,
  },
  CB: {
    finishing: -30, shooting: -25, attacking: -25, pace: -10,
    passing: -5, creativity: -20, ballControl: -10, stamina: +0,
    defending: +8, tackling: +8, positioning: +5,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  LB: {
    finishing: -25, shooting: -20, attacking: -10, pace: +5,
    passing: +2, creativity: -5, ballControl: -5, stamina: +5,
    defending: +5, tackling: +3, positioning: +2,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  RB: {
    finishing: -25, shooting: -20, attacking: -10, pace: +5,
    passing: +2, creativity: -5, ballControl: -5, stamina: +5,
    defending: +5, tackling: +3, positioning: +2,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  CDM: {
    finishing: -20, shooting: -15, attacking: -15, pace: -5,
    passing: +5, creativity: -5, ballControl: +0, stamina: +5,
    defending: +5, tackling: +6, positioning: +5,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  CM: {
    finishing: -10, shooting: -5, attacking: -5, pace: +0,
    passing: +6, creativity: +3, ballControl: +5, stamina: +5,
    defending: +0, tackling: +0, positioning: +0,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  CAM: {
    finishing: +0, shooting: +2, attacking: +3, pace: +2,
    passing: +5, creativity: +8, ballControl: +5, stamina: +0,
    defending: -15, tackling: -15, positioning: -10,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  LM: {
    finishing: -5, shooting: -3, attacking: +0, pace: +5,
    passing: +3, creativity: +3, ballControl: +3, stamina: +5,
    defending: -5, tackling: -5, positioning: -3,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  RM: {
    finishing: -5, shooting: -3, attacking: +0, pace: +5,
    passing: +3, creativity: +3, ballControl: +3, stamina: +5,
    defending: -5, tackling: -5, positioning: -3,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  LW: {
    finishing: +2, shooting: +3, attacking: +5, pace: +8,
    passing: +3, creativity: +5, ballControl: +5, stamina: +0,
    defending: -20, tackling: -20, positioning: -15,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  RW: {
    finishing: +2, shooting: +3, attacking: +5, pace: +8,
    passing: +3, creativity: +5, ballControl: +5, stamina: +0,
    defending: -20, tackling: -20, positioning: -15,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  ST: {
    finishing: +8, shooting: +6, attacking: +8, pace: +3,
    passing: -5, creativity: +0, ballControl: +3, stamina: +0,
    defending: -30, tackling: -25, positioning: -20,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
  CF: {
    finishing: +6, shooting: +5, attacking: +6, pace: +2,
    passing: +0, creativity: +3, ballControl: +5, stamina: +0,
    defending: -25, tackling: -20, positioning: -15,
    goalkeeping: -50, reflexes: -40, handling: -45,
  },
};

// =====================================================
// POSITIONAL FIT / PENALTY
// =====================================================
// When a player plays out of position, their effective attributes
// are reduced by this penalty multiplier.
// 1.0 = perfect fit, 0.5 = major penalty

export const POSITIONAL_FIT: Record<string, Record<string, number>> = {
  // naturalPosition → playedPosition → fit multiplier
  // Tier 1 (Same line): 0.85 - 1.0 (100% or minor 10-15% variance)
  // Tier 2 (Adjacent line, e.g. FWD <-> MID, MID <-> DEF): 0.70 - 0.78 (moderate ~25% penalty)
  // Tier 3 (2 lines away, e.g. FWD <-> DEF): 0.42 - 0.50 (heavy ~50% penalty)
  // Tier 4 (Goalkeeper <-> Outfield): 0.15 - 0.20 (severe ~80% penalty)
  GK:  { GK: 1.0,  CB: 0.20, LB: 0.20, RB: 0.20, CDM: 0.20, CM: 0.18, CAM: 0.18, LM: 0.18, RM: 0.18, LW: 0.15, RW: 0.15, ST: 0.15, CF: 0.15 },
  CB:  { GK: 0.20, CB: 1.0,  LB: 0.85, RB: 0.85, CDM: 0.75, CM: 0.68, CAM: 0.55, LM: 0.55, RM: 0.55, LW: 0.42, RW: 0.42, ST: 0.45, CF: 0.42 },
  LB:  { GK: 0.18, CB: 0.80, LB: 1.0,  RB: 0.88, CDM: 0.72, CM: 0.70, CAM: 0.60, LM: 0.80, RM: 0.60, LW: 0.55, RW: 0.45, ST: 0.42, CF: 0.42 },
  RB:  { GK: 0.18, CB: 0.80, LB: 0.88, RB: 1.0,  CDM: 0.72, CM: 0.70, CAM: 0.60, LM: 0.60, RM: 0.80, LW: 0.45, RW: 0.55, ST: 0.42, CF: 0.42 },
  CDM: { GK: 0.20, CB: 0.78, LB: 0.70, RB: 0.70, CDM: 1.0,  CM: 0.90, CAM: 0.75, LM: 0.72, RM: 0.72, LW: 0.58, RW: 0.58, ST: 0.52, CF: 0.55 },
  CM:  { GK: 0.18, CB: 0.68, LB: 0.68, RB: 0.68, CDM: 0.88, CM: 1.0,  CAM: 0.88, LM: 0.82, RM: 0.82, LW: 0.72, RW: 0.72, ST: 0.65, CF: 0.70 },
  CAM: { GK: 0.16, CB: 0.52, LB: 0.55, RB: 0.55, CDM: 0.72, CM: 0.88, CAM: 1.0,  LM: 0.82, RM: 0.82, LW: 0.80, RW: 0.80, ST: 0.78, CF: 0.85 },
  LM:  { GK: 0.16, CB: 0.55, LB: 0.75, RB: 0.60, CDM: 0.68, CM: 0.80, CAM: 0.80, LM: 1.0,  RM: 0.85, LW: 0.88, RW: 0.75, ST: 0.68, CF: 0.72 },
  RM:  { GK: 0.16, CB: 0.55, LB: 0.60, RB: 0.75, CDM: 0.68, CM: 0.80, CAM: 0.80, LM: 0.85, RM: 1.0,  LW: 0.75, RW: 0.88, ST: 0.68, CF: 0.72 },
  LW:  { GK: 0.15, CB: 0.42, LB: 0.52, RB: 0.45, CDM: 0.58, CM: 0.72, CAM: 0.78, LM: 0.88, RM: 0.75, LW: 1.0,  RW: 0.90, ST: 0.82, CF: 0.85 },
  RW:  { GK: 0.15, CB: 0.42, LB: 0.45, RB: 0.52, CDM: 0.58, CM: 0.72, CAM: 0.78, LM: 0.75, RM: 0.88, LW: 0.90, RW: 1.0,  ST: 0.82, CF: 0.85 },
  ST:  { GK: 0.15, CB: 0.45, LB: 0.42, RB: 0.42, CDM: 0.55, CM: 0.70, CAM: 0.78, LM: 0.70, RM: 0.70, LW: 0.85, RW: 0.85, ST: 1.0,  CF: 0.95 },
  CF:  { GK: 0.15, CB: 0.45, LB: 0.42, RB: 0.42, CDM: 0.58, CM: 0.74, CAM: 0.85, LM: 0.74, RM: 0.74, LW: 0.88, RW: 0.88, ST: 0.95, CF: 1.0  },
};

// =====================================================
// FORMATION MODIFIERS
// =====================================================
// Applied to team strength calculations.
// Values are percentage bonuses/penalties.

export const FORMATION_MODIFIERS: Record<string, {
  attack: number;
  midfield: number;
  defense: number;
  width: number;
  counterVulnerability: number;
}> = {
  '4-3-3':  { attack: 10, midfield: 0,  defense: 0,  width: 10,  counterVulnerability: 5 },
  '4-4-2':  { attack: 5,  midfield: 5,  defense: 0,  width: 5,   counterVulnerability: 0 },
  '4-2-3-1':{ attack: 5,  midfield: 5,  defense: 5,  width: 0,   counterVulnerability: 0 },
  '3-5-2':  { attack: 5,  midfield: 10, defense: -5, width: -5,  counterVulnerability: 5 },
  '3-4-3':  { attack: 10, midfield: 5,  defense: -10,width: 5,   counterVulnerability: 10 },
  '5-3-2':  { attack: -5, midfield: 0,  defense: 10, width: -5,  counterVulnerability: -5 },
  '5-4-1':  { attack: -10,midfield: 5,  defense: 10, width: -5,  counterVulnerability: -10 },
  '4-5-1':  { attack: -5, midfield: 10, defense: 5,  width: 0,   counterVulnerability: -5 },
};

// =====================================================
// TACTIC MODIFIERS
// =====================================================

export const MENTALITY_MODIFIERS: Record<string, { attack: number; defense: number; possession: number }> = {
  defensive: { attack: -15, defense: 15, possession: -5 },
  balanced:  { attack: 0,   defense: 0,  possession: 0 },
  attacking: { attack: 15,  defense: -10, possession: 5 },
};

export const PASSING_MODIFIERS: Record<string, { possession: number; attackSpeed: number; creativity: number }> = {
  short:  { possession: 10,  attackSpeed: -10, creativity: 5 },
  mixed:  { possession: 0,   attackSpeed: 0,   creativity: 0 },
  direct: { possession: -10, attackSpeed: 10,  creativity: -5 },
};

export const TEMPO_MODIFIERS: Record<string, { attackFrequency: number; staminaDrain: number; possession: number }> = {
  slow:   { attackFrequency: -10, staminaDrain: -10, possession: 5 },
  normal: { attackFrequency: 0,   staminaDrain: 0,   possession: 0 },
  fast:   { attackFrequency: 10,  staminaDrain: 10,  possession: -5 },
};

export const PRESSING_MODIFIERS: Record<string, { defensePressure: number; staminaDrain: number; interceptionChance: number }> = {
  low:    { defensePressure: -10, staminaDrain: -10, interceptionChance: -5 },
  medium: { defensePressure: 0,   staminaDrain: 0,   interceptionChance: 0 },
  high:   { defensePressure: 15,  staminaDrain: 15,  interceptionChance: 10 },
};

export const DEFENSIVE_LINE_MODIFIERS: Record<string, { counterRisk: number; offside: number; defensiveCompact: number }> = {
  deep:   { counterRisk: -15, offside: -10, defensiveCompact: 10 },
  normal: { counterRisk: 0,   offside: 0,   defensiveCompact: 0 },
  high:   { counterRisk: 15,  offside: 10,  defensiveCompact: -5 },
};

// =====================================================
// TACTIC INTERACTION BONUSES
// =====================================================
// Special bonuses when certain tactic combinations are active

export const TACTIC_INTERACTIONS = [
  {
    name: 'High Press + Fast Tempo',
    condition: (t: { pressing: string; tempo: string }) => t.pressing === 'high' && t.tempo === 'fast',
    effect: { attackPressure: 15, staminaDrain: 10, possessionLoss: 5 },
  },
  {
    name: 'Deep Line + Counter Attack',
    condition: (t: { defensiveLine: string; counterAttack: boolean }) => t.defensiveLine === 'deep' && t.counterAttack,
    effect: { possessionReduction: -15, counterDanger: 20, defensiveStability: 5 },
  },
  {
    name: 'Short Pass + Slow Tempo',
    condition: (t: { passingStyle: string; tempo: string }) => t.passingStyle === 'short' && t.tempo === 'slow',
    effect: { possessionBonus: 10, attackSpeed: -10, creativity: 5 },
  },
  {
    name: 'Attacking + High Press',
    condition: (t: { mentality: string; pressing: string }) => t.mentality === 'attacking' && t.pressing === 'high',
    effect: { attackPressure: 20, defensiveVulnerability: 15, staminaDrain: 10 },
  },
  {
    name: 'Defensive + Low Press',
    condition: (t: { mentality: string; pressing: string }) => t.mentality === 'defensive' && t.pressing === 'low',
    effect: { defensiveStability: 15, attackReduction: -20, staminaSave: -10 },
  },
  {
    name: 'Direct + Fast Tempo',
    condition: (t: { passingStyle: string; tempo: string }) => t.passingStyle === 'direct' && t.tempo === 'fast',
    effect: { counterDanger: 10, possessionLoss: 10, attackSpeed: 15 },
  },
];

// =====================================================
// EVENT PROBABILITIES
// =====================================================
// Base probabilities for each type of event per minute

export const EVENT_PROBABILITIES = {
  /** Base chance of a meaningful event happening in any given minute */
  eventOccurrencePerMinute: 0.45,

  /** Given an event occurs, probability distribution */
  eventDistribution: {
    possession: 0.25,
    buildUp: 0.15,
    attack: 0.15,
    dangerousAttack: 0.10,
    counterAttack: 0.06,
    corner: 0.06,
    freeKick: 0.04,
    interception: 0.07,
    tackle: 0.06,
    foul: 0.04,
    offside: 0.02,
  },

  /** Given a dangerous attack, probability of generating a shot */
  shotFromChance: 0.70,

  /** Given a shot, probability distribution */
  shotOutcome: {
    onTarget: 0.42,
    offTarget: 0.35,
    blocked: 0.23,
  },
};

// =====================================================
// GOAL PROBABILITY
// =====================================================
// Fine-tuned goal scoring parameters

export const GOAL_PROBABILITIES = {
  /** Base goal probability for an on-target shot (before modifiers) */
  baseGoalRate: 0.30,

  /** How much attacker finishing affects goal probability (0-1 scale) */
  finishingWeight: 0.35,

  /** How much shot quality affects goal probability */
  shotQualityWeight: 0.25,

  /** How much GK ability reduces goal probability */
  goalkeeperWeight: 0.30,

  /** How much defensive pressure reduces goal probability */
  defensivePressureWeight: 0.10,

  /** Random variance added to goal probability (-range, +range) */
  randomVariance: 0.12,
};

// =====================================================
// RANDOMNESS CONFIGURATION
// =====================================================

export const RANDOMNESS_CONFIG = {
  /** Attribute derivation variance (±value) */
  attributeVariance: 3,

  /** How much random factor affects individual match events */
  eventRandomFactor: 0.25,

  /** Momentum maximum value */
  momentumMax: 50,

  /** Momentum decay per minute */
  momentumDecay: 0.92,

  /** Momentum boost from scoring a goal */
  goalMomentumBoost: 20,

  /** Momentum boost from a missed big chance (to opponent) */
  missedChanceMomentumSwing: 8,

  /** Upset factor: reduces the gap between strong and weak teams (0-1, higher = more upsets) */
  upsetFactor: 0.25,

  /** Stamina reduction in second half (as fraction of stamina attribute used) */
  secondHalfStaminaFactor: 0.85,

  /** Injury time range in minutes */
  injuryTimeRange: { firstHalf: [1, 3], secondHalf: [1, 5] } as Record<string, [number, number]>,
};

// =====================================================
// TEAM STRENGTH CALCULATION WEIGHTS
// =====================================================
// How much each attribute category contributes to line strength

export const STRENGTH_WEIGHTS = {
  attack: {
    finishing: 0.30,
    shooting: 0.25,
    attacking: 0.20,
    pace: 0.10,
    creativity: 0.10,
    ballControl: 0.05,
  },
  midfield: {
    passing: 0.25,
    creativity: 0.15,
    ballControl: 0.20,
    stamina: 0.15,
    attacking: 0.10,
    defending: 0.10,
    positioning: 0.05,
  },
  defense: {
    defending: 0.35,
    tackling: 0.25,
    positioning: 0.20,
    pace: 0.10,
    stamina: 0.10,
  },
  goalkeeper: {
    goalkeeping: 0.40,
    reflexes: 0.35,
    handling: 0.25,
  },
};

// =====================================================
// COMMENTARY TEMPLATES
// =====================================================
// Min/max events to generate per match for variety

export const MATCH_EVENT_LIMITS = {
  minEventsPerHalf: 8,
  maxEventsPerHalf: 16,
  minTotalGoals: 0,
  maxTotalGoals: 8,
};

// =====================================================
// ANIMATION TIMING (milliseconds)
// =====================================================

export const ANIMATION_TIMING = {
  /** Duration for normal possession event */
  possession: 1200,
  /** Duration for build-up event */
  buildUp: 1800,
  /** Duration for attack event */
  attack: 2500,
  /** Duration for shot event */
  shot: 1800,
  /** Duration for goal celebration */
  goal: 4000,
  /** Duration for save event */
  save: 2000,
  /** Duration for counter attack */
  counterAttack: 3000,
  /** Duration for other events (corner, foul, offside, etc.) */
  other: 1500,
  /** Duration for halftime/fulltime */
  break: 3000,
  /** Duration for kickoff */
  kickoff: 2500,
};
