/**
 * Formation System
 * =================
 * Defines 8 formations with slot positions, roles, and pitch coordinates.
 * Each formation has modifiers that affect team strength calculations.
 */

import { FormationDefinition, FormationId, FormationSlot } from '@/types/game';
import { FORMATION_MODIFIERS } from '@/lib/matchConfig';

/**
 * All formation definitions.
 * Coordinates: x = 0-100 (left to right), y = 0-100 (own goal to opponent goal)
 */
const FORMATIONS: Record<FormationId, { name: string; slots: FormationSlot[] }> = {
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'LB',  x: 15, y: 25, role: 'defender' },
      { position: 'CB',  x: 38, y: 20, role: 'defender' },
      { position: 'CB',  x: 62, y: 20, role: 'defender' },
      { position: 'RB',  x: 85, y: 25, role: 'defender' },
      { position: 'CM',  x: 30, y: 45, role: 'midfielder' },
      { position: 'CDM', x: 50, y: 38, role: 'midfielder' },
      { position: 'CM',  x: 70, y: 45, role: 'midfielder' },
      { position: 'LW',  x: 18, y: 72, role: 'attacker' },
      { position: 'ST',  x: 50, y: 80, role: 'attacker' },
      { position: 'RW',  x: 82, y: 72, role: 'attacker' },
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'LB',  x: 15, y: 25, role: 'defender' },
      { position: 'CB',  x: 38, y: 20, role: 'defender' },
      { position: 'CB',  x: 62, y: 20, role: 'defender' },
      { position: 'RB',  x: 85, y: 25, role: 'defender' },
      { position: 'LM',  x: 15, y: 50, role: 'midfielder' },
      { position: 'CM',  x: 38, y: 45, role: 'midfielder' },
      { position: 'CM',  x: 62, y: 45, role: 'midfielder' },
      { position: 'RM',  x: 85, y: 50, role: 'midfielder' },
      { position: 'ST',  x: 38, y: 78, role: 'attacker' },
      { position: 'ST',  x: 62, y: 78, role: 'attacker' },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'LB',  x: 15, y: 25, role: 'defender' },
      { position: 'CB',  x: 38, y: 20, role: 'defender' },
      { position: 'CB',  x: 62, y: 20, role: 'defender' },
      { position: 'RB',  x: 85, y: 25, role: 'defender' },
      { position: 'CDM', x: 38, y: 40, role: 'midfielder' },
      { position: 'CDM', x: 62, y: 40, role: 'midfielder' },
      { position: 'LW',  x: 18, y: 60, role: 'midfielder' },
      { position: 'CAM', x: 50, y: 60, role: 'midfielder' },
      { position: 'RW',  x: 82, y: 60, role: 'midfielder' },
      { position: 'ST',  x: 50, y: 80, role: 'attacker' },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'CB',  x: 28, y: 20, role: 'defender' },
      { position: 'CB',  x: 50, y: 18, role: 'defender' },
      { position: 'CB',  x: 72, y: 20, role: 'defender' },
      { position: 'LM',  x: 10, y: 48, role: 'midfielder' },
      { position: 'CM',  x: 32, y: 45, role: 'midfielder' },
      { position: 'CDM', x: 50, y: 38, role: 'midfielder' },
      { position: 'CM',  x: 68, y: 45, role: 'midfielder' },
      { position: 'RM',  x: 90, y: 48, role: 'midfielder' },
      { position: 'ST',  x: 38, y: 78, role: 'attacker' },
      { position: 'ST',  x: 62, y: 78, role: 'attacker' },
    ],
  },
  '3-4-3': {
    name: '3-4-3',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'CB',  x: 28, y: 20, role: 'defender' },
      { position: 'CB',  x: 50, y: 18, role: 'defender' },
      { position: 'CB',  x: 72, y: 20, role: 'defender' },
      { position: 'LM',  x: 15, y: 48, role: 'midfielder' },
      { position: 'CM',  x: 38, y: 42, role: 'midfielder' },
      { position: 'CM',  x: 62, y: 42, role: 'midfielder' },
      { position: 'RM',  x: 85, y: 48, role: 'midfielder' },
      { position: 'LW',  x: 18, y: 72, role: 'attacker' },
      { position: 'ST',  x: 50, y: 80, role: 'attacker' },
      { position: 'RW',  x: 82, y: 72, role: 'attacker' },
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'LB',  x: 10, y: 28, role: 'defender' },
      { position: 'CB',  x: 30, y: 20, role: 'defender' },
      { position: 'CB',  x: 50, y: 18, role: 'defender' },
      { position: 'CB',  x: 70, y: 20, role: 'defender' },
      { position: 'RB',  x: 90, y: 28, role: 'defender' },
      { position: 'CM',  x: 30, y: 45, role: 'midfielder' },
      { position: 'CM',  x: 50, y: 42, role: 'midfielder' },
      { position: 'CM',  x: 70, y: 45, role: 'midfielder' },
      { position: 'ST',  x: 38, y: 78, role: 'attacker' },
      { position: 'ST',  x: 62, y: 78, role: 'attacker' },
    ],
  },
  '5-4-1': {
    name: '5-4-1',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'LB',  x: 10, y: 28, role: 'defender' },
      { position: 'CB',  x: 30, y: 20, role: 'defender' },
      { position: 'CB',  x: 50, y: 18, role: 'defender' },
      { position: 'CB',  x: 70, y: 20, role: 'defender' },
      { position: 'RB',  x: 90, y: 28, role: 'defender' },
      { position: 'LM',  x: 15, y: 48, role: 'midfielder' },
      { position: 'CM',  x: 38, y: 42, role: 'midfielder' },
      { position: 'CM',  x: 62, y: 42, role: 'midfielder' },
      { position: 'RM',  x: 85, y: 48, role: 'midfielder' },
      { position: 'ST',  x: 50, y: 80, role: 'attacker' },
    ],
  },
  '4-5-1': {
    name: '4-5-1',
    slots: [
      { position: 'GK',  x: 50, y: 5,  role: 'goalkeeper' },
      { position: 'LB',  x: 15, y: 25, role: 'defender' },
      { position: 'CB',  x: 38, y: 20, role: 'defender' },
      { position: 'CB',  x: 62, y: 20, role: 'defender' },
      { position: 'RB',  x: 85, y: 25, role: 'defender' },
      { position: 'LM',  x: 15, y: 50, role: 'midfielder' },
      { position: 'CM',  x: 35, y: 45, role: 'midfielder' },
      { position: 'CAM', x: 50, y: 52, role: 'midfielder' },
      { position: 'CM',  x: 65, y: 45, role: 'midfielder' },
      { position: 'RM',  x: 85, y: 50, role: 'midfielder' },
      { position: 'ST',  x: 50, y: 80, role: 'attacker' },
    ],
  },
};

