'use client';

import { useState, useEffect } from 'react';
import { GameState, PlayerName, PowerUpUsage } from '@/types';
import { calculateMatch, initializeGameState, removeMatch } from '@/lib/streakEngine';
import { loadGameState, saveGameState, clearGameState } from '@/lib/storage';
import PlayerCard from '@/components/PlayerCard';
import MatchInputModal from '@/components/MatchInputModal';
import MatchHistory from '@/components/MatchHistory';
import { Plus, History, Settings, Trophy, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load game state on mount
  useEffect(() => {
    const loaded = loadGameState();
    setGameState(loaded);
  }, []);

  // Save game state on every change
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  const handleNewMatch = (data: {
    winner: PlayerName;
    winCondition: 'normal' | 'blackBall';
    opponentBallsRemaining: number;
    powerUpsUsed: {
      jesse?: PowerUpUsage;
      flip?: PowerUpUsage;
    };
    jesseOwnBalls: number;
    flipOwnBalls: number;
  }) => {
    if (!gameState) return;

    try {
      const result = calculateMatch({
        gameState,
        winner: data.winner,
        winCondition: data.winCondition,
        opponentBallsRemaining: data.opponentBallsRemaining,
        powerUpsUsed: data.powerUpsUsed,
        jesseOwnBalls: data.jesseOwnBalls,
        flipOwnBalls: data.flipOwnBalls,
      });

      setGameState(result.newGameState);
      setIsModalOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleRemoveMatch = (matchId: string) => {
    if (!gameState) return;

    try {
      const newState = removeMatch(gameState, matchId);
      setGameState(newState);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleReset = () => {
    if (confirm('Weet je zeker dat je alle data wilt resetten? Dit kan niet ongedaan gemaakt worden.')) {
      clearGameState();
      const newState = initializeGameState();
      setGameState(newState);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  const currentMonthMatches = gameState.matches.filter(m => m.month === gameState.currentMonth);
  const jesseWinning = gameState.jesse.monthlyTotal > gameState.flip.monthlyTotal;
  const flipWinning = gameState.flip.monthlyTotal > gameState.jesse.monthlyTotal;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-poolGreen p-4 pb-24">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-black text-white">Pool Competitie</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3 rounded-xl transition-colors ${
                showHistory ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              <History className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-xl transition-colors ${
                showSettings ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Maand info */}
        <div className="text-center text-gray-400 text-sm">
          {new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
          <span className="mx-2">•</span>
          {currentMonthMatches.length} {currentMonthMatches.length === 1 ? 'potje' : 'potjes'}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-6 bg-gray-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Instellingen</h2>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Alles Resetten
          </button>
        </motion.div>
      )}

      {/* Player Cards */}
      {!showHistory && (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-6">
          <PlayerCard player={gameState.jesse} isWinning={jesseWinning} />
          <PlayerCard player={gameState.flip} isWinning={flipWinning} />
        </div>
      )}

      {/* Match History */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Geschiedenis</h2>
          <MatchHistory 
            matches={currentMonthMatches} 
            onRemoveMatch={handleRemoveMatch}
          />
        </motion.div>
      )}

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-green-500/50 transition-shadow"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      {/* Match Input Modal */}
      <MatchInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewMatch}
        gameState={gameState}
      />
    </main>
  );
}
