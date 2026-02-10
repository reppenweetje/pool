'use client';

import { useState, useEffect } from 'react';
import { GameState, PlayerName, PowerUpUsage } from '@/types';
import { removeMatch, initializeGameState } from '@/lib/streakEngine';
import PlayerCard from '@/components/PlayerCard';
import MatchInputModal from '@/components/MatchInputModal';
import MatchHistory from '@/components/MatchHistory';
import LiveGameMode from '@/components/LiveGameMode';
import { Plus, History, Settings, Trophy, RotateCcw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load game state from database
  useEffect(() => {
    fetchGameState();
  }, []);

  const fetchGameState = async () => {
    try {
      const res = await fetch('/api/game-state');
      
      // Check if request was successful
      if (!res.ok) {
        throw new Error('Database not available');
      }
      
      const data = await res.json();
      
      // Check if data has error
      if (data.error) {
        throw new Error(data.error);
      }
      
      setGameState(data);
    } catch (error) {
      console.error('Database not available, using local storage:', error);
      
      // Fallback to local storage
      const { loadGameState } = await import('@/lib/storage');
      const localState = loadGameState();
      setGameState(localState);
    } finally {
      setLoading(false);
    }
  };

  // Save to local storage on every state change (backup)
  useEffect(() => {
    if (gameState) {
      import('@/lib/storage').then(({ saveGameState }) => {
        saveGameState(gameState);
      });
    }
  }, [gameState]);

  // Refresh game state periodically (elke 5 seconden als niet in live mode)
  useEffect(() => {
    if (isLiveMode) return; // Geen refresh tijdens live mode

    const interval = setInterval(() => {
      fetchGameState();
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const handleNewMatch = async (data: {
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
      // Try database first
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Database not available');

      const newState = await res.json();
      setGameState(newState);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Database error, using local calculation:', error);
      
      // Fallback to local calculation
      const { calculateMatch } = await import('@/lib/streakEngine');
      const { saveGameState } = await import('@/lib/storage');
      
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
      saveGameState(result.newGameState);
      setIsModalOpen(false);
    }
  };

  const handleLiveGameFinish = async (winner: PlayerName, jesseBalls: number, flipBalls: number) => {
    // Fetch live game voor toep stake
    try {
      const liveRes = await fetch('/api/live-game');
      const liveGame = await liveRes.json();

      const toepStake = liveGame?.currentToepStake || 1;
      const loser: PlayerName = winner === 'Jesse' ? 'Flip' : 'Jesse';
      const opponentBalls = winner === 'Jesse' ? flipBalls : jesseBalls;

      // Als toep geweigerd werd, gebruik stake 1, anders gebruik de toep stake
      const actualStake = liveGame?.toepResponse === 'rejected' ? 1 : toepStake;

      // Save match via API met toep multiplier
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner,
          winCondition: 'normal',
          opponentBallsRemaining: opponentBalls,
          powerUpsUsed: {},
          jesseOwnBalls: jesseBalls,
          flipOwnBalls: flipBalls,
          toepStakeMultiplier: actualStake,
        }),
      });

      if (!res.ok) throw new Error('Failed to save match');

      const newState = await res.json();
      setGameState(newState);

      // Close live game
      await fetch('/api/live-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          liveGameId: liveGame.id,
          status: 'finished',
        }),
      });
    } catch (error) {
      console.error('Failed to finish live game:', error);
      alert('Er ging iets mis bij het afronden van het potje');
    }
  };

  const handleRemoveMatch = async (matchId: string) => {
    if (!gameState) return;

    try {
      // TODO: Implement delete match API endpoint
      // For now, use client-side removal
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
      // TODO: Implement reset API endpoint
      alert('Reset functionaliteit komt binnenkort via database');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-poolGreen">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-poolGreen">
        <div className="text-white text-xl">Error loading game state</div>
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
          <p className="text-sm text-gray-400 mb-4">
            Data wordt nu opgeslagen in de database. Alle wijzigingen zijn permanent.
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Alles Resetten (komt binnenkort)
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        {/* Live Game Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsLiveMode(true)}
          className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-yellow-500/50 transition-shadow"
          title="Live Potje (met TOEP)"
        >
          <Zap className="w-8 h-8" fill="currentColor" />
        </motion.button>

        {/* Regular Match Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-green-500/50 transition-shadow"
          title="Regulier Potje"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </div>

      {/* Match Input Modal */}
      <MatchInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewMatch}
        gameState={gameState}
      />

      {/* Live Game Mode */}
      <LiveGameMode
        isOpen={isLiveMode}
        onClose={() => setIsLiveMode(false)}
        onFinish={handleLiveGameFinish}
      />
    </main>
  );
}
