/**
 * Match Engine — Barrel Exports
 */

export { simulateMatch } from './simulateMatch';
export { derivePlayerAttributes, getPositionalFit, applyPositionalPenalty } from './deriveAttributes';
export { getFormation, getAllFormations, getAllFormationIds, autoAssignPlayers, getMirroredSlots } from './formations';
export { calculateTacticEffect, calculateMatchupAdvantage } from './tactics';
export { calculateTeamStrength } from './teamStrength';
export { calculatePlayerRatings } from './playerRating';
export { createMatchEvent, getRandomPlayerByRole, getGoalkeeper } from './eventGenerator';
export { calculatePlayerPosition } from './pitchMovement';

export type { TacticEffect } from './tactics';
export type { TeamStrength } from './teamStrength';
