'use client';

import { useState, useEffect } from 'react';
import { GameState, PlayerName, PowerUpUsage } from '@/types';
import { removeMatch, initializeGameState } from '@/lib/streakEngine';
import PlayerCard from '@/components/PlayerCard';
import MatchInputModal from '@/components/MatchInputModal';
import MatchHistory from '@/components/MatchHistory';
import LiveGameMode from '@/components/LiveGameMode';
import PullThePlugButton from '@/components/PullThePlugButton';
import CumbackKidButton from '@/components/CumbackKidButton';
import { Plus, History, Settings, Trophy, RotateCcw, Zap, AlertTriangle } from 'lucide-react';
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
    winCondition: 'normal';
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

  const handleLiveGameFinish = async (winner: PlayerName, jesseBalls: number, flipBalls: number, toepStake: number, powerUpsUsed: { jesse?: PowerUpUsage; flip?: PowerUpUsage }) => {
    // Fetch live game voor toep stake
    try {
      const liveRes = await fetch('/api/live-game');
      const liveGame = await liveRes.json();

      // BELANGRIJK: currentToepStake kan 0 zijn! Gebruik ?? in plaats van ||
      const toepStake = liveGame?.currentToepStake ?? 1;
      const loser: PlayerName = winner === 'Jesse' ? 'Flip' : 'Jesse';
      const opponentBalls = winner === 'Jesse' ? flipBalls : jesseBalls;

      // Use the toepStake directly (already handled in LiveGameMode)
      const actualStake = toepStake + 1; // +1 omdat stake 0 = 1 streak, stake 1 = 2 streaks etc.

      // Save match via API met toep multiplier en power-ups
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner,
          winCondition: 'normal',
          opponentBallsRemaining: opponentBalls,
          powerUpsUsed,
          jesseOwnBalls: jesseBalls,
          flipOwnBalls: flipBalls,
          toepStakeMultiplier: actualStake,
        }),
      });

      if (!res.ok) throw new Error('Failed to save match');

      const newState = await res.json();
      setGameState(newState);

      // Close live game - set to 'finished' which acts as cancelled
      await fetch('/api/live-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          liveGameId: liveGame.id,
          status: 'finished',
        }),
      });
      
      console.log('Live game finished, status set to finished');
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

  const handlePullThePlug = async (targetPlayer: 'jesse' | 'flip') => {
    if (!gameState) return;
    
    // This is done before a match, just update the local state
    const { calculateMatch } = await import('@/lib/streakEngine');
    const { saveGameState } = await import('@/lib/storage');
    
    const powerUpsUsed = targetPlayer === 'jesse' 
      ? { flip: { pullThePlug: true } as PowerUpUsage }
      : { jesse: { pullThePlug: true } as PowerUpUsage };
    
    // Create a dummy match to apply pull the plug
    const result = calculateMatch({
      gameState,
      winner: targetPlayer === 'jesse' ? 'Flip' : 'Jesse',
      winCondition: 'normal',
      opponentBallsRemaining: 0,
      powerUpsUsed,
      jesseOwnBalls: 0,
      flipOwnBalls: 0,
      toepStakeMultiplier: 0, // No streak change, just power-up effect
    });
    
    setGameState(result.newGameState);
    saveGameState(result.newGameState);
  };

  const handleCumbackKid = async (userPlayer: 'jesse' | 'flip') => {
    if (!gameState) return;
    
    // Cumback Kid: speler benadert streak van tegenstander
    // Direct streak aanpassen zonder dummy match
    const otherPlayer: PlayerName = userPlayer === 'jesse' ? 'Flip' : 'Jesse';
    const opponentStreak = userPlayer === 'jesse' ? gameState.flip.streak : gameState.jesse.streak;
    const newStreak = Math.max(0, opponentStreak - 1);
    
    const newGameState = {
      ...gameState,
      [userPlayer]: {
        ...gameState[userPlayer],
        streak: newStreak,
        powerUpQuota: {
          ...gameState[userPlayer].powerUpQuota,
          cumbackKid: gameState[userPlayer].powerUpQuota.cumbackKid - 1,
        },
      },
    };
    
    setGameState(newGameState);
    
    // Save to database and local storage
    try {
      const res = await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGameState),
      });
      if (res.ok) {
        const saved = await res.json();
        setGameState(saved);
      }
    } catch (error) {
      console.error('Failed to save Cumback Kid:', error);
      // Fallback: save locally
      const { saveGameState } = await import('@/lib/storage');
      saveGameState(newGameState);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ WAARSCHUWING: Dit verwijdert ALLE data!\n\n- Alle potjes worden gewist\n- Alle streaks worden gereset\n- Alle power-ups worden gereset\n\nWeet je het ZEKER?')) {
      return;
    }

    if (!confirm('Laatste kans! Dit kan NIET ongedaan gemaakt worden.\n\nDoorgaan met resetten?')) {
      return;
    }

    try {
      // Try database reset first
      const res = await fetch('/api/reset', { method: 'POST' });
      const result = await res.json();
      
      // Clear local storage
      const { clearGameState } = await import('@/lib/storage');
      clearGameState();
      
      // Reset to initial state
      const newState = initializeGameState();
      setGameState(newState);
      
      alert('✅ Alle data is gereset! De competitie begint opnieuw.');
      setShowSettings(false);
      
      // Refresh from server
      fetchGameState();
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Er ging iets mis bij het resetten. Probeer opnieuw.');
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
          className="max-w-4xl mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Instellingen
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Data wordt opgeslagen in local storage. Bij database setup ook in de cloud.
          </p>
          
          <div className="bg-red-900/20 border border-red-600/50 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-red-400 mb-2 uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Gevaarlijke Zone
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Dit verwijdert ALLE data: matches, streaks, en power-ups. Kan niet ongedaan gemaakt worden!
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/50"
            >
              <RotateCcw className="w-5 h-5" />
              Alles Resetten
            </button>
          </div>
        </motion.div>
      )}

      {/* Player Cards - Mobile Optimized */}
      {!showHistory && (
        <div className="max-w-4xl mx-auto mb-6 px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jesse */}
            <div className="flex flex-col gap-3">
              <PlayerCard player={gameState.jesse} isWinning={jesseWinning} />
              {/* Pre-match Power-ups ONDER de card - Jesse zet in */}
              <div className="flex items-center justify-center gap-3">
                <CumbackKidButton
                  playerName="Jesse"
                  opponentName="Flip"
                  playerStreak={gameState.jesse.streak}
                  opponentStreak={gameState.flip.streak}
                  available={gameState.jesse.powerUpQuota.cumbackKid > 0}
                  onUse={() => handleCumbackKid('jesse')}
                />
                <PullThePlugButton
                  playerName="Jesse"
                  targetName="Flip"
                  available={gameState.jesse.powerUpQuota.pullThePlug > 0}
                  onUse={() => handlePullThePlug('flip')}
                />
              </div>
            </div>
            
            {/* Flip */}
            <div className="flex flex-col gap-3">
              <PlayerCard player={gameState.flip} isWinning={flipWinning} />
              {/* Pre-match Power-ups ONDER de card - Flip zet in */}
              <div className="flex items-center justify-center gap-3">
                <CumbackKidButton
                  playerName="Flip"
                  opponentName="Jesse"
                  playerStreak={gameState.flip.streak}
                  opponentStreak={gameState.jesse.streak}
                  available={gameState.flip.powerUpQuota.cumbackKid > 0}
                  onUse={() => handleCumbackKid('flip')}
                />
                <PullThePlugButton
                  playerName="Flip"
                  targetName="Jesse"
                  available={gameState.flip.powerUpQuota.pullThePlug > 0}
                  onUse={() => handlePullThePlug('jesse')}
                />
              </div>
            </div>
          </div>
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

      {/* Floating Action Buttons - Mobile optimized */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 flex flex-col gap-2 md:gap-3 z-40">
        {/* Live Game Button - Kleiner op mobile */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              '0 0 15px rgba(250, 204, 21, 0.4)',
              '0 0 25px rgba(251, 146, 60, 0.6)',
              '0 0 15px rgba(250, 204, 21, 0.4)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={() => setIsLiveMode(true)}
          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-500 via-orange-500 to-orange-600 rounded-full shadow-xl flex items-center justify-center text-white relative"
          title="Live Potje (met TOEP)"
        >
          <Zap className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
          <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-red-500 text-white text-[9px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-full">
            LIVE
          </div>
        </motion.button>

        {/* Regular Match Button - kleiner */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="w-11 h-11 md:w-12 md:h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-300 hover:shadow-green-500/30 transition-all opacity-70 hover:opacity-100"
          title="Reeds gespeeld potje toevoegen"
        >
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
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
        gameState={gameState}
      />
    </main>
  );
}
