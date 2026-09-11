/**
 * Tactical System
 * ================
 * Calculates compound tactic modifiers from a TacticalSetup,
 * including interactions between different tactic dimensions.
 */

import { TacticalSetup } from '@/types/game';
import {
  MENTALITY_MODIFIERS,
  PASSING_MODIFIERS,
  TEMPO_MODIFIERS,
  PRESSING_MODIFIERS,
  DEFENSIVE_LINE_MODIFIERS,
  TACTIC_INTERACTIONS,
} from '@/lib/matchConfig';

/** Aggregated tactic effect on team performance */
export interface TacticEffect {
  attackModifier: number;
  defenseModifier: number;
  possessionModifier: number;
  attackSpeedModifier: number;
  creativityModifier: number;
  staminaDrainModifier: number;
  pressureModifier: number;
  counterDangerModifier: number;
  counterRiskModifier: number;
  offsideTrapModifier: number;
}

/**
 * Calculate the aggregate tactical effect from a full TacticalSetup.
 * Combines base modifiers from each dimension + interaction bonuses.
 */
export function calculateTacticEffect(tactics: TacticalSetup): TacticEffect {
  const mentality = MENTALITY_MODIFIERS[tactics.mentality];
  const passing = PASSING_MODIFIERS[tactics.passingStyle];
  const tempo = TEMPO_MODIFIERS[tactics.tempo];
  const pressing = PRESSING_MODIFIERS[tactics.pressing];
  const defensiveLine = DEFENSIVE_LINE_MODIFIERS[tactics.defensiveLine];

  // Base aggregation
  const effect: TacticEffect = {
    attackModifier: mentality.attack,
    defenseModifier: mentality.defense,
    possessionModifier: mentality.possession + passing.possession + tempo.possession,
    attackSpeedModifier: passing.attackSpeed + tempo.attackFrequency,
    creativityModifier: passing.creativity,
    staminaDrainModifier: tempo.staminaDrain + pressing.staminaDrain,
    pressureModifier: pressing.defensePressure,
    counterDangerModifier: tactics.counterAttack ? 15 : 0,
    counterRiskModifier: defensiveLine.counterRisk,
    offsideTrapModifier: defensiveLine.offside,
  };

  // Apply tactic interactions
  for (const interaction of TACTIC_INTERACTIONS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (interaction.condition(tactics as any)) {
      const fx = interaction.effect;
      if ('attackPressure' in fx) effect.attackModifier += (fx.attackPressure || 0);
      if ('defensiveStability' in fx) effect.defenseModifier += (fx.defensiveStability || 0);
      if ('defensiveVulnerability' in fx) effect.defenseModifier -= (fx.defensiveVulnerability || 0);
      if ('possessionBonus' in fx) effect.possessionModifier += (fx.possessionBonus || 0);
      if ('possessionReduction' in fx) effect.possessionModifier += (fx.possessionReduction || 0);
      if ('possessionLoss' in fx) effect.possessionModifier -= (fx.possessionLoss || 0);
      if ('counterDanger' in fx) effect.counterDangerModifier += (fx.counterDanger || 0);
      if ('attackSpeed' in fx) effect.attackSpeedModifier += (fx.attackSpeed || 0);
      if ('attackReduction' in fx) effect.attackModifier += (fx.attackReduction || 0);
      if ('creativity' in fx) effect.creativityModifier += (fx.creativity || 0);
      if ('staminaDrain' in fx) effect.staminaDrainModifier += (fx.staminaDrain || 0);
      if ('staminaSave' in fx) effect.staminaDrainModifier += (fx.staminaSave || 0);
    }
  }

  return effect;
}

/**
 * Calculate matchup advantage based on tactical setups of both teams.
 * Returns a modifier for each team (home and away).
 */
export function calculateMatchupAdvantage(
  homeTactics: TacticalSetup,
  awayTactics: TacticalSetup
): { homeAdvantage: number; awayAdvantage: number } {
  let homeAdv = 0;
  let awayAdv = 0;

  // High press vs counter attack
  if (homeTactics.pressing === 'high' && awayTactics.counterAttack) {
    awayAdv += 8; // Counter exploits high press
    homeAdv -= 3;
  }
  if (awayTactics.pressing === 'high' && homeTactics.counterAttack) {
    homeAdv += 8;
    awayAdv -= 3;
  }

  // High line vs pace-based attack
  if (homeTactics.defensiveLine === 'high' && awayTactics.passingStyle === 'direct') {
    awayAdv += 5; // Direct passes exploit high line
  }
  if (awayTactics.defensiveLine === 'high' && homeTactics.passingStyle === 'direct') {
    homeAdv += 5;
  }

  // Deep defense vs possession play
  if (homeTactics.defensiveLine === 'deep' && awayTactics.passingStyle === 'short' && awayTactics.tempo === 'slow') {
    homeAdv += 3; // Hard to break down
    awayAdv -= 3;
  }
  if (awayTactics.defensiveLine === 'deep' && homeTactics.passingStyle === 'short' && homeTactics.tempo === 'slow') {
    awayAdv += 3;
    homeAdv -= 3;
  }

  // Attacking vs Defensive mentality
  if (homeTactics.mentality === 'attacking' && awayTactics.mentality === 'defensive') {
    homeAdv += 2; // More chances but more open
    awayAdv += 4; // Counter opportunities
  }
  if (awayTactics.mentality === 'attacking' && homeTactics.mentality === 'defensive') {
    awayAdv += 2;
    homeAdv += 4;
  }

  return { homeAdvantage: homeAdv, awayAdvantage: awayAdv };
}
