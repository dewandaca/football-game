// Shared TypeScript interfaces for Football AI Mini-Games

export interface SurveyAnswer {
  id: string;
  answer: string;
  aliases: string[]; // For tolerant string matching (e.g., ["CR7", "Ronaldo"])
  points: number;
  isRevealed: boolean;
}

export interface PlayerInfo {
  name: string;
  strikes: number;
  score: number; // individual points contributed this game
}

export interface FamilySurveyState {
  hasHydrated: boolean;
  gameStatus: 'idle' | 'loading' | 'playing' | 'completed';
  mode: '1player' | '2player';
  question: string;
  sourceType: 'ai_generated' | 'custom_input';
  answers: SurveyAnswer[];
  totalScore: number;
  maxStrikes: number; // per player
  players: [PlayerInfo, PlayerInfo];
  currentPlayerIndex: 0 | 1;

  // Actions
  setHydrated: (val: boolean) => void;
  startNewGame: (
    question: string,
    answers: SurveyAnswer[],
    sourceType: 'ai_generated' | 'custom_input',
    player1Name: string,
    player2Name: string,
    mode: '1player' | '2player'
  ) => void;
  submitGuess: (guess: string) => { matched: boolean; points: number };
  timeOut: () => void;
  resetGame: () => void;
}

export interface FootballPlayer {
  id: string;
  name: string;
  position: string;
  club: string;
  rating: number;
  price: number;
}

export interface DraftPair {
  round: number;
  position: string;
  playerA: FootballPlayer;
  playerB: FootballPlayer;
}

export interface PlayerState {
  name: string;
  budgetRemaining: number;
  squad: FootballPlayer[];
}

export interface BidLogEntry {
  id: string;
  playerKey: 'player1' | 'player2';
  playerName: string;
  amount: number;
  type: 'bid' | 'pass';
  timestamp: string;
}

export interface DraftAuctionState {
  hasHydrated: boolean;
  gameStatus: 'setup' | 'loading' | 'drafting' | 'prematch' | 'simulation' | 'completed';
  initialBudget: number;
  player1: PlayerState;
  player2: PlayerState;
  startingTurn: 'player1' | 'player2';
  currentTurn: 'player1' | 'player2';
  currentRoundIndex: number;
  draftPairs: DraftPair[];

  // Auction live state
  currentHighestBid: number;
  currentHighestBidder: 'player1' | 'player2' | null;
  bidHistory: BidLogEntry[];
  lastRoundWinnerMessage: string | null;
  bankruptPlayer: 'player1' | 'player2' | null;

  // Pre-match setup state
  formation1: FormationId;
  formation2: FormationId;
  tactics1: TacticalSetup;
  tactics2: TacticalSetup;
  playerAssignment1: PlayerSlotAssignment[];
  playerAssignment2: PlayerSlotAssignment[];

  // Match result
  matchResult: MatchResult | null;

  setHydrated: (val: boolean) => void;
  initializeDraft: (p1Name: string, p2Name: string, budget: number, pairs: DraftPair[]) => void;
  placeBid: (playerKey: 'player1' | 'player2', amount: number) => boolean;
  surrenderAuction: (playerKey: 'player1' | 'player2') => void;
  choosePlayer: (chosenPlayerId: string) => void;
  goToPreMatch: () => void;
  setFormation: (playerKey: 'player1' | 'player2', formation: FormationId) => void;
  setTactics: (playerKey: 'player1' | 'player2', tactics: Partial<TacticalSetup>) => void;
  setPlayerAssignment: (playerKey: 'player1' | 'player2', assignments: PlayerSlotAssignment[]) => void;
  startMatchSimulation: () => void;
  setMatchResult: (result: MatchResult) => void;
  resetDraft: () => void;
}

export const FORMATION_433_POSITIONS = [
  'GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'ST', 'LW',
] as const;

export type FormationPosition = (typeof FORMATION_433_POSITIONS)[number];

// =====================================================
// MATCH SIMULATION TYPES
// =====================================================

/** Granular player attributes derived from rating + position */
export interface PlayerAttributes {
  finishing: number;
  shooting: number;
  attacking: number;
  pace: number;
  passing: number;
  creativity: number;
  ballControl: number;
  stamina: number;
  defending: number;
  tackling: number;
  positioning: number;
  goalkeeping: number;
  reflexes: number;
  handling: number;
}

/** All supported formation IDs */
export type FormationId =
  | '4-3-3'
  | '4-4-2'
  | '4-2-3-1'
  | '3-5-2'
  | '3-4-3'
  | '5-3-2'
  | '5-4-1'
  | '4-5-1';

/** A single slot in a formation */
export interface FormationSlot {
  position: string; // GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF, LM, RM
  x: number; // 0-100 pitch x-coordinate (left to right)
  y: number; // 0-100 pitch y-coordinate (goal to goal, 0 = own goal, 100 = opponent goal)
  role: 'goalkeeper' | 'defender' | 'midfielder' | 'attacker';
}

/** Formation definition with slots and modifiers */
export interface FormationDefinition {
  id: FormationId;
  name: string;
  slots: FormationSlot[];
  modifiers: {
    attack: number;
    midfield: number;
    defense: number;
    width: number;
    counterVulnerability: number;
  };
}

/** Tactic options */
export type Mentality = 'defensive' | 'balanced' | 'attacking';
export type PassingStyle = 'short' | 'mixed' | 'direct';
export type Tempo = 'slow' | 'normal' | 'fast';
export type Pressing = 'low' | 'medium' | 'high';
export type DefensiveLine = 'deep' | 'normal' | 'high';
export type AttackingFocus = 'left' | 'center' | 'right' | 'mixed';

