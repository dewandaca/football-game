import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FamilySurveyState, SurveyAnswer, PlayerInfo } from '@/types/game';
import { fuzzyMatch, generateId } from '@/lib/utils';

const MAX_STRIKES = 3;

const defaultPlayers: [PlayerInfo, PlayerInfo] = [
  { name: 'Pemain 1', strikes: 0, score: 0 },
  { name: 'Pemain 2', strikes: 0, score: 0 },
];

const defaultState = {
  hasHydrated: false,
  gameStatus: 'idle' as const,
  mode: '2player' as '1player' | '2player',
  question: '',
  sourceType: 'ai_generated' as const,
  answers: [] as SurveyAnswer[],
  totalScore: 0,
  maxStrikes: MAX_STRIKES,
  players: defaultPlayers as [PlayerInfo, PlayerInfo],
  currentPlayerIndex: 0 as 0 | 1,
};

/**
 * Handles wrong-answer turn logic.
 * In 1-player mode: no switching, just add a strike.
 * In 2-player mode: switch turns, handle elimination.
 */
function computeWrongResult(
  players: [PlayerInfo, PlayerInfo],
  currentPlayerIndex: 0 | 1,
  maxStrikes: number,
  mode: '1player' | '2player'
): {
  newPlayers: [PlayerInfo, PlayerInfo];
  nextPlayerIndex: 0 | 1;
  gameOver: boolean;
} {
  const newPlayers: [PlayerInfo, PlayerInfo] = [{ ...players[0] }, { ...players[1] }];
  newPlayers[currentPlayerIndex] = {
    ...newPlayers[currentPlayerIndex],
    strikes: newPlayers[currentPlayerIndex].strikes + 1,
  };

  if (mode === '1player') {
    const gameOver = newPlayers[0].strikes >= maxStrikes;
    return { newPlayers, nextPlayerIndex: 0, gameOver };
  }

  // 2-player: switch turns, handle elimination
  const otherIndex: 0 | 1 = currentPlayerIndex === 0 ? 1 : 0;
  const currentOut = newPlayers[currentPlayerIndex].strikes >= maxStrikes;
  const otherOut = newPlayers[otherIndex].strikes >= maxStrikes;

  if (currentOut && otherOut) {
    return { newPlayers, nextPlayerIndex: otherIndex, gameOver: true };
  } else if (currentOut) {
    return { newPlayers, nextPlayerIndex: otherIndex, gameOver: false };
  } else if (otherOut) {
    return { newPlayers, nextPlayerIndex: currentPlayerIndex, gameOver: false };
  } else {
    return { newPlayers, nextPlayerIndex: otherIndex, gameOver: false };
  }
}

export const useFamilySurveyStore = create<FamilySurveyState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setHydrated: (val: boolean) => set({ hasHydrated: val }),

      startNewGame: (question, answers, sourceType, player1Name, player2Name, mode) => {
        const withIds: SurveyAnswer[] = answers.map((a) => ({
          ...a,
          id: generateId(),
          isRevealed: false,
        }));
        set({
          gameStatus: 'playing',
          mode,
          question,
          sourceType,
          answers: withIds,
          totalScore: 0,
          maxStrikes: MAX_STRIKES,
          players: [
            { name: player1Name?.trim() || 'Pemain 1', strikes: 0, score: 0 },
            { name: player2Name?.trim() || 'Pemain 2', strikes: 0, score: 0 },
          ],
          currentPlayerIndex: 0,
        });
      },

      submitGuess: (guess: string) => {
        const { answers, players, currentPlayerIndex, maxStrikes, mode } = get();

        const matchIndex = answers.findIndex(
          (a) => !a.isRevealed && fuzzyMatch(guess, a.answer, a.aliases)
        );

        if (matchIndex !== -1) {
          // Correct — add points to current player's individual score
          const matched = answers[matchIndex];
          const newAnswers = answers.map((a, i) =>
            i === matchIndex ? { ...a, isRevealed: true } : a
          );
          const newScore = get().totalScore + matched.points;
          const allRevealed = newAnswers.every((a) => a.isRevealed);

          const newPlayers: [PlayerInfo, PlayerInfo] = [{ ...players[0] }, { ...players[1] }];
          newPlayers[currentPlayerIndex] = {
            ...newPlayers[currentPlayerIndex],
            score: newPlayers[currentPlayerIndex].score + matched.points,
          };

          set({
            answers: newAnswers,
            totalScore: newScore,
            players: newPlayers,
            // Correct answer → keep same player's turn (no switch)
            gameStatus: allRevealed ? 'completed' : 'playing',
          });

          return { matched: true, points: matched.points };
        } else {
          // Wrong — add strike, maybe switch
          const { newPlayers, nextPlayerIndex, gameOver } = computeWrongResult(
            players,
            currentPlayerIndex,
            maxStrikes,
            mode
          );

          set({
            players: newPlayers,
            currentPlayerIndex: nextPlayerIndex,
            gameStatus: gameOver ? 'completed' : 'playing',
          });

          return { matched: false, points: 0 };
        }
      },

      timeOut: () => {
        const { players, currentPlayerIndex, maxStrikes, gameStatus, mode } = get();
        if (gameStatus !== 'playing') return;

        const { newPlayers, nextPlayerIndex, gameOver } = computeWrongResult(
          players,
          currentPlayerIndex,
          maxStrikes,
          mode
        );

        set({
          players: newPlayers,
          currentPlayerIndex: nextPlayerIndex,
          gameStatus: gameOver ? 'completed' : 'playing',
        });
      },

      resetGame: () => set({ ...defaultState, hasHydrated: true }),
    }),
    {
      name: 'family-survey-game',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
