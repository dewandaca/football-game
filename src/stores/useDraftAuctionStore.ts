import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  BidLogEntry,
  DraftAuctionState,
  DraftPair,
  FootballPlayer,
  FormationId,
  TacticalSetup,
  PlayerSlotAssignment,
  MatchResult,
  DEFAULT_TACTICS,
} from '@/types/game';

const defaultPlayer = {
  name: '',
  budgetRemaining: 0,
  squad: [] as FootballPlayer[],
};

const defaultState = {
  hasHydrated: false,
  gameStatus: 'setup' as const,
  initialBudget: 50000,
  player1: { ...defaultPlayer },
  player2: { ...defaultPlayer },
  startingTurn: 'player1' as const,
  currentTurn: 'player1' as const,
  currentRoundIndex: 0,
  draftPairs: [] as DraftPair[],
  currentHighestBid: 0,
  currentHighestBidder: null as 'player1' | 'player2' | null,
  bidHistory: [] as BidLogEntry[],
  lastRoundWinnerMessage: null as string | null,
  bankruptPlayer: null as 'player1' | 'player2' | null,

  // Pre-match setup state
  formation1: '4-3-3' as FormationId,
  formation2: '4-3-3' as FormationId,
  tactics1: { ...DEFAULT_TACTICS } as TacticalSetup,
  tactics2: { ...DEFAULT_TACTICS } as TacticalSetup,
  playerAssignment1: [] as PlayerSlotAssignment[],
  playerAssignment2: [] as PlayerSlotAssignment[],

  // Match result
  matchResult: null as MatchResult | null,
};

