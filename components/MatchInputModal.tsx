'use client';

import { useState } from 'react';
import { PlayerName, PowerUpUsage, GameState } from '@/types';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    winner: PlayerName;
    opponentBallsRemaining: number;
    powerUpsUsed: {
      winner?: PowerUpUsage;
      loser?: PowerUpUsage;
    };
    winnerOwnBalls: number;
  }) => void;
  gameState: GameState;
}

export default function MatchInputModal({ isOpen, onClose, onSubmit, gameState }: MatchInputModalProps) {
  const [winner, setWinner] = useState<PlayerName | null>(null);
  const [opponentBalls, setOpponentBalls] = useState(7);
  const [winnerOwnBalls, setWinnerOwnBalls] = useState(0);
  const [winnerPowerUps, setWinnerPowerUps] = useState<PowerUpUsage>({});
  const [loserPowerUps, setLoserPowerUps] = useState<PowerUpUsage>({});

  const loser: PlayerName | null = winner === 'Jesse' ? 'Flip' : winner === 'Flip' ? 'Jesse' : null;
  const winnerPlayer = winner ? gameState[winner.toLowerCase() as 'jesse' | 'flip'] : null;
  const loserPlayer = loser ? gameState[loser.toLowerCase() as 'jesse' | 'flip'] : null;

  const handleSubmit = () => {
    if (!winner) return;

    onSubmit({
      winner,
      opponentBallsRemaining: opponentBalls,
      powerUpsUsed: {
        winner: Object.keys(winnerPowerUps).length > 0 ? winnerPowerUps : undefined,
        loser: Object.keys(loserPowerUps).length > 0 ? loserPowerUps : undefined,
      },
      winnerOwnBalls,
    });

    // Reset form
    setWinner(null);
    setOpponentBalls(7);
    setWinnerOwnBalls(0);
    setWinnerPowerUps({});
    setLoserPowerUps({});
  };

  const toggleWinnerPowerUp = (powerUp: keyof PowerUpUsage) => {
    setWinnerPowerUps(prev => {
      const newPowerUps = { ...prev };
      if (powerUp === 'sniper') {
        // Toggle sniper met 3 ballen als default
        if (newPowerUps.sniper) {
          delete newPowerUps.sniper;
        } else {
          newPowerUps.sniper = { ballsPotted: 3 };
        }
      } else if (powerUp in newPowerUps) {
        delete newPowerUps[powerUp];
      } else {
        (newPowerUps as any)[powerUp] = true;
      }
      return newPowerUps;
    });
  };

  const toggleLoserPowerUp = (powerUp: keyof PowerUpUsage) => {
    setLoserPowerUps(prev => {
      const newPowerUps = { ...prev };
      if (powerUp in newPowerUps) {
        delete newPowerUps[powerUp];
      } else {
        (newPowerUps as any)[powerUp] = true;
      }
      return newPowerUps;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Nieuw Potje</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Winnaar selectie */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
              Wie heeft gewonnen?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setWinner('Jesse')}
                className={`pool-button ${
                  winner === 'Jesse'
                    ? 'bg-green-600 text-white ring-4 ring-green-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {winner === 'Jesse' && <Check className="w-6 h-6 inline mr-2" />}
                Jesse
              </button>
              <button
                onClick={() => setWinner('Flip')}
                className={`pool-button ${
                  winner === 'Flip'
                    ? 'bg-green-600 text-white ring-4 ring-green-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {winner === 'Flip' && <Check className="w-6 h-6 inline mr-2" />}
                Flip
              </button>
            </div>
          </div>

          {winner && (
            <>
              {/* Ballen verliezer */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Hoeveel ballen had {loser} nog over?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={opponentBalls}
                    onChange={(e) => setOpponentBalls(Number(e.target.value))}
                    className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <div className="text-3xl font-bold text-white w-16 text-center">
                    {opponentBalls}
                  </div>
                </div>
              </div>

              {/* Eigen ballen winnaar */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Hoeveel ballen had {winner} nog over?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={winnerOwnBalls}
                    onChange={(e) => setWinnerOwnBalls(Number(e.target.value))}
                    className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="text-3xl font-bold text-white w-16 text-center">
                    {winnerOwnBalls}
                  </div>
                </div>
              </div>

              {/* Power-ups winnaar */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Power-ups {winner}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {winnerPlayer && winnerPlayer.powerUpQuota.ballenBakBizarre > 0 && (
                    <button
                      onClick={() => toggleWinnerPowerUp('ballenBakBizarre')}
                      disabled={winnerOwnBalls < 3}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        winnerPowerUps.ballenBakBizarre
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${winnerOwnBalls < 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Ballenbak Bizarre ({winnerPlayer.powerUpQuota.ballenBakBizarre})
                    </button>
                  )}
                  {winnerPlayer && winnerPlayer.powerUpQuota.toep > 0 && (
                    <button
                      onClick={() => toggleWinnerPowerUp('toep')}
                      disabled={winnerOwnBalls < 2}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        winnerPowerUps.toep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${winnerOwnBalls < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Toep ({winnerPlayer.powerUpQuota.toep})
                    </button>
                  )}
                  {winnerPlayer && winnerPlayer.powerUpQuota.ballenBak > 0 && (
                    <button
                      onClick={() => toggleWinnerPowerUp('ballenBak')}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        winnerPowerUps.ballenBak
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Ballenbak ({winnerPlayer.powerUpQuota.ballenBak})
                    </button>
                  )}
                  {winnerPlayer && winnerPlayer.powerUpQuota.pullThePlug > 0 && (
                    <button
                      onClick={() => toggleWinnerPowerUp('pullThePlug')}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        winnerPowerUps.pullThePlug
                          ? 'bg-red-800 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Pull The Plug ({winnerPlayer.powerUpQuota.pullThePlug})
                    </button>
                  )}
                  {winnerPlayer && winnerPlayer.powerUpQuota.sniper > 0 && (
                    <button
                      onClick={() => toggleWinnerPowerUp('sniper')}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        winnerPowerUps.sniper
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Sniper ({winnerPlayer.powerUpQuota.sniper})
                    </button>
                  )}
                  {winnerPlayer && winnerPlayer.powerUpQuota.speedpot > 0 && (
                    <button
                      onClick={() => toggleWinnerPowerUp('speedpot')}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        winnerPowerUps.speedpot
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Speedpot ({winnerPlayer.powerUpQuota.speedpot})
                    </button>
                  )}
                  <button
                    onClick={() => toggleWinnerPowerUp('bbc')}
                    className={`p-4 rounded-xl font-bold transition-all ${
                      winnerPowerUps.bbc
                        ? 'bg-black text-yellow-400 ring-2 ring-yellow-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    BBC +€5 (∞)
                  </button>
                </div>
              </div>

              {/* Power-ups verliezer */}
              {loserPlayer && loserPlayer.powerUpQuota.cumbackKid > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                    Power-ups {loser}
                  </label>
                  <button
                    onClick={() => toggleLoserPowerUp('cumbackKid')}
                    className={`w-full p-4 rounded-xl font-bold transition-all ${
                      loserPowerUps.cumbackKid
                        ? 'bg-green-600 text-white ring-4 ring-green-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Cumback Kid ({loserPlayer.powerUpQuota.cumbackKid})
                  </button>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                className="w-full pool-button bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400"
              >
                <Check className="w-6 h-6 inline mr-2" />
                Potje Opslaan
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
