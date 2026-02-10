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
    winCondition: WinCondition;
    opponentBallsRemaining: number;
    powerUpsUsed: {
      jesse?: PowerUpUsage;
      flip?: PowerUpUsage;
    };
    jesseOwnBalls: number;
    flipOwnBalls: number;
  }) => void;
  gameState: GameState;
}

export default function MatchInputModal({ isOpen, onClose, onSubmit, gameState }: MatchInputModalProps) {
  const [winner, setWinner] = useState<PlayerName | null>(null);
  const [opponentBalls, setOpponentBalls] = useState(7);
  const [jesseOwnBalls, setJesseOwnBalls] = useState(0);
  const [flipOwnBalls, setFlipOwnBalls] = useState(0);
  const [jessePowerUps, setJessePowerUps] = useState<PowerUpUsage>({});
  const [flipPowerUps, setFlipPowerUps] = useState<PowerUpUsage>({});

  const loser: PlayerName | null = winner === 'Jesse' ? 'Flip' : winner === 'Flip' ? 'Jesse' : null;

  const handleSubmit = () => {
    if (!winner) return;

    onSubmit({
      winner,
      winCondition: 'normal',
      opponentBallsRemaining: opponentBalls,
      powerUpsUsed: {
        jesse: Object.keys(jessePowerUps).length > 0 ? jessePowerUps : undefined,
        flip: Object.keys(flipPowerUps).length > 0 ? flipPowerUps : undefined,
      },
      jesseOwnBalls,
      flipOwnBalls,
    });

    // Reset form
    setWinner(null);
    setOpponentBalls(7);
    setJesseOwnBalls(0);
    setFlipOwnBalls(0);
    setJessePowerUps({});
    setFlipPowerUps({});
  };

  const toggleJessePowerUp = (powerUp: keyof PowerUpUsage, data?: any) => {
    setJessePowerUps(prev => {
      const newPowerUps = { ...prev };
      if (powerUp === 'sniper') {
        if (newPowerUps.sniper) {
          delete newPowerUps.sniper;
        } else {
          newPowerUps.sniper = data || { ballsPotted: 3, successful: true };
        }
      } else if (powerUp === 'doubleTrouble') {
        if (newPowerUps.doubleTrouble) {
          delete newPowerUps.doubleTrouble;
        } else {
          newPowerUps.doubleTrouble = data || { ballsPotted: 3, successful: true };
        }
      } else if (powerUp in newPowerUps) {
        delete newPowerUps[powerUp];
      } else {
        (newPowerUps as any)[powerUp] = true;
      }
      return newPowerUps;
    });
  };

  const toggleFlipPowerUp = (powerUp: keyof PowerUpUsage, data?: any) => {
    setFlipPowerUps(prev => {
      const newPowerUps = { ...prev };
      if (powerUp === 'sniper') {
        if (newPowerUps.sniper) {
          delete newPowerUps.sniper;
        } else {
          newPowerUps.sniper = data || { ballsPotted: 3, successful: true };
        }
      } else if (powerUp === 'doubleTrouble') {
        if (newPowerUps.doubleTrouble) {
          delete newPowerUps.doubleTrouble;
        } else {
          newPowerUps.doubleTrouble = data || { ballsPotted: 3, successful: true };
        }
      } else if (powerUp in newPowerUps) {
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
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
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

              {/* Eigen ballen beide spelers */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                    Jesse&apos;s ballen
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="7"
                      value={jesseOwnBalls}
                      onChange={(e) => setJesseOwnBalls(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-2xl font-bold text-white w-12 text-center">
                      {jesseOwnBalls}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                    Flip&apos;s ballen
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="7"
                      value={flipOwnBalls}
                      onChange={(e) => setFlipOwnBalls(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="text-2xl font-bold text-white w-12 text-center">
                      {flipOwnBalls}
                    </div>
                  </div>
                </div>
              </div>

              {/* Power-ups Jesse */}
              <div className="mb-6 p-4 bg-blue-900/20 rounded-2xl">
                <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">
                  Power-ups Jesse
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {gameState.jesse.powerUpQuota.toep > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('toep')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.toep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Toep ({gameState.jesse.powerUpQuota.toep})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.ballenBakBizarre > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('ballenBakBizarre')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.ballenBakBizarre
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      BBB ({gameState.jesse.powerUpQuota.ballenBakBizarre})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.cumbackKid > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('cumbackKid')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.cumbackKid
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Cumback ({gameState.jesse.powerUpQuota.cumbackKid})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.ballenBak > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('ballenBak')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.ballenBak
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Ballenbak ({gameState.jesse.powerUpQuota.ballenBak})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.pullThePlug > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('pullThePlug')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.pullThePlug
                          ? 'bg-red-800 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Pull Plug ({gameState.jesse.powerUpQuota.pullThePlug})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.sniper > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('sniper', { ballsPotted: 3, successful: true })}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.sniper
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Sniper ({gameState.jesse.powerUpQuota.sniper})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.doubleTrouble > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('doubleTrouble', { ballsPotted: 3, successful: true })}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.doubleTrouble
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Double ({gameState.jesse.powerUpQuota.doubleTrouble})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.speedpot > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('speedpot')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.speedpot
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Speedpot ({gameState.jesse.powerUpQuota.speedpot})
                    </button>
                  )}
                  {gameState.jesse.powerUpQuota.bbc > 0 && (
                    <button
                      onClick={() => toggleJessePowerUp('bbc')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        jessePowerUps.bbc
                          ? 'bg-black text-yellow-400 ring-2 ring-yellow-400'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      BBC +€5 ({gameState.jesse.powerUpQuota.bbc})
                    </button>
                  )}
                </div>
              </div>

              {/* Power-ups Flip */}
              <div className="mb-6 p-4 bg-orange-900/20 rounded-2xl">
                <label className="block text-sm font-semibold text-orange-300 mb-3 uppercase tracking-wide">
                  Power-ups Flip
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {gameState.flip.powerUpQuota.toep > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('toep')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.toep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Toep ({gameState.flip.powerUpQuota.toep})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.ballenBakBizarre > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('ballenBakBizarre')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.ballenBakBizarre
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      BBB ({gameState.flip.powerUpQuota.ballenBakBizarre})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.cumbackKid > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('cumbackKid')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.cumbackKid
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Cumback ({gameState.flip.powerUpQuota.cumbackKid})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.ballenBak > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('ballenBak')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.ballenBak
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Ballenbak ({gameState.flip.powerUpQuota.ballenBak})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.pullThePlug > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('pullThePlug')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.pullThePlug
                          ? 'bg-red-800 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Pull Plug ({gameState.flip.powerUpQuota.pullThePlug})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.sniper > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('sniper', { ballsPotted: 3, successful: true })}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.sniper
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Sniper ({gameState.flip.powerUpQuota.sniper})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.doubleTrouble > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('doubleTrouble', { ballsPotted: 3, successful: true })}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.doubleTrouble
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Double ({gameState.flip.powerUpQuota.doubleTrouble})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.speedpot > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('speedpot')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.speedpot
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Speedpot ({gameState.flip.powerUpQuota.speedpot})
                    </button>
                  )}
                  {gameState.flip.powerUpQuota.bbc > 0 && (
                    <button
                      onClick={() => toggleFlipPowerUp('bbc')}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        flipPowerUps.bbc
                          ? 'bg-black text-yellow-400 ring-2 ring-yellow-400'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      BBC +€5 ({gameState.flip.powerUpQuota.bbc})
                    </button>
                  )}
                </div>
              </div>

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
