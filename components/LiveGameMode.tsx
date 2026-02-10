'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, AlertTriangle, Trophy, Flame } from 'lucide-react';
import { LiveGame } from '@/lib/db/client';
import { PlayerName } from '@/types';

interface LiveGameModeProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (winner: PlayerName, jesseBalls: number, flipBalls: number) => void;
}

export default function LiveGameMode({ isOpen, onClose, onFinish }: LiveGameModeProps) {
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [loading, setLoading] = useState(false);

  // Polling interval - check elke 2 seconden voor updates
  useEffect(() => {
    if (!isOpen) return;

    const fetchLiveGame = async () => {
      try {
        const res = await fetch('/api/live-game');
        const data = await res.json();
        setLiveGame(data);
      } catch (error) {
        console.error('Failed to fetch live game:', error);
      }
    };

    // Eerste keer laden
    fetchLiveGame();

    // Poll elke 2 seconden
    const interval = setInterval(fetchLiveGame, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Start nieuwe live game
  const startLiveGame = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/live-game', { method: 'POST' });
      const newGame = await res.json();
      setLiveGame(newGame);
    } catch (error) {
      console.error('Failed to start live game:', error);
    }
    setLoading(false);
  };

  // Initieer TOEP
  const handleToep = async (player: PlayerName) => {
    if (!liveGame) return;

    // Check of er al een pending toep is
    if (liveGame.toepResponse === 'pending') {
      alert('Er is al een toep pending!');
      return;
    }

    // Check of dezelfde speler weer toept (niet toegestaan)
    if (liveGame.toepInitiatedBy === player && liveGame.currentToepStake > 1) {
      alert(`${player} kan niet opnieuw toepen. De andere speler moet overtoepen.`);
      return;
    }

    try {
      const res = await fetch('/api/live-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toep',
          liveGameId: liveGame.id,
          player,
        }),
      });
      const updated = await res.json();
      setLiveGame(updated);
    } catch (error) {
      console.error('Failed to toep:', error);
    }
  };

  // Reageer op TOEP
  const handleToepResponse = async (response: 'accepted' | 'rejected') => {
    if (!liveGame) return;

    try {
      const res = await fetch('/api/live-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_toep',
          liveGameId: liveGame.id,
          response,
        }),
      });
      const updated = await res.json();
      setLiveGame(updated);

      // Als rejected, dan verliest de tegenstander direct
      if (response === 'rejected') {
        const loser = liveGame.toepInitiatedBy === 'Jesse' ? 'Flip' : 'Jesse';
        const winner = liveGame.toepInitiatedBy!;
        
        // Sluit live game en finish match met huidige streak * 1
        setTimeout(() => {
          onFinish(winner, liveGame.jesseBallsRemaining, liveGame.flipBallsRemaining);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to respond to toep:', error);
    }
  };

  // Update ballen
  const updateBalls = async (player: 'jesse' | 'flip', balls: number) => {
    if (!liveGame) return;

    try {
      const updates = player === 'jesse' 
        ? { jesseBallsRemaining: balls }
        : { flipBallsRemaining: balls };

      await fetch('/api/live-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          liveGameId: liveGame.id,
          ...updates,
        }),
      });
    } catch (error) {
      console.error('Failed to update balls:', error);
    }
  };

  // Finish game
  const handleFinishGame = (winner: PlayerName) => {
    if (!liveGame) return;
    onFinish(winner, liveGame.jesseBallsRemaining, liveGame.flipBallsRemaining);
    onClose();
  };

  if (!isOpen) return null;

  const opponentPlayer = liveGame?.toepInitiatedBy === 'Jesse' ? 'Flip' : 'Jesse';
  const toepPending = liveGame?.toepResponse === 'pending';
  const currentStake = liveGame?.currentToepStake || 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 via-poolGreen to-gray-900 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-7 h-7 text-yellow-400" />
                Live Potje
              </h2>
              <p className="text-sm text-gray-400 mt-1">Real-time gameplay met TOEP</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {!liveGame ? (
            // Start nieuwe game
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-white text-lg mb-6">Start een nieuw live potje</p>
              <button
                onClick={startLiveGame}
                disabled={loading}
                className="pool-button bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 disabled:opacity-50"
              >
                {loading ? 'Bezig...' : 'Start Live Potje'}
              </button>
            </div>
          ) : (
            <>
              {/* Huidige Inzet Indicator */}
              <div className="mb-6 p-6 bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-2xl border-2 border-orange-500/50">
                <div className="flex items-center justify-center gap-3">
                  <Flame className="w-8 h-8 text-orange-400" />
                  <div className="text-center">
                    <div className="text-sm text-orange-300 font-semibold uppercase">Huidige Inzet</div>
                    <div className="text-4xl font-black text-white">
                      {currentStake}x Streak{currentStake > 1 && 's'}
                    </div>
                    {currentStake > 1 && (
                      <div className="text-xs text-orange-200 mt-1">
                        {currentStake === 2 && 'Getoept!'}
                        {currentStake === 3 && 'Overgetoept!'}
                        {currentStake > 3 && `${currentStake - 1}x Overgetoept!`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pending Toep Notification */}
              {toepPending && liveGame.toepInitiatedBy && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 p-6 bg-yellow-900/40 border-2 border-yellow-500 rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-yellow-300 mb-2">
                        {liveGame.toepInitiatedBy} heeft GETOEPT!
                      </h3>
                      <p className="text-sm text-yellow-200 mb-4">
                        {opponentPlayer}, accepteer je de toep? Bij acceptatie speel je om {currentStake} streak{currentStake > 1 && 's'}. 
                        Bij weigering verlies je direct met 1 streak.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleToepResponse('accepted')}
                          className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                        >
                          <Check className="w-5 h-5 inline mr-2" />
                          Accepteren
                        </button>
                        <button
                          onClick={() => handleToepResponse('rejected')}
                          className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                        >
                          <X className="w-5 h-5 inline mr-2" />
                          Weigeren
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Ball Counters */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Jesse */}
                <div className="p-4 bg-blue-900/30 rounded-2xl">
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-blue-300">Jesse</h3>
                    <div className="text-4xl font-black text-white my-2">
                      {liveGame.jesseBallsRemaining}
                    </div>
                    <div className="text-xs text-gray-400">ballen over</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={liveGame.jesseBallsRemaining}
                    onChange={(e) => updateBalls('jesse', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  {/* Toep Button */}
                  {!toepPending && (
                    <button
                      onClick={() => handleToep('Jesse')}
                      disabled={liveGame.toepInitiatedBy === 'Jesse' && currentStake > 1}
                      className="w-full mt-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      TOEP
                    </button>
                  )}
                </div>

                {/* Flip */}
                <div className="p-4 bg-orange-900/30 rounded-2xl">
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-orange-300">Flip</h3>
                    <div className="text-4xl font-black text-white my-2">
                      {liveGame.flipBallsRemaining}
                    </div>
                    <div className="text-xs text-gray-400">ballen over</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={liveGame.flipBallsRemaining}
                    onChange={(e) => updateBalls('flip', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  {/* Toep Button */}
                  {!toepPending && (
                    <button
                      onClick={() => handleToep('Flip')}
                      disabled={liveGame.toepInitiatedBy === 'Flip' && currentStake > 1}
                      className="w-full mt-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      TOEP
                    </button>
                  )}
                </div>
              </div>

              {/* Toep Rules Info */}
              <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">TOEP Regels:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Toep = verdubbel de inzet (1→2, 2→3, etc.)</li>
                  <li>• Tegenstander moet accepteren of weigeren</li>
                  <li>• Weigeren = direct verlies met 1 streak</li>
                  <li>• Na acceptatie kan ALLEEN de ander overtoepen</li>
                  <li>• Winner krijgt {currentStake} streak{currentStake > 1 && 's'} erbij</li>
                </ul>
              </div>

              {/* Finish Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleFinishGame('Jesse')}
                  disabled={toepPending}
                  className="pool-button bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Jesse Wint
                </button>
                <button
                  onClick={() => handleFinishGame('Flip')}
                  disabled={toepPending}
                  className="pool-button bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Flip Wint
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