export const useDraftAuctionStore = create<DraftAuctionState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setHydrated: (val: boolean) => set({ hasHydrated: val }),

      initializeDraft: (
        p1Name: string,
        p2Name: string,
        budget: number,
        pairs: DraftPair[]
      ) => {
        const initialBasePrice = pairs.length > 0 ? pairs[0].playerA.price : 0;
        set({
          gameStatus: 'drafting',
          initialBudget: budget,
          player1: { name: p1Name, budgetRemaining: budget, squad: [] },
          player2: { name: p2Name, budgetRemaining: budget, squad: [] },
          startingTurn: 'player1',
          currentTurn: 'player1',
          currentRoundIndex: 0,
          draftPairs: pairs,
          currentHighestBid: initialBasePrice,
          currentHighestBidder: null,
          bidHistory: [],
          lastRoundWinnerMessage: null,
          bankruptPlayer: null,
          formation1: '4-3-3',
          formation2: '4-3-3',
          tactics1: { ...DEFAULT_TACTICS },
          tactics2: { ...DEFAULT_TACTICS },
          playerAssignment1: [],
          playerAssignment2: [],
          matchResult: null,
        });
      },

      placeBid: (playerKey: 'player1' | 'player2', amount: number) => {
        const {
          currentTurn,
          currentHighestBid,
          currentHighestBidder,
          player1,
          player2,
          draftPairs,
          currentRoundIndex,
          bidHistory,
        } = get();

        if (currentTurn !== playerKey) return false;

        const activePlayer = playerKey === 'player1' ? player1 : player2;
        const currentPair = draftPairs[currentRoundIndex];
        if (!currentPair) return false;

        // Minimum required bid:
        // If no one bid yet, bid must be >= open base price (playerA.price)
        // If someone already bid, bid must be strictly greater than currentHighestBid (> currentHighestBid)
        const minRequiredBid =
          currentHighestBidder === null ? currentPair.playerA.price : currentHighestBid + 1;

        if (amount < minRequiredBid) return false;
        if (amount > activePlayer.budgetRemaining) return false;

        const nextTurn = playerKey === 'player1' ? 'player2' : 'player1';
        const newLogEntry: BidLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          playerKey,
          playerName: activePlayer.name,
          amount,
          type: 'bid',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };

        set({
          currentHighestBid: amount,
          currentHighestBidder: playerKey,
          currentTurn: nextTurn,
          bidHistory: [newLogEntry, ...bidHistory],
        });

        return true;
      },

      surrenderAuction: (playerKey: 'player1' | 'player2') => {
        const {
          currentHighestBid,
          currentHighestBidder,
          player1,
          player2,
          draftPairs,
          currentRoundIndex,
          startingTurn,
          bidHistory,
        } = get();

        const currentPair = draftPairs[currentRoundIndex];
        if (!currentPair) return;

        const winnerKey = playerKey === 'player1' ? 'player2' : 'player1';
        const winner = winnerKey === 'player1' ? player1 : player2;
        const loser = playerKey === 'player1' ? player1 : player2;

        const winningPrice = currentHighestBidder === winnerKey ? currentHighestBid : currentPair.playerA.price;
        const losingPrice = Math.min(loser.budgetRemaining, currentPair.playerB.price);

        const updatedWinnerSquad = [...winner.squad, currentPair.playerA];
        const updatedLoserSquad = [...loser.squad, currentPair.playerB];

        const updatedPlayer1 =
          winnerKey === 'player1'
            ? { ...player1, budgetRemaining: Math.max(0, player1.budgetRemaining - winningPrice), squad: updatedWinnerSquad }
            : { ...player1, budgetRemaining: Math.max(0, player1.budgetRemaining - losingPrice), squad: updatedLoserSquad };

        const updatedPlayer2 =
          winnerKey === 'player2'
            ? { ...player2, budgetRemaining: Math.max(0, player2.budgetRemaining - winningPrice), squad: updatedWinnerSquad }
            : { ...player2, budgetRemaining: Math.max(0, player2.budgetRemaining - losingPrice), squad: updatedLoserSquad };

        const isLastRound = currentRoundIndex >= draftPairs.length - 1;

        // Bankruptcy check:
        let bankruptKey: 'player1' | 'player2' | null = null;

        if (updatedPlayer1.budgetRemaining <= 0 && updatedPlayer1.squad.length < draftPairs.length) {
          bankruptKey = 'player1';
        } else if (updatedPlayer2.budgetRemaining <= 0 && updatedPlayer2.squad.length < draftPairs.length) {
          bankruptKey = 'player2';
        }

        const nextRoundIndex = isLastRound ? currentRoundIndex : currentRoundIndex + 1;
        const nextStartingTurn = startingTurn === 'player1' ? 'player2' : 'player1';
        const nextPair = draftPairs[nextRoundIndex];
        const nextBasePrice = nextPair ? nextPair.playerA.price : 0;

        const msg = `🏆 ${winner.name} memenangkan ${currentPair.playerA.name} seharga Rp ${winningPrice.toLocaleString('id-ID')}! ${loser.name} mendapatkan ${currentPair.playerB.name}.`;

        const newLogEntry: BidLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          playerKey,
          playerName: loser.name,
          amount: 0,
          type: 'pass',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };

        if (bankruptKey) {
          // Trigger Bankruptcy Game Over immediately
          set({
            player1: updatedPlayer1,
            player2: updatedPlayer2,
            bankruptPlayer: bankruptKey,
            bidHistory: [newLogEntry, ...bidHistory],
            lastRoundWinnerMessage: msg,
            gameStatus: 'completed',
          });
          return;
        }

        // Standard round advancement — go to prematch when last round done
        set({
          player1: updatedPlayer1,
          player2: updatedPlayer2,
          currentRoundIndex: nextRoundIndex,
          startingTurn: isLastRound ? startingTurn : nextStartingTurn,
          currentTurn: isLastRound ? startingTurn : nextStartingTurn,
          currentHighestBid: nextBasePrice,
          currentHighestBidder: null,
          bidHistory: [newLogEntry, ...bidHistory],
          lastRoundWinnerMessage: msg,
          gameStatus: isLastRound ? 'prematch' : 'drafting',
        });
      },

      choosePlayer: (chosenPlayerId: string) => {
        const { currentTurn, currentRoundIndex, draftPairs, player1, player2 } = get();

        const currentPair = draftPairs[currentRoundIndex];
        if (!currentPair) return;

        const chosen =
          currentPair.playerA.id === chosenPlayerId
            ? currentPair.playerA
            : currentPair.playerB;

        const isLastRound = currentRoundIndex >= draftPairs.length - 1;
        const nextTurn = currentTurn === 'player1' ? 'player2' : 'player1';

        if (currentTurn === 'player1') {
          set({
            player1: {
              ...player1,
              budgetRemaining: Math.max(0, player1.budgetRemaining - chosen.price),
              squad: [...player1.squad, chosen],
            },
            currentTurn: nextTurn,
            currentRoundIndex: isLastRound ? currentRoundIndex : currentRoundIndex + 1,
            gameStatus: isLastRound ? 'prematch' : 'drafting',
          });
        } else {
          set({
            player2: {
              ...player2,
              budgetRemaining: Math.max(0, player2.budgetRemaining - chosen.price),
              squad: [...player2.squad, chosen],
            },
            currentTurn: nextTurn,
            currentRoundIndex: isLastRound ? currentRoundIndex : currentRoundIndex + 1,
            gameStatus: isLastRound ? 'prematch' : 'drafting',
          });
        }
      },

      goToPreMatch: () => {
        set({ gameStatus: 'prematch', matchResult: null });
      },

      setFormation: (playerKey: 'player1' | 'player2', formation: FormationId) => {
        if (playerKey === 'player1') set({ formation1: formation });
        else set({ formation2: formation });
      },

      setTactics: (playerKey: 'player1' | 'player2', tactics: Partial<TacticalSetup>) => {
        if (playerKey === 'player1') {
          set({ tactics1: { ...get().tactics1, ...tactics } });
        } else {
          set({ tactics2: { ...get().tactics2, ...tactics } });
        }
      },

      setPlayerAssignment: (playerKey: 'player1' | 'player2', assignments: PlayerSlotAssignment[]) => {
        if (playerKey === 'player1') set({ playerAssignment1: assignments });
        else set({ playerAssignment2: assignments });
      },

      startMatchSimulation: () => {
        set({ gameStatus: 'simulation' });
      },

      setMatchResult: (result: MatchResult) => {
        set({ matchResult: result });
      },

      resetDraft: () =>
        set({
          ...defaultState,
          hasHydrated: true,
        }),
    }),
    {
      name: 'draft-auction-game',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
