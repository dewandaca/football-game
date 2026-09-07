'use client';

import { useEffect, useState } from 'react';
import { useFamilySurveyStore } from '@/stores/useFamilySurveyStore';
import QuestionSetupModal from '@/components/survey/QuestionSetupModal';
import AnswerBoard from '@/components/survey/AnswerBoard';
import { SurveyAnswer } from '@/types/game';
import { motion } from 'framer-motion';

export default function FamilySurveyPage() {
  const [mounted, setMounted] = useState(false);
  const game = useFamilySurveyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-500 text-sm"
        >
          Loading pitch...
        </motion.div>
      </div>
    );
  }

  const handleStart = (
    question: string,
    answers: SurveyAnswer[],
    sourceType: 'ai_generated' | 'custom_input',
    player1Name: string,
    player2Name: string,
    mode: '1player' | '2player'
  ) => {
    game.startNewGame(question, answers, sourceType, player1Name, player2Name, mode);
  };

  if (game.gameStatus === 'idle') {
    return <QuestionSetupModal onStart={handleStart} />;
  }

  return <AnswerBoard game={game} />;
}
