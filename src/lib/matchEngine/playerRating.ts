/**
 * Player Rating Calculator
 * =========================
 * Calculates post-match performance ratings (6.0-10.0) for each player.
 * Based on goals, assists, chances created, defensive actions, and context.
 */

import { FootballPlayer, PlayerMatchPerformance } from '@/types/game';
import { TeamStrength } from './teamStrength';

/**
 * Calculate post-match ratings for all players in a team.
 */
export function calculatePlayerRatings(
  squad: FootballPlayer[],
  teamStrength: TeamStrength,
  performanceData: Map<string, {
    goals: number; assists: number; shots: number; shotsOnTarget: number;
    chancesCreated: number; passes: number; tackles: number;
    interceptions: number; saves: number; mistakes: number;
  }>,
  matchResult: 'win' | 'draw' | 'loss',
  rng: () => number
): PlayerMatchPerformance[] {
  const ratings: PlayerMatchPerformance[] = [];

  for (const player of squad) {
    const perf = performanceData.get(player.id);
    const slotPosition = teamStrength.playerSlotPositions.get(player.id) || player.position;

    if (!perf) {
      ratings.push({
        playerId: player.id,
        playerName: player.name,
        position: slotPosition,
        naturalPosition: player.position,
        rating: 6.0 + rng() * 0.5,
        goals: 0, assists: 0, shotsTotal: 0, shotsOnTarget: 0,
        chancesCreated: 0, passesCompleted: 0, tackles: 0,
        interceptions: 0, saves: 0, isMotm: false,
      });
      continue;
    }

    // Base rating: 6.5 (average performance)
    let rating = 6.5;

    // Match result bonus/penalty
    if (matchResult === 'win') rating += 0.3;
    else if (matchResult === 'loss') rating -= 0.2;
    // Draw: no change

    // Goal bonus (huge impact)
    rating += perf.goals * 0.8;

    // Assist bonus
    rating += perf.assists * 0.4;

    // Chances created
    rating += perf.chancesCreated * 0.15;

    // Shots on target (shows attacking intent)
    rating += perf.shotsOnTarget * 0.1;

    // Passes (minor contribution)
    rating += Math.min(perf.passes * 0.02, 0.3);

    // Defensive actions
    rating += perf.tackles * 0.1;
    rating += perf.interceptions * 0.12;

    // Saves (for goalkeepers)
    rating += perf.saves * 0.25;

    // Mistakes penalty
    rating -= perf.mistakes * 0.3;

    // Position-specific bonuses
    if (['GK'].includes(slotPosition)) {
      // GK rating bonus for clean sheet
      if (matchResult === 'win' && perf.saves > 0) rating += 0.3;
      if (perf.saves >= 3) rating += 0.3;
    }

    if (['ST', 'CF', 'LW', 'RW'].includes(slotPosition)) {
      // Attackers penalized slightly for no goals/assists in a loss
      if (matchResult === 'loss' && perf.goals === 0 && perf.assists === 0) {
        rating -= 0.2;
      }
    }

    if (['CB', 'LB', 'RB', 'CDM'].includes(slotPosition)) {
      // Defenders get bonus for clean involvement
      if (perf.tackles > 0 || perf.interceptions > 0) {
        rating += 0.15;
      }
    }

    // Individual random variance (small)
    rating += (rng() - 0.5) * 0.4;

    // Clamp rating
    rating = Math.max(5.0, Math.min(10.0, rating));

    // Round to 1 decimal
    rating = Math.round(rating * 10) / 10;

    ratings.push({
      playerId: player.id,
      playerName: player.name,
      position: slotPosition,
      naturalPosition: player.position,
      rating,
      goals: perf.goals,
      assists: perf.assists,
      shotsTotal: perf.shots,
      shotsOnTarget: perf.shotsOnTarget,
      chancesCreated: perf.chancesCreated,
      passesCompleted: perf.passes,
      tackles: perf.tackles,
      interceptions: perf.interceptions,
      saves: perf.saves,
      isMotm: false,
    });
  }

  // Sort by rating descending
  ratings.sort((a, b) => b.rating - a.rating);

  return ratings;
}
