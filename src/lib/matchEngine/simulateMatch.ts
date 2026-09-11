/**
 * Match Simulation Engine
 * ========================
 * The core simulation engine that generates a complete match result.
 * Produces all events, statistics, and player ratings from team configs.
 *
 * Architecture: Pure logic, no UI dependencies.
 * Output: MatchResult with events[], stats, ratings — consumed by animation renderer.
 */

import {
  MatchResult,
  MatchEvent,
  TeamMatchStats,
  SimulationTeamConfig,
  MatchDebugInfo,
  FootballPlayer,
  PlayerAttributes,
  PenaltyKickRecord,
} from '@/types/game';
import {
  EVENT_PROBABILITIES,
  GOAL_PROBABILITIES,
  RANDOMNESS_CONFIG,
  MATCH_EVENT_LIMITS,
} from '@/lib/matchConfig';
import { calculateTeamStrength, TeamStrength } from './teamStrength';
import { calculateMatchupAdvantage } from './tactics';
import { derivePlayerAttributes } from './deriveAttributes';
import {
  createMatchEvent,
  getRandomPlayerByRole,
  getGoalkeeper,
  getRandomSide,
  resetEventCounter,
} from './eventGenerator';
import { calculatePlayerRatings } from './playerRating';

/**
 * Seeded pseudo-random number generator (mulberry32).
 */