/** Full tactical setup for a team */
export interface TacticalSetup {
  mentality: Mentality;
  passingStyle: PassingStyle;
  tempo: Tempo;
  pressing: Pressing;
  defensiveLine: DefensiveLine;
  attackingFocus: AttackingFocus;
  counterAttack: boolean;
}

/** Player assigned to a specific formation slot */
export interface PlayerSlotAssignment {
  playerId: string;
  slotIndex: number; // index into FormationDefinition.slots
}

/** Match event types (no cards, no injuries) */
export type MatchEventType =
  | 'kickoff'
  | 'halftime'
  | 'secondHalfStart'
  | 'fulltime'
  | 'extraTimeFirstHalfStart'
  | 'extraTimeHalftime'
  | 'extraTimeSecondHalfStart'
  | 'extraTimeFulltime'
  | 'penaltyShootoutStart'
  | 'penaltyKick'
  | 'penaltyShootoutEnd'
  | 'possession'
  | 'buildUp'
  | 'pass'
  | 'attack'
  | 'counterAttack'
  | 'dangerousAttack'
  | 'chanceCreation'
  | 'shot'
  | 'shotOnTarget'
  | 'shotOffTarget'
  | 'blockedShot'
  | 'save'
  | 'goal'
  | 'corner'
  | 'freeKick'
  | 'offside'
  | 'interception'
  | 'tackle'
  | 'foul';

/** A single penalty kick outcome in a shootout */
export interface PenaltyKickRecord {
  team: 'home' | 'away';
  round: number;
  kickerName: string;
  outcome: 'goal' | 'save' | 'miss';
  homeScoreAfter: number;
  awayScoreAfter: number;
}

/** A single match event */
export interface MatchEvent {
  id: string;
  minute: number;
  injuryTime: boolean;
  type: MatchEventType;
  team: 'home' | 'away' | 'neutral';
  commentary: string;
  involvedPlayers: string[]; // player names involved
  scorer?: string; // player name who scored (for goal events)
  assister?: string; // player name who assisted (for goal events)
  homeScore: number;
  awayScore: number;
  momentum: number; // -100 to +100, negative = away momentum, positive = home momentum
  penaltyTaker?: string;
  penaltyOutcome?: 'goal' | 'save' | 'miss';
  penaltyRound?: number;
  homePenalties?: number;
  awayPenalties?: number;
  period?: 'firstHalf' | 'secondHalf' | 'extraTimeFirst' | 'extraTimeSecond' | 'penalties';
}

/** Match statistics for one team */
export interface TeamMatchStats {
  possession: number; // percentage
  shots: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  blockedShots: number;
  corners: number;
  dangerousAttacks: number;
  passes: number;
  passAccuracy: number; // percentage
  saves: number;
  fouls: number;
  offsides: number;
  interceptions: number;
  tackles: number;
}

/** Player performance in a match */
export interface PlayerMatchPerformance {
  playerId: string;
  playerName: string;
  position: string; // position played (from formation slot)
  naturalPosition: string; // player's natural position
  rating: number; // 6.0 - 10.0
  goals: number;
  assists: number;
  shotsTotal: number;
  shotsOnTarget: number;
  chancesCreated: number;
  passesCompleted: number;
  tackles: number;
  interceptions: number;
  saves: number;
  isMotm: boolean;
}

/** Full match result */
export interface MatchResult {
  seed: number;
  homeTeamName: string;
  awayTeamName: string;
  homeFormation: FormationId;
  awayFormation: FormationId;
  homeTactics: TacticalSetup;
  awayTactics: TacticalSetup;
  homeScore: number;
  awayScore: number;
  winnerTeam: 'home' | 'away'; // No draws — winner determined in 90m, ET, or Penalties
  wentToExtraTime?: boolean;
  wentToPenalties?: boolean;
  homePenalties?: number;
  awayPenalties?: number;
  penaltyShootout?: PenaltyKickRecord[];
  events: MatchEvent[];
  homeStats: TeamMatchStats;
  awayStats: TeamMatchStats;
  homePlayerPerformances: PlayerMatchPerformance[];
  awayPlayerPerformances: PlayerMatchPerformance[];
  motm: PlayerMatchPerformance | null;
  // Debug info
  debug?: MatchDebugInfo;
}

/** Debug information for tuning */
export interface MatchDebugInfo {
  homeAttackStrength: number;
  homeMidfieldStrength: number;
  homeDefenseStrength: number;
  homeGkStrength: number;
  awayAttackStrength: number;
  awayMidfieldStrength: number;
  awayDefenseStrength: number;
  awayGkStrength: number;
  homeTacticalModifier: number;
  awayTacticalModifier: number;
  possessionProbabilityHome: number;
  chanceCreationHome: number;
  chanceCreationAway: number;
  goalProbabilityHome: number;
  goalProbabilityAway: number;
}

/** Team config for simulation input */
export interface SimulationTeamConfig {
  name: string;
  squad: FootballPlayer[];
  formation: FormationId;
  tactics: TacticalSetup;
  assignments: PlayerSlotAssignment[];
}

/** Default tactical setup */
export const DEFAULT_TACTICS: TacticalSetup = {
  mentality: 'balanced',
  passingStyle: 'mixed',
  tempo: 'normal',
  pressing: 'medium',
  defensiveLine: 'normal',
  attackingFocus: 'mixed',
  counterAttack: false,
};
