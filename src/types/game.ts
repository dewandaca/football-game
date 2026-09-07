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
  gameStatus: 'setup' | 'loading' | 'drafting' | 'simulation' | 'completed';
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

  setHydrated: (val: boolean) => void;
  initializeDraft: (p1Name: string, p2Name: string, budget: number, pairs: DraftPair[]) => void;
  placeBid: (playerKey: 'player1' | 'player2', amount: number) => boolean;
  surrenderAuction: (playerKey: 'player1' | 'player2') => void;
  choosePlayer: (chosenPlayerId: string) => void;
  startMatchSimulation: () => void;
  resetDraft: () => void;
}

export const FORMATION_433_POSITIONS = [
  'GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'ST', 'LW',
] as const;

export type FormationPosition = (typeof FORMATION_433_POSITIONS)[number];