/**
 * Get the full formation definition including modifiers.
 */
export function getFormation(id: FormationId): FormationDefinition {
  const formation = FORMATIONS[id];
  if (!formation) {
    throw new Error(`Unknown formation: ${id}`);
  }
  return {
    id,
    name: formation.name,
    slots: formation.slots,
    modifiers: FORMATION_MODIFIERS[id],
  };
}

/**
 * Get all available formation IDs.
 */
export function getAllFormationIds(): FormationId[] {
  return Object.keys(FORMATIONS) as FormationId[];
}

/**
 * Get all formation definitions.
 */
export function getAllFormations(): FormationDefinition[] {
  return getAllFormationIds().map(getFormation);
}

/**
 * Auto-assign players to formation slots using a best-fit algorithm.
 * Tries to match players to slots where their natural position fits best.
 */
export function autoAssignPlayers(
  squad: { id: string; position: string }[],
  formationId: FormationId
): { playerId: string; slotIndex: number }[] {
  const formation = getFormation(formationId);
  const slots = formation.slots;
  const assignments: { playerId: string; slotIndex: number }[] = [];
  const usedPlayers = new Set<string>();

  // Import positional fit at runtime to avoid circular dependency
  const { POSITIONAL_FIT } = require('@/lib/matchConfig');

  // For each slot, find the best available player
  // Process GK first, then defenders, then midfielders, then attackers
  const slotOrder = [...slots.keys()].sort((a, b) => {
    const roleOrder = { goalkeeper: 0, defender: 1, midfielder: 2, attacker: 3 };
    return (roleOrder[slots[a].role] || 0) - (roleOrder[slots[b].role] || 0);
  });

  for (const slotIdx of slotOrder) {
    const slot = slots[slotIdx];
    let bestPlayer: string | null = null;
    let bestFit = -1;

    for (const player of squad) {
      if (usedPlayers.has(player.id)) continue;

      const fits = POSITIONAL_FIT[player.position] || {};
      const fit = fits[slot.position] ?? 0.3;

      if (fit > bestFit) {
        bestFit = fit;
        bestPlayer = player.id;
      }
    }

    if (bestPlayer) {
      assignments.push({ playerId: bestPlayer, slotIndex: slotIdx });
      usedPlayers.add(bestPlayer);
    }
  }

  return assignments;
}

/**
 * Get slot positions mirrored for the away team (flip y-axis).
 * Used for rendering the 2D pitch with both teams.
 */
export function getMirroredSlots(slots: FormationSlot[]): FormationSlot[] {
  return slots.map(slot => ({
    ...slot,
    y: 100 - slot.y,
  }));
}