function createRNG(seed: number): () => number {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sigmoid function for smooth probability mapping.
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Simulate a complete 90-minute football match.
 *
 * @param home - Home team configuration
 * @param away - Away team configuration
 * @param seed - Random seed for replayability (0 = random)
 * @param debug - Whether to include debug info
 * @returns Complete match result
 */
export function simulateMatch(
  home: SimulationTeamConfig,
  away: SimulationTeamConfig,
  seed: number = 0,
  debug: boolean = false
): MatchResult {
  // Generate seed if not provided
  const matchSeed = seed || Math.floor(Math.random() * 2147483647);
  const rng = createRNG(matchSeed);

  // Reset event counter
  resetEventCounter();

  // Calculate team strengths
  const homeStrength = calculateTeamStrength(home, matchSeed);
  const awayStrength = calculateTeamStrength(away, matchSeed);

  // Calculate matchup advantages
  const matchup = calculateMatchupAdvantage(home.tactics, away.tactics);

  // Initialize state
  let homeScore = 0;
  let awayScore = 0;
  let momentum = 0; // -MOMENTUM_MAX to +MOMENTUM_MAX, positive = home momentum
  const events: MatchEvent[] = [];

  // Statistics accumulators
  const homeStats = createEmptyStats();
  const awayStats = createEmptyStats();

  // Player performance trackers
  const playerPerformance = new Map<string, {
    goals: number; assists: number; shots: number; shotsOnTarget: number;
    chancesCreated: number; passes: number; tackles: number;
    interceptions: number; saves: number; mistakes: number;
  }>();

  // Initialize performance tracking for all players
  for (const p of [...home.squad, ...away.squad]) {
    playerPerformance.set(p.id, {
      goals: 0, assists: 0, shots: 0, shotsOnTarget: 0,
      chancesCreated: 0, passes: 0, tackles: 0,
      interceptions: 0, saves: 0, mistakes: 0,
    });
  }

  // Compute derived probabilities
  const possessionHome = calculatePossession(homeStrength, awayStrength, matchup, rng);

  // =================================
  // KICKOFF EVENT
  // =================================
  events.push(createMatchEvent({
    minute: 1,
    type: 'kickoff',
    team: 'neutral',
    period: 'firstHalf',
    homeScore, awayScore, momentum,
    homeTeamName: home.name,
    awayTeamName: away.name,
    rng,
  }));

  // =================================
  // FIRST HALF (1-45)
  // =================================
  const firstHalfInjuryTime = RANDOMNESS_CONFIG.injuryTimeRange.firstHalf;
  const ft1 = firstHalfInjuryTime[0] + Math.floor(rng() * (firstHalfInjuryTime[1] - firstHalfInjuryTime[0] + 1));
  const firstHalfEnd = 45 + ft1;

  simulateHalf(
    1, 45, ft1, false,
    home, away, homeStrength, awayStrength, matchup,
    possessionHome, rng, events,
    homeStats, awayStats, playerPerformance,
    () => homeScore, (v: number) => { homeScore = v; },
    () => awayScore, (v: number) => { awayScore = v; },
    () => momentum, (v: number) => { momentum = v; },
    'firstHalf',
  );

  // HALF TIME EVENT
  events.push(createMatchEvent({
    minute: 45,
    injuryTime: ft1 > 0,
    type: 'halftime',
    team: 'neutral',
    period: 'firstHalf',
    homeScore, awayScore, momentum,
    homeTeamName: home.name,
    awayTeamName: away.name,
    rng,
  }));

  // =================================
  // SECOND HALF (46-90)
  // =================================
  events.push(createMatchEvent({
    minute: 46,
    type: 'secondHalfStart',
    team: 'neutral',
    period: 'secondHalf',
    homeScore, awayScore, momentum,
    homeTeamName: home.name,
    awayTeamName: away.name,
    rng,
  }));

  const secondHalfInjuryTime = RANDOMNESS_CONFIG.injuryTimeRange.secondHalf;
  const ft2 = secondHalfInjuryTime[0] + Math.floor(rng() * (secondHalfInjuryTime[1] - secondHalfInjuryTime[0] + 1));

  simulateHalf(
    46, 90, ft2, true,
    home, away, homeStrength, awayStrength, matchup,
    possessionHome, rng, events,
    homeStats, awayStats, playerPerformance,
    () => homeScore, (v: number) => { homeScore = v; },
    () => awayScore, (v: number) => { awayScore = v; },
    () => momentum, (v: number) => { momentum = v; },
    'secondHalf',
  );

  // FULL TIME EVENT
  events.push(createMatchEvent({
    minute: 90,
    injuryTime: ft2 > 0,
    type: 'fulltime',
    team: 'neutral',
    period: 'secondHalf',
    homeScore, awayScore, momentum,
    homeTeamName: home.name,
    awayTeamName: away.name,
    rng,
  }));

  // =================================
  // EXTRA TIME (91-120) IF TIED
  // =================================
  let wentToExtraTime = false;
  let wentToPenalties = false;
  let homePenalties = 0;
  let awayPenalties = 0;
  let penaltyShootout: PenaltyKickRecord[] | undefined = undefined;

  if (homeScore === awayScore) {
    wentToExtraTime = true;

    // Extra Time Babak 1 Start
    events.push(createMatchEvent({
      minute: 90,
      type: 'extraTimeFirstHalfStart',
      team: 'neutral',
      period: 'extraTimeFirst',
      homeScore, awayScore, momentum,
      homeTeamName: home.name,
      awayTeamName: away.name,
      rng,
    }));

    simulateHalf(
      91, 105, 1, true,
      home, away, homeStrength, awayStrength, matchup,
      possessionHome, rng, events,
      homeStats, awayStats, playerPerformance,
      () => homeScore, (v: number) => { homeScore = v; },
      () => awayScore, (v: number) => { awayScore = v; },
      () => momentum, (v: number) => { momentum = v; },
      'extraTimeFirst',
    );

    // Extra Time Halftime
    events.push(createMatchEvent({
      minute: 105,
      type: 'extraTimeHalftime',
      team: 'neutral',
      period: 'extraTimeFirst',
      homeScore, awayScore, momentum,
      homeTeamName: home.name,
      awayTeamName: away.name,
      rng,
    }));

    // Extra Time Babak 2 Start
    events.push(createMatchEvent({
      minute: 105,
      type: 'extraTimeSecondHalfStart',
      team: 'neutral',
      period: 'extraTimeSecond',
      homeScore, awayScore, momentum,
      homeTeamName: home.name,
      awayTeamName: away.name,
      rng,
    }));

    simulateHalf(
      106, 120, 1, true,
      home, away, homeStrength, awayStrength, matchup,
      possessionHome, rng, events,
      homeStats, awayStats, playerPerformance,
      () => homeScore, (v: number) => { homeScore = v; },
      () => awayScore, (v: number) => { awayScore = v; },
      () => momentum, (v: number) => { momentum = v; },
      'extraTimeSecond',
    );

    // Extra Time Fulltime
    events.push(createMatchEvent({
      minute: 120,
      type: 'extraTimeFulltime',
      team: 'neutral',
      period: 'extraTimeSecond',
      homeScore, awayScore, momentum,
      homeTeamName: home.name,
      awayTeamName: away.name,
      rng,
    }));
  }

  // =================================
  // PENALTY SHOOTOUT IF STILL TIED
  // =================================
  let winnerTeam: 'home' | 'away';
  if (homeScore !== awayScore) {
    winnerTeam = homeScore > awayScore ? 'home' : 'away';
  } else {
    wentToPenalties = true;
    const shootoutResult = simulatePenaltyShootout(
      home, away, homeStrength, awayStrength, matchSeed,
      homeScore, awayScore, rng, events
    );
    winnerTeam = shootoutResult.winnerTeam;
    homePenalties = shootoutResult.homePenalties;
    awayPenalties = shootoutResult.awayPenalties;
    penaltyShootout = shootoutResult.penaltyShootout;
  }

  // Finalize possession stats
  const totalPossEvents = homeStats.possession + awayStats.possession;
  if (totalPossEvents > 0) {
    homeStats.possession = Math.round((homeStats.possession / totalPossEvents) * 100);
    awayStats.possession = 100 - homeStats.possession;
  } else {
    homeStats.possession = 50;
    awayStats.possession = 50;
  }

  // Finalize pass accuracy
  if (homeStats.passes > 0) {
    homeStats.passAccuracy = Math.min(95, Math.max(55, Math.round(65 + (homeStrength.midfield - 50) * 0.5 + (rng() * 10 - 5))));
  }
  if (awayStats.passes > 0) {
    awayStats.passAccuracy = Math.min(95, Math.max(55, Math.round(65 + (awayStrength.midfield - 50) * 0.5 + (rng() * 10 - 5))));
  }

  // Calculate player ratings (always decisive win/loss)
  const homeRatings = calculatePlayerRatings(
    home.squad, homeStrength, playerPerformance,
    winnerTeam === 'home' ? 'win' : 'loss',
    rng
  );
  const awayRatings = calculatePlayerRatings(
    away.squad, awayStrength, playerPerformance,
    winnerTeam === 'away' ? 'win' : 'loss',
    rng
  );

  // Determine MOTM
  const allRatings = [...homeRatings, ...awayRatings];
  const motm = allRatings.reduce((best, cur) =>
    cur.rating > best.rating ? cur : best,
    allRatings[0]
  );
  if (motm) motm.isMotm = true;

  // Build result
  const result: MatchResult = {
    seed: matchSeed,
    homeTeamName: home.name,
    awayTeamName: away.name,
    homeFormation: home.formation,
    awayFormation: away.formation,
    homeTactics: home.tactics,
    awayTactics: away.tactics,
    homeScore,
    awayScore,
    winnerTeam,
    wentToExtraTime,
    wentToPenalties,
    homePenalties: wentToPenalties ? homePenalties : undefined,
    awayPenalties: wentToPenalties ? awayPenalties : undefined,
    penaltyShootout,
    events,
    homeStats,
    awayStats,
    homePlayerPerformances: homeRatings,
    awayPlayerPerformances: awayRatings,
    motm: motm || null,
  };

  // Debug info
  if (debug) {
    result.debug = buildDebugInfo(homeStrength, awayStrength, possessionHome, matchup);
  }

  return result;
}

// =====================================================
// PENALTY SHOOTOUT SIMULATION
// =====================================================

function simulatePenaltyShootout(
  home: SimulationTeamConfig,
  away: SimulationTeamConfig,
  homeStrength: TeamStrength,
  awayStrength: TeamStrength,
  matchSeed: number,
  homeScore: number,
  awayScore: number,
  rng: () => number,
  events: MatchEvent[],
): {
  homePenalties: number;
  awayPenalties: number;
  winnerTeam: 'home' | 'away';
  penaltyShootout: PenaltyKickRecord[];
} {
  events.push(createMatchEvent({
    minute: 120,
    type: 'penaltyShootoutStart',
    team: 'neutral',
    period: 'penalties',
    homeScore,
    awayScore,
    momentum: 0,
    homeTeamName: home.name,
    awayTeamName: away.name,
    rng,
  }));

  // Order outfield players by penalty ability, GK at the end
  const getKickers = (team: SimulationTeamConfig) => {
    const outfield = team.squad.filter(p => p.position !== 'GK');
    const gk = team.squad.find(p => p.position === 'GK') || team.squad[0];
    const scoredOutfield = outfield.map(p => {
      const attr = derivePlayerAttributes(p.id, p.position, p.rating, matchSeed);
      const score = attr.finishing * 0.5 + attr.shooting * 0.3 + attr.ballControl * 0.2;
      return { player: p, score };
    });
    scoredOutfield.sort((a, b) => b.score - a.score);
    return [...scoredOutfield.map(s => s.player), gk];
  };

  const homeKickers = getKickers(home);
  const awayKickers = getKickers(away);
  const homeGk = getGoalkeeper(home.squad, homeStrength.playerSlotPositions);
  const awayGk = getGoalkeeper(away.squad, awayStrength.playerSlotPositions);

  const homeGkAttr = homeGk ? derivePlayerAttributes(homeGk.id, homeGk.position, homeGk.rating, matchSeed) : null;
  const awayGkAttr = awayGk ? derivePlayerAttributes(awayGk.id, awayGk.position, awayGk.rating, matchSeed) : null;

  const homeGkSkill = homeGkAttr ? homeGkAttr.reflexes * 0.6 + homeGkAttr.goalkeeping * 0.4 : 65;
  const awayGkSkill = awayGkAttr ? awayGkAttr.reflexes * 0.6 + awayGkAttr.goalkeeping * 0.4 : 65;

  let homePenalties = 0;
  let awayPenalties = 0;
  let homeKicksTaken = 0;
  let awayKicksTaken = 0;
  const records: PenaltyKickRecord[] = [];

  const takeKick = (
    round: number,
    team: 'home' | 'away',
    kicker: FootballPlayer,
    oppGkSkill: number,
    oppGkName: string,
  ): 'goal' | 'save' | 'miss' => {
    const kickerAttr = derivePlayerAttributes(kicker.id, kicker.position, kicker.rating, matchSeed);
    const penSkill = kickerAttr.finishing * 0.5 + kickerAttr.shooting * 0.3 + kickerAttr.ballControl * 0.2;
    // Goal probability between 50% and 92%
    const goalProb = Math.min(0.92, Math.max(0.50, 0.74 + (penSkill - oppGkSkill) * 0.0035));
    const isGoal = rng() < goalProb;
    const outcome: 'goal' | 'save' | 'miss' = isGoal ? 'goal' : (rng() < 0.75 ? 'save' : 'miss');

    if (team === 'home') {
      homeKicksTaken++;
      if (outcome === 'goal') homePenalties++;
    } else {
      awayKicksTaken++;
      if (outcome === 'goal') awayPenalties++;
    }

    records.push({
      round,
      team,
      kickerName: kicker.name,
      outcome,
      homeScoreAfter: homePenalties,
      awayScoreAfter: awayPenalties,
    });

    events.push(createMatchEvent({
      minute: 120,
      type: 'penaltyKick',
      team,
      period: 'penalties',
      penaltyTaker: kicker.name,
      penaltyOutcome: outcome,
      penaltyRound: round,
      homePenalties,
      awayPenalties,
      homeScore,
      awayScore,
      momentum: 0,
      homeTeamName: home.name,
      awayTeamName: away.name,
      gkName: oppGkName,
      rng,
    }));

    return outcome;
  };

  // Best of 5 rounds
  let winner: 'home' | 'away' | null = null;
  for (let r = 1; r <= 5; r++) {
    const homeKicker = homeKickers[(r - 1) % homeKickers.length];
    takeKick(r, 'home', homeKicker, awayGkSkill, awayGk?.name || 'Kiper Lawan');

    // Check if away mathematically cannot catch up or home mathematically cannot win
    const homeRem = 5 - homeKicksTaken;
    const awayRem = 5 - awayKicksTaken;
    if (homePenalties > awayPenalties + awayRem) {
      winner = 'home';
      break;
    }
    if (awayPenalties > homePenalties + homeRem) {
      winner = 'away';
      break;
    }

    const awayKicker = awayKickers[(r - 1) % awayKickers.length];
    takeKick(r, 'away', awayKicker, homeGkSkill, homeGk?.name || 'Kiper Lawan');

    const homeRemAfterAway = 5 - homeKicksTaken;
    const awayRemAfterAway = 5 - awayKicksTaken;
    if (homePenalties > awayPenalties + awayRemAfterAway) {
      winner = 'home';
      break;
    }
    if (awayPenalties > homePenalties + homeRemAfterAway) {
      winner = 'away';
      break;
    }
  }

  // Sudden Death if still tied after 5 rounds
  let suddenRound = 6;
  while (!winner && suddenRound <= 25) {
    const homeKicker = homeKickers[(suddenRound - 1) % homeKickers.length];
    const awayKicker = awayKickers[(suddenRound - 1) % awayKickers.length];

    takeKick(suddenRound, 'home', homeKicker, awayGkSkill, awayGk?.name || 'Kiper Lawan');
    takeKick(suddenRound, 'away', awayKicker, homeGkSkill, homeGk?.name || 'Kiper Lawan');

    if (homePenalties !== awayPenalties) {
      winner = homePenalties > awayPenalties ? 'home' : 'away';
      break;
    }
    suddenRound++;
  }

  // Fallback tiebreaker (almost never reached)
  if (!winner) {
    winner = rng() < 0.5 ? 'home' : 'away';
    if (winner === 'home') homePenalties++;
    else awayPenalties++;
  }

  // Final shootout end event
  events.push(createMatchEvent({
    minute: 120,
    type: 'penaltyShootoutEnd',
    team: winner,
    period: 'penalties',
    homePenalties,
    awayPenalties,
    homeScore,
    awayScore,
    momentum: 0,
    homeTeamName: home.name,
    awayTeamName: away.name,
    rng,
  }));

  return {
    homePenalties,
    awayPenalties,
    winnerTeam: winner,
    penaltyShootout: records,
  };
}

// =====================================================
// HALF SIMULATION
// =====================================================

function simulateHalf(
  startMinute: number,
  endMinute: number,
  injuryTimeMinutes: number,
  isSecondHalf: boolean,
  home: SimulationTeamConfig,
  away: SimulationTeamConfig,
  homeStrength: TeamStrength,
  awayStrength: TeamStrength,
  matchup: { homeAdvantage: number; awayAdvantage: number },
  possessionHome: number,
  rng: () => number,
  events: MatchEvent[],
  homeStats: TeamMatchStats,
  awayStats: TeamMatchStats,
  playerPerformance: Map<string, { goals: number; assists: number; shots: number; shotsOnTarget: number; chancesCreated: number; passes: number; tackles: number; interceptions: number; saves: number; mistakes: number }>,
  getHomeScore: () => number,
  setHomeScore: (v: number) => void,
  getAwayScore: () => number,
  setAwayScore: (v: number) => void,
  getMomentum: () => number,
  setMomentum: (v: number) => void,
  period?: 'firstHalf' | 'secondHalf' | 'extraTimeFirst' | 'extraTimeSecond',
) {
  const currentPeriod = period || (isSecondHalf ? 'secondHalf' : 'firstHalf');
  const totalMinutes = (endMinute - startMinute) + injuryTimeMinutes;
  const minEvents = MATCH_EVENT_LIMITS.minEventsPerHalf;
  const maxEvents = MATCH_EVENT_LIMITS.maxEventsPerHalf;
  const targetEvents = minEvents + Math.floor(rng() * (maxEvents - minEvents + 1));

  // Generate event minutes
  const eventMinutes: number[] = [];
  for (let i = 0; i < targetEvents; i++) {
    const minute = startMinute + Math.floor(rng() * totalMinutes);
    const clampedMinute = Math.min(minute, endMinute + injuryTimeMinutes);
    eventMinutes.push(clampedMinute);
  }
  eventMinutes.sort((a, b) => a - b);

  // Stamina factor for second half
  const staminaFactor = isSecondHalf ? RANDOMNESS_CONFIG.secondHalfStaminaFactor : 1.0;

  for (const minute of eventMinutes) {
    const isInjuryTime = minute > endMinute;
    const currentMomentum = getMomentum();

    // Decay momentum
    setMomentum(currentMomentum * RANDOMNESS_CONFIG.momentumDecay);

    // Determine which team has the ball this event
    const momentumShift = currentMomentum / RANDOMNESS_CONFIG.momentumMax * 0.1;
    const adjustedPossession = possessionHome + momentumShift;
    const homeHasBall = rng() < adjustedPossession;

    const attackingTeam = homeHasBall ? 'home' : 'away';
    const attackingConfig = homeHasBall ? home : away;
    const defendingConfig = homeHasBall ? away : home;
    const attackingStrength = homeHasBall ? homeStrength : awayStrength;
    const defendingStrength = homeHasBall ? awayStrength : homeStrength;
    const attackStats = homeHasBall ? homeStats : awayStats;
    const defendStats = homeHasBall ? awayStats : homeStats;

    // Track possession
    if (homeHasBall) homeStats.possession++;
    else awayStats.possession++;

    // Determine event type
    const eventType = rollEventType(rng, attackingConfig, defendingConfig, attackingStrength, defendingStrength, staminaFactor);

    // Process event
    processEvent(
      minute, isInjuryTime, eventType, attackingTeam,
      attackingConfig, defendingConfig, attackingStrength, defendingStrength,
      home, away, rng, events,
      attackStats, defendStats, playerPerformance,
      getHomeScore, setHomeScore, getAwayScore, setAwayScore,
      getMomentum, setMomentum, staminaFactor, currentPeriod,
    );
  }
}

// =====================================================
// EVENT TYPE ROLL
// =====================================================

function rollEventType(
  rng: () => number,
  _attackConfig: SimulationTeamConfig,
  _defendConfig: SimulationTeamConfig,
  attackStrength: TeamStrength,
  defendStrength: TeamStrength,
  staminaFactor: number,
): string {
  const dist = EVENT_PROBABILITIES.eventDistribution;
  const roll = rng();

  // Modify probabilities based on team strengths
  const attackAdvantage = (attackStrength.attack - defendStrength.defense) / 100;
  const counterBonus = attackStrength.tacticEffect.counterDangerModifier / 100;

  let cumulative = 0;

  // Adjust dangerous attack probability
  const adjustedDangerousAttack = Math.max(0.03, dist.dangerousAttack + attackAdvantage * 0.08) * staminaFactor;
  const adjustedCounter = Math.max(0.02, dist.counterAttack + counterBonus * 0.05);

  const probabilities: [string, number][] = [
    ['possession', dist.possession],
    ['buildUp', dist.buildUp],
    ['attack', dist.attack],
    ['dangerousAttack', adjustedDangerousAttack],
    ['counterAttack', adjustedCounter],
    ['corner', dist.corner],
    ['freeKick', dist.freeKick],
    ['interception', dist.interception],
    ['tackle', dist.tackle],
    ['foul', dist.foul],
    ['offside', dist.offside],
  ];

  // Normalize
  const total = probabilities.reduce((sum, [, p]) => sum + p, 0);

  for (const [type, prob] of probabilities) {
    cumulative += prob / total;
    if (roll < cumulative) return type;
  }

  return 'possession';
}

// =====================================================
// EVENT PROCESSING
// =====================================================

function processEvent(
  minute: number,
  isInjuryTime: boolean,
  eventType: string,
  attackingTeam: 'home' | 'away',
  attackingConfig: SimulationTeamConfig,
  defendingConfig: SimulationTeamConfig,
  attackingStrength: TeamStrength,
  defendingStrength: TeamStrength,
  homeConfig: SimulationTeamConfig,
  awayConfig: SimulationTeamConfig,
  rng: () => number,
  events: MatchEvent[],
  attackStats: TeamMatchStats,
  defendStats: TeamMatchStats,
  playerPerformance: Map<string, { goals: number; assists: number; shots: number; shotsOnTarget: number; chancesCreated: number; passes: number; tackles: number; interceptions: number; saves: number; mistakes: number }>,
  getHomeScore: () => number,
  setHomeScore: (v: number) => void,
  getAwayScore: () => number,
  setAwayScore: (v: number) => void,
  getMomentum: () => number,
  setMomentum: (v: number) => void,
  staminaFactor: number,
  period?: 'firstHalf' | 'secondHalf' | 'extraTimeFirst' | 'extraTimeSecond',
) {
  const attacker = getRandomPlayerByRole(attackingConfig.squad, attackingStrength.playerSlotPositions, ['attacker', 'midfielder'], rng);
  const midfielder = getRandomPlayerByRole(attackingConfig.squad, attackingStrength.playerSlotPositions, ['midfielder'], rng);
  const defender = getRandomPlayerByRole(defendingConfig.squad, defendingStrength.playerSlotPositions, ['defender'], rng);
  const gk = getGoalkeeper(defendingConfig.squad, defendingStrength.playerSlotPositions);

  const base = {
    minute,
    injuryTime: isInjuryTime,
    homeScore: getHomeScore(),
    awayScore: getAwayScore(),
    momentum: getMomentum(),
    homeTeamName: homeConfig.name,
    awayTeamName: awayConfig.name,
    period,
    rng,
  };

  switch (eventType) {
    case 'possession': {
      attackStats.passes += Math.floor(rng() * 3) + 2;
      const perf = playerPerformance.get(midfielder.id);
      if (perf) perf.passes += 2;
      events.push(createMatchEvent({
        ...base,
        type: 'possession',
        team: attackingTeam,
        involvedPlayers: [midfielder.name],
        attackerName: midfielder.name,
      }));
      break;
    }

    case 'buildUp': {
      attackStats.passes += Math.floor(rng() * 4) + 3;
      attackStats.dangerousAttacks++;
      const perf = playerPerformance.get(midfielder.id);
      if (perf) perf.passes += 3;
      events.push(createMatchEvent({
        ...base,
        type: 'buildUp',
        team: attackingTeam,
        involvedPlayers: [midfielder.name],
        attackerName: midfielder.name,
      }));
      break;
    }

    case 'attack': {
      attackStats.passes += Math.floor(rng() * 3) + 2;
      attackStats.dangerousAttacks++;
      events.push(createMatchEvent({
        ...base,
        type: 'attack',
        team: attackingTeam,
        involvedPlayers: [attacker.name],
        attackerName: attacker.name,
        side: getRandomSide(rng),
      }));

      // Follow-up: might lead to a shot
      if (rng() < EVENT_PROBABILITIES.shotFromChance * 0.5) {
        processShot(minute, isInjuryTime, attackingTeam, attacker, midfielder, defender, gk,
          attackingStrength, defendingStrength, homeConfig, awayConfig, rng, events,
          attackStats, defendStats, playerPerformance,
          getHomeScore, setHomeScore, getAwayScore, setAwayScore,
          getMomentum, setMomentum, staminaFactor, 0.7);
      }
      break;
    }

    case 'dangerousAttack': {
      attackStats.dangerousAttacks++;
      attackStats.passes += Math.floor(rng() * 3) + 2;
      const creatorPerf = playerPerformance.get(attacker.id);
      if (creatorPerf) creatorPerf.chancesCreated++;

      events.push(createMatchEvent({
        ...base,
        type: 'dangerousAttack',
        team: attackingTeam,
        involvedPlayers: [attacker.name],
        attackerName: attacker.name,
      }));

      // High chance of shot from dangerous attack
      if (rng() < EVENT_PROBABILITIES.shotFromChance) {
        processShot(minute, isInjuryTime, attackingTeam, attacker, midfielder, defender, gk,
          attackingStrength, defendingStrength, homeConfig, awayConfig, rng, events,
          attackStats, defendStats, playerPerformance,
          getHomeScore, setHomeScore, getAwayScore, setAwayScore,
          getMomentum, setMomentum, staminaFactor, 1.0);
      }
      break;
    }

    case 'counterAttack': {
      attackStats.dangerousAttacks++;
      attackStats.passes += 2;
      events.push(createMatchEvent({
        ...base,
        type: 'counterAttack',
        team: attackingTeam,
        involvedPlayers: [attacker.name],
        attackerName: attacker.name,
      }));

      // Counter attacks have good shot probability
      if (rng() < EVENT_PROBABILITIES.shotFromChance * 0.85) {
        processShot(minute, isInjuryTime, attackingTeam, attacker, midfielder, defender, gk,
          attackingStrength, defendingStrength, homeConfig, awayConfig, rng, events,
          attackStats, defendStats, playerPerformance,
          getHomeScore, setHomeScore, getAwayScore, setAwayScore,
          getMomentum, setMomentum, staminaFactor, 1.1);
      }
      break;
    }

    case 'corner': {
      attackStats.corners++;
      events.push(createMatchEvent({
        ...base,
        type: 'corner',
        team: attackingTeam,
        involvedPlayers: [midfielder.name],
        attackerName: midfielder.name,
      }));

      // Corner might lead to a header/shot
      if (rng() < 0.25) {
        const header = getRandomPlayerByRole(attackingConfig.squad, attackingStrength.playerSlotPositions, ['attacker', 'defender'], rng);
        processShot(minute, isInjuryTime, attackingTeam, header, midfielder, defender, gk,
          attackingStrength, defendingStrength, homeConfig, awayConfig, rng, events,
          attackStats, defendStats, playerPerformance,
          getHomeScore, setHomeScore, getAwayScore, setAwayScore,
          getMomentum, setMomentum, staminaFactor, 0.8);
      }
      break;
    }

    case 'freeKick': {
      events.push(createMatchEvent({
        ...base,
        type: 'freeKick',
        team: attackingTeam,
        involvedPlayers: [attacker.name],
        attackerName: attacker.name,
      }));

      // Free kick might lead to a shot
      if (rng() < 0.30) {
        processShot(minute, isInjuryTime, attackingTeam, attacker, midfielder, defender, gk,
          attackingStrength, defendingStrength, homeConfig, awayConfig, rng, events,
          attackStats, defendStats, playerPerformance,
          getHomeScore, setHomeScore, getAwayScore, setAwayScore,
          getMomentum, setMomentum, staminaFactor, 0.9);
      }
      break;
    }

    case 'interception': {
      const defPerf = playerPerformance.get(defender.id);
      if (defPerf) defPerf.interceptions++;
      defendStats.interceptions++;
      events.push(createMatchEvent({
        ...base,
        type: 'interception',
        team: attackingTeam === 'home' ? 'away' : 'home',
        involvedPlayers: [defender.name],
        attackerName: defender.name,
        defenderName: defender.name,
      }));
      // Small momentum shift to defending team
      const momDir = attackingTeam === 'home' ? -1 : 1;
      setMomentum(getMomentum() + momDir * 3);
      break;
    }

    case 'tackle': {
      const defPerf = playerPerformance.get(defender.id);
      if (defPerf) defPerf.tackles++;
      defendStats.tackles++;
      events.push(createMatchEvent({
        ...base,
        type: 'tackle',
        team: attackingTeam === 'home' ? 'away' : 'home',
        involvedPlayers: [defender.name],
        attackerName: defender.name,
        defenderName: defender.name,
      }));
      break;
    }

    case 'foul': {
      defendStats.fouls++;
      events.push(createMatchEvent({
        ...base,
        type: 'foul',
        team: attackingTeam === 'home' ? 'away' : 'home',
        involvedPlayers: [defender.name],
        attackerName: defender.name,
      }));
      break;
    }

    case 'offside': {
      attackStats.offsides++;
      events.push(createMatchEvent({
        ...base,
        type: 'offside',
        team: attackingTeam,
        involvedPlayers: [attacker.name],
        attackerName: attacker.name,
      }));
      break;
    }

    default: {
      attackStats.passes += 2;
      events.push(createMatchEvent({
        ...base,
        type: 'possession',
        team: attackingTeam,
        involvedPlayers: [midfielder.name],
        attackerName: midfielder.name,
      }));
    }
  }
}

// =====================================================
// SHOT PROCESSING (GOAL PIPELINE)
// =====================================================

function processShot(
  minute: number,
  isInjuryTime: boolean,
  attackingTeam: 'home' | 'away',
  shooter: FootballPlayer,
  assister: FootballPlayer,
  defender: FootballPlayer,
  gk: FootballPlayer | undefined,
  attackingStrength: TeamStrength,
  defendingStrength: TeamStrength,
  homeConfig: SimulationTeamConfig,
  awayConfig: SimulationTeamConfig,
  rng: () => number,
  events: MatchEvent[],
  attackStats: TeamMatchStats,
  defendStats: TeamMatchStats,
  playerPerformance: Map<string, { goals: number; assists: number; shots: number; shotsOnTarget: number; chancesCreated: number; passes: number; tackles: number; interceptions: number; saves: number; mistakes: number }>,
  getHomeScore: () => number,
  setHomeScore: (v: number) => void,
  getAwayScore: () => number,
  setAwayScore: (v: number) => void,
  getMomentum: () => number,
  setMomentum: (v: number) => void,
  staminaFactor: number,
  qualityMultiplier: number,
) {
  attackStats.shots++;
  const shooterPerf = playerPerformance.get(shooter.id);
  if (shooterPerf) shooterPerf.shots++;

  // Get shooter's effective attributes
  const shooterAttrs = attackingStrength.playerAttributes.get(shooter.id);
  const gkAttrs = gk ? defendingStrength.playerAttributes.get(gk.id) : undefined;

  // Determine shot outcome: on target, off target, or blocked
  const shotDist = EVENT_PROBABILITIES.shotOutcome;

  // Modify on-target probability based on finishing
  const finishingBonus = shooterAttrs
    ? (shooterAttrs.finishing - 60) / 200 // +/- 0.15 range
    : 0;
  const adjustedOnTarget = Math.max(0.15, Math.min(0.65, shotDist.onTarget + finishingBonus));

  const shotRoll = rng();

  const base = {
    minute,
    injuryTime: isInjuryTime,
    homeScore: getHomeScore(),
    awayScore: getAwayScore(),
    momentum: getMomentum(),
    homeTeamName: homeConfig.name,
    awayTeamName: awayConfig.name,
    rng,
  };

  if (shotRoll > adjustedOnTarget + shotDist.blocked) {
    // OFF TARGET
    attackStats.shotsOffTarget++;
    events.push(createMatchEvent({
      ...base,
      type: 'shotOffTarget',
      team: attackingTeam,
      involvedPlayers: [shooter.name],
      attackerName: shooter.name,
    }));
    // Missed chance swings momentum
    const momDir = attackingTeam === 'home' ? -1 : 1;
    setMomentum(getMomentum() + momDir * RANDOMNESS_CONFIG.missedChanceMomentumSwing * 0.5);
    return;
  }

  if (shotRoll > adjustedOnTarget) {
    // BLOCKED
    attackStats.blockedShots++;
    const defPerf = playerPerformance.get(defender.id);
    if (defPerf) defPerf.tackles++;
    events.push(createMatchEvent({
      ...base,
      type: 'blockedShot',
      team: attackingTeam,
      involvedPlayers: [shooter.name, defender.name],
      attackerName: shooter.name,
      defenderName: defender.name,
    }));
    return;
  }

  // ON TARGET — now determine save or goal
  attackStats.shotsOnTarget++;
  if (shooterPerf) shooterPerf.shotsOnTarget++;

  // Goal probability pipeline
  const shooterFinishing = shooterAttrs ? shooterAttrs.finishing : 65;
  const shooterShooting = shooterAttrs ? shooterAttrs.shooting : 65;
  const gkAbility = gkAttrs
    ? (gkAttrs.goalkeeping * 0.4 + gkAttrs.reflexes * 0.35 + gkAttrs.handling * 0.25)
    : 55;
  const defPressure = defendingStrength.defense;

  // Chance quality
  const chanceQuality = (
    (shooterFinishing * GOAL_PROBABILITIES.finishingWeight) +
    (shooterShooting * GOAL_PROBABILITIES.shotQualityWeight * qualityMultiplier) +
    (rng() * 20 - 10) // random variance
  ) * staminaFactor;

  // Save ability
  const saveAbility = (
    (gkAbility * GOAL_PROBABILITIES.goalkeeperWeight) +
    (defPressure * GOAL_PROBABILITIES.defensivePressureWeight) +
    (rng() * 16 - 8) // random variance
  );

  // Goal probability via sigmoid
  const diff = (chanceQuality - saveAbility) / 25;
  const goalProb = sigmoid(diff) * GOAL_PROBABILITIES.baseGoalRate / 0.5;
  const clampedGoalProb = Math.max(0.08, Math.min(0.55, goalProb + (rng() * GOAL_PROBABILITIES.randomVariance * 2 - GOAL_PROBABILITIES.randomVariance)));

  const goalRoll = rng();

  if (goalRoll < clampedGoalProb) {
    // GOAL!
    let hs = getHomeScore();
    let as = getAwayScore();
    if (attackingTeam === 'home') { hs++; setHomeScore(hs); }
    else { as++; setAwayScore(as); }

    if (shooterPerf) shooterPerf.goals++;
    const assisterPerf = playerPerformance.get(assister.id);
    if (assisterPerf && assister.id !== shooter.id) assisterPerf.assists++;

    events.push(createMatchEvent({
      ...base,
      type: 'goal',
      team: attackingTeam,
      homeScore: hs,
      awayScore: as,
      involvedPlayers: [shooter.name, assister.name],
      attackerName: shooter.name,
      scorer: shooter.name,
      assister: assister.id !== shooter.id ? assister.name : undefined,
    }));

    // Momentum boost for scoring team
    const momDir = attackingTeam === 'home' ? 1 : -1;
    setMomentum(Math.max(-RANDOMNESS_CONFIG.momentumMax, Math.min(RANDOMNESS_CONFIG.momentumMax,
      getMomentum() + momDir * RANDOMNESS_CONFIG.goalMomentumBoost
    )));

    // Check total goals limit
    if (getHomeScore() + getAwayScore() >= MATCH_EVENT_LIMITS.maxTotalGoals) {
      return; // Stop generating goals
    }
  } else {
    // SAVE!
    defendStats.saves++;
    const gkPerf = gk ? playerPerformance.get(gk.id) : undefined;
    if (gkPerf) gkPerf.saves++;

    events.push(createMatchEvent({
      ...base,
      type: 'save',
      team: attackingTeam,
      involvedPlayers: [shooter.name, gk?.name || 'Kiper'],
      attackerName: shooter.name,
      gkName: gk?.name || 'Kiper',
    }));

    // Missed chance momentum swing
    const momDir = attackingTeam === 'home' ? -1 : 1;
    setMomentum(getMomentum() + momDir * RANDOMNESS_CONFIG.missedChanceMomentumSwing);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculatePossession(
  homeStrength: TeamStrength,
  awayStrength: TeamStrength,
  matchup: { homeAdvantage: number; awayAdvantage: number },
  rng: () => number,
): number {
  const midDiff = homeStrength.midfield - awayStrength.midfield;
  const tacticPoss = (homeStrength.tacticEffect.possessionModifier - awayStrength.tacticEffect.possessionModifier);
  const matchupEffect = (matchup.homeAdvantage - matchup.awayAdvantage) * 0.3;

  // Base possession influenced by midfield strength, tactics, and matchup
  const rawPossession = 0.50 + (midDiff / 200) + (tacticPoss / 200) + (matchupEffect / 200);

  // Add upset factor to reduce determinism
  const upsetNoise = (rng() - 0.5) * RANDOMNESS_CONFIG.upsetFactor * 0.2;

  // Clamp between 30% and 70%
  return Math.max(0.30, Math.min(0.70, rawPossession + upsetNoise));
}

function createEmptyStats(): TeamMatchStats {
  return {
    possession: 0,
    shots: 0,
    shotsOnTarget: 0,
    shotsOffTarget: 0,
    blockedShots: 0,
    corners: 0,
    dangerousAttacks: 0,
    passes: 0,
    passAccuracy: 0,
    saves: 0,
    fouls: 0,
    offsides: 0,
    interceptions: 0,
    tackles: 0,
  };
}

function buildDebugInfo(
  homeStrength: TeamStrength,
  awayStrength: TeamStrength,
  possessionHome: number,
  matchup: { homeAdvantage: number; awayAdvantage: number },
): MatchDebugInfo {
  return {
    homeAttackStrength: homeStrength.attack,
    homeMidfieldStrength: homeStrength.midfield,
    homeDefenseStrength: homeStrength.defense,
    homeGkStrength: homeStrength.goalkeeper,
    awayAttackStrength: awayStrength.attack,
    awayMidfieldStrength: awayStrength.midfield,
    awayDefenseStrength: awayStrength.defense,
    awayGkStrength: awayStrength.goalkeeper,
    homeTacticalModifier: matchup.homeAdvantage,
    awayTacticalModifier: matchup.awayAdvantage,
    possessionProbabilityHome: possessionHome,
    chanceCreationHome: homeStrength.attack * 0.8,
    chanceCreationAway: awayStrength.attack * 0.8,
    goalProbabilityHome: 0, // Computed per shot
    goalProbabilityAway: 0,
  };
}
