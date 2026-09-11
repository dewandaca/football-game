/**
 * Team Strength Calculator
 * =========================
 * Computes multi-dimensional team strength from player attributes,
 * positional fit, formation modifiers, and tactical modifiers.
 */

import {
  FootballPlayer,
  PlayerAttributes,
  FormationId,
  TacticalSetup,
  PlayerSlotAssignment,
  SimulationTeamConfig,
} from '@/types/game';
import { STRENGTH_WEIGHTS, POSITIONAL_FIT } from '@/lib/matchConfig';
import { derivePlayerAttributes, applyPositionalPenalty } from './deriveAttributes';
import { getFormation } from './formations';
import { calculateTacticEffect, TacticEffect } from './tactics';

/** Computed strength values for a team */
export interface TeamStrength {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  overall: number;
  tacticEffect: TacticEffect;
  /** Per-player resolved attributes (after positional fit penalty) */
  playerAttributes: Map<string, PlayerAttributes>;
  /** Per-player slot positions in formation */
  playerSlotPositions: Map<string, string>;
}

/**
 * Calculate the weighted attribute score for a specific line (attack/midfield/defense/gk).
 */
function calculateLineScore(
  attrs: PlayerAttributes,
  weights: Record<string, number>
): number {
  let score = 0;
  let totalWeight = 0;

  for (const [attr, weight] of Object.entries(weights)) {
    const value = (attrs as unknown as Record<string, number>)[attr] ?? 50;
    score += value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? score / totalWeight : 50;
}

/**
 * Compute the full multi-dimensional strength for a team.
 */
export function calculateTeamStrength(
  config: SimulationTeamConfig,
  matchSeed: number
): TeamStrength {
  const formation = getFormation(config.formation);
  const tacticEffect = calculateTacticEffect(config.tactics);
  const playerAttributes = new Map<string, PlayerAttributes>();
  const playerSlotPositions = new Map<string, string>();

  // Build player lookup
  const playerMap = new Map<string, FootballPlayer>();
  for (const p of config.squad) {
    playerMap.set(p.id, p);
  }

  // Resolve assignments: which player → which slot
  const resolvedAssignments: { player: FootballPlayer; slotIndex: number; attrs: PlayerAttributes }[] = [];

  for (const assignment of config.assignments) {
    const player = playerMap.get(assignment.playerId);
    if (!player) continue;

    const slot = formation.slots[assignment.slotIndex];
    if (!slot) continue;

    // Derive attributes from rating + natural position
    const rawAttrs = derivePlayerAttributes(player.id, player.position, player.rating, matchSeed);

    // Apply positional fit penalty
    const fits = POSITIONAL_FIT[player.position] || {};
    const fitMultiplier = fits[slot.position] ?? 0.4;
    const effectiveAttrs = applyPositionalPenalty(rawAttrs, fitMultiplier);

    playerAttributes.set(player.id, effectiveAttrs);
    playerSlotPositions.set(player.id, slot.position);

    resolvedAssignments.push({ player, slotIndex: assignment.slotIndex, attrs: effectiveAttrs });
  }

  // Group players by role
  const attackers = resolvedAssignments.filter(a => formation.slots[a.slotIndex].role === 'attacker');
  const midfielders = resolvedAssignments.filter(a => formation.slots[a.slotIndex].role === 'midfielder');
  const defenders = resolvedAssignments.filter(a => formation.slots[a.slotIndex].role === 'defender');
  const goalkeepers = resolvedAssignments.filter(a => formation.slots[a.slotIndex].role === 'goalkeeper');

  // Calculate line strengths
  const avgLineScore = (players: typeof resolvedAssignments, weights: Record<string, number>): number => {
    if (players.length === 0) return 50;
    const total = players.reduce((sum, p) => sum + calculateLineScore(p.attrs, weights), 0);
    return total / players.length;
  };

  let attackStrength = avgLineScore(attackers, STRENGTH_WEIGHTS.attack);
  let midfieldStrength = avgLineScore(midfielders, STRENGTH_WEIGHTS.midfield);
  let defenseStrength = avgLineScore(defenders, STRENGTH_WEIGHTS.defense);
  let gkStrength = avgLineScore(goalkeepers, STRENGTH_WEIGHTS.goalkeeper);

  // If no players in a line, use a lower fallback from available players
  if (attackers.length === 0) attackStrength = avgLineScore(resolvedAssignments, STRENGTH_WEIGHTS.attack) * 0.6;
  if (midfielders.length === 0) midfieldStrength = avgLineScore(resolvedAssignments, STRENGTH_WEIGHTS.midfield) * 0.6;
  if (defenders.length === 0) defenseStrength = avgLineScore(resolvedAssignments, STRENGTH_WEIGHTS.defense) * 0.6;
  if (goalkeepers.length === 0) gkStrength = 30;

  // Apply formation modifiers (percentage bonus/penalty)
  attackStrength *= (1 + formation.modifiers.attack / 100);
  midfieldStrength *= (1 + formation.modifiers.midfield / 100);
  defenseStrength *= (1 + formation.modifiers.defense / 100);

  // Apply tactic modifiers
  attackStrength *= (1 + tacticEffect.attackModifier / 100);
  defenseStrength *= (1 + tacticEffect.defenseModifier / 100);

  // Calculate overall (weighted average)
  const overall = attackStrength * 0.30 + midfieldStrength * 0.35 + defenseStrength * 0.25 + gkStrength * 0.10;

  return {
    attack: Math.round(attackStrength * 10) / 10,
    midfield: Math.round(midfieldStrength * 10) / 10,
    defense: Math.round(defenseStrength * 10) / 10,
    goalkeeper: Math.round(gkStrength * 10) / 10,
    overall: Math.round(overall * 10) / 10,
    tacticEffect,
    playerAttributes,
    playerSlotPositions,
  };
}
