'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Trophy, Flame, CheckCircle, Sparkles } from 'lucide-react';
import { LiveGame } from '@/lib/db/client';
import { PlayerName, PowerUpUsage } from '@/types';
import ToepModal from './ToepModal';
import PowerUpFlash from './PowerUpFlash';

interface LiveGameModeProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (winner: PlayerName, jesseBalls: number, flipBalls: number, toepStake: number, powerUpsUsed: { jesse?: PowerUpUsage; flip?: PowerUpUsage }) => void;
  gameState: any; // Voor power-up quota
}

export default function LiveGameMode({ isOpen, onClose, onFinish, gameState }: LiveGameModeProps) {
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToepModal, setShowToepModal] = useState(false);
  const [jessePowerUps, setJessePowerUps] = useState<PowerUpUsage>({});
  const [flipPowerUps, setFlipPowerUps] = useState<PowerUpUsage>({});
  const [showPowerUpFlash, setShowPowerUpFlash] = useState(false);
  const [lastPowerUp, setLastPowerUp] = useState({ player: '', name: '' });

  // Polling interval - check elke 2 seconden voor updates
  useEffect(() => {
    if (!isOpen) return;

    const fetchLiveGame = async () => {
      try {
        const res = await fetch('/api/live-game');
        const data = await res.json();
        
        if (data && !data.error) {
          setLiveGame(data);
          
          // Show toep modal if there's a pending toep
          if (data.toepResponse === 'pending') {
            setShowToepModal(true);
          } else {
            setShowToepModal(false);
          }
        } else {
          // Geen active game meer (bijv. na finish)
          setLiveGame(null);
        }
      } catch (error) {
        console.error('Failed to fetch live game:', error);
      }
    };

    fetchLiveGame();
    const interval = setInterval(fetchLiveGame, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const startLiveGame = async () => {
    setLoading(true);
    try {
      // ALTIJD een nieuwe game maken (oude wordt gecancelled in createLiveGame)
      const res = await fetch('/api/live-game', { method: 'POST' });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start live game');
      }
      
      const newGame = await res.json();
      setLiveGame(newGame);
      
      // Reset power-ups state voor nieuwe game
      setJessePowerUps({});
      setFlipPowerUps({});
    } catch (error) {
      console.error('Failed to start live game:', error);
      alert('Live mode vereist database setup. Gebruik eerst de reguliere match mode (+) of setup de database.');
      onClose();
    }
    setLoading(false);
  };

  const handleToep = async (player: PlayerName) => {
    if (!liveGame) return;

    // Check if there's already a pending toep
    if (liveGame.toepResponse === 'pending') {
      return;
    }

    // Check if same player is trying to toep again (not allowed!)
    // Als toep_initiated_by === player, dan heeft DEZE speler net getoept
    // Dan mag deze speler NIET direct overtoepen - alleen de ANDER mag dat
    if (liveGame.toepInitiatedBy === player) {
      console.log(`${player} heeft net getoept, mag niet direct overtoepen!`);
      return;
    }

    // Check power-up quota
    const playerLower = player.toLowerCase() as 'jesse' | 'flip';
    const toepQuota = gameState?.[playerLower]?.powerUpQuota?.toep || 0;
    
    if (toepQuota <= 0) {
      alert(`${player} heeft geen Toep power-ups meer! (Max 5x per maand)`);
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
      setShowToepModal(true);
      
      // Track toep usage (will be deducted on finish)
      if (player === 'Jesse') {
        setJessePowerUps(prev => ({ ...prev, toep: true }));
      } else {
        setFlipPowerUps(prev => ({ ...prev, toep: true }));
      }
    } catch (error) {
      console.error('Failed to toep:', error);
    }
  };

  const handleToepAccept = async () => {
    if (!liveGame) return;

    try {
      const res = await fetch('/api/live-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_toep',
          liveGameId: liveGame.id,
          response: 'accepted',
        }),
      });
      const updated = await res.json();
      setLiveGame(updated);
      setShowToepModal(false);
    } catch (error) {
      console.error('Failed to accept toep:', error);
    }
  };

  const handleToepReject = async () => {
    if (!liveGame) return;

    try {
      const res = await fetch('/api/live-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_toep',
          liveGameId: liveGame.id,
          response: 'rejected',
        }),
      });
      setShowToepModal(false);

      // Loser is the responder, winner is the initiator
      const winner = liveGame.toepInitiatedBy!;
      
      setTimeout(() => {
        onFinish(
          winner, 
          liveGame.jesseBallsRemaining, 
          liveGame.flipBallsRemaining, 
          1,
          {
            jesse: Object.keys(jessePowerUps).length > 0 ? jessePowerUps : undefined,
            flip: Object.keys(flipPowerUps).length > 0 ? flipPowerUps : undefined,
          }
        );
        onClose();
        
        // Reset power-ups
        setJessePowerUps({});
        setFlipPowerUps({});
      }, 500);
    } catch (error) {
      console.error('Failed to reject toep:', error);
    }
  };

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

  const togglePowerUp = (player: 'jesse' | 'flip', powerUp: keyof PowerUpUsage) => {
    const setPowerUps = player === 'jesse' ? setJessePowerUps : setFlipPowerUps;
    const powerUps = player === 'jesse' ? jessePowerUps : flipPowerUps;
    const playerName = player === 'jesse' ? 'Jesse' : 'Flip';
    
    // Check quota
    const playerQuota = gameState?.[player]?.powerUpQuota;
    if (!playerQuota) return;
    
    const quotaKey = powerUp as keyof typeof playerQuota;
    if (quotaKey in playerQuota && (playerQuota as any)[quotaKey] <= 0) {
      alert(`${playerName} heeft geen ${powerUp} power-ups meer!`);
      return;
    }
    
    setPowerUps(prev => {
      const newPowerUps = { ...prev };
      if (powerUp in newPowerUps) {
        delete newPowerUps[powerUp];
      } else {
        (newPowerUps as any)[powerUp] = true;
        
        // Show flash
        setLastPowerUp({ player: playerName, name: String(powerUp) });
        setShowPowerUpFlash(true);
        setTimeout(() => setShowPowerUpFlash(false), 1500);
      }
      return newPowerUps;
    });
  };

  const handleFinishGame = (winner: PlayerName) => {
    if (!liveGame) return;
    onFinish(
      winner, 
      liveGame.jesseBallsRemaining, 
      liveGame.flipBallsRemaining, 
      liveGame.currentToepStake,
      {
        jesse: Object.keys(jessePowerUps).length > 0 ? jessePowerUps : undefined,
        flip: Object.keys(flipPowerUps).length > 0 ? flipPowerUps : undefined,
      }
    );
    onClose();
    
    // Reset voor volgend potje
    setJessePowerUps({});
    setFlipPowerUps({});
  };

  if (!isOpen) return null;

  const responder = liveGame?.toepInitiatedBy === 'Jesse' ? 'Flip' : 'Jesse';
  const currentStake = liveGame?.currentToepStake || 0;
  
  // Jesse kan toepen als:
  // 1. Er is geen pending toep (toepResponse !== 'pending')
  // 2. EN (niemand heeft getoept OF Flip was de laatste die toepte)
  const jesseCanToep = liveGame?.toepResponse !== 'pending' && 
    (!liveGame?.toepInitiatedBy || liveGame.toepInitiatedBy === 'Flip');
  
  // Flip kan toepen als:
  // 1. Er is geen pending toep (toepResponse !== 'pending')
  // 2. EN (niemand heeft getoept OF Jesse was de laatste die toepte)
  const flipCanToep = liveGame?.toepResponse !== 'pending' && 
    (!liveGame?.toepInitiatedBy || liveGame.toepInitiatedBy === 'Jesse');
  
  const toepButtonText = currentStake === 0 ? 'TOEP' : 'OVERTOEP';

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
          className="bg-gradient-to-br from-gray-900 via-poolGreen to-gray-900 rounded-3xl p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        >
          {/* Header - Compacter */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" fill="currentColor" />
              <h2 className="text-xl font-bold text-white">Live Potje</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {!liveGame ? (
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
              {/* Huidige Inzet Indicator - Compacter */}
              <motion.div
                animate={{
                  scale: currentStake > 0 ? [1, 1.03, 1] : 1,
                }}
                transition={{ duration: 1, repeat: currentStake > 0 ? Infinity : 0 }}
                className={`mb-3 p-3 rounded-xl border-2 ${
                  currentStake >= 2 ? 'bg-gradient-to-r from-red-900/40 to-orange-900/40 border-red-500/50' :
                  currentStake === 1 ? 'bg-gradient-to-r from-orange-900/40 to-yellow-900/40 border-orange-500/50' :
                  'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Flame className={`w-5 h-5 ${currentStake >= 1 ? 'text-orange-400' : 'text-green-400'}`} 
                    fill={currentStake >= 1 ? 'currentColor' : 'none'} />
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">
                      {currentStake + 1}x Streak{currentStake + 1 > 1 && 's'}
                    </div>
                    {currentStake > 0 && (
                      <div className="text-[10px] text-orange-200">
                        {currentStake === 1 && '🔥 Getoept!'}
                        {currentStake === 2 && '🔥🔥 Overgetoept!'}
                        {currentStake > 2 && `🔥 ${currentStake}x Overgetoept!`}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Power-ups Section - Compacter */}
              <div className="mb-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-3 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-purple-300 uppercase">Power-ups</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Jesse Power-ups */}
                  <div className="space-y-2">
                    <p className="text-xs text-blue-300 font-semibold">Jesse ({gameState?.jesse.powerUpQuota.toep || 0} toeps)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {gameState?.jesse.powerUpQuota.ballenBak > 0 && (
                        <button
                          onClick={() => togglePowerUp('jesse', 'ballenBak')}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            jessePowerUps.ballenBak
                              ? 'bg-red-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Ballenbak
                        </button>
                      )}
                      {gameState?.jesse.powerUpQuota.bbc > 0 && (
                        <button
                          onClick={() => togglePowerUp('jesse', 'bbc')}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            jessePowerUps.bbc
                              ? 'bg-black text-yellow-400 ring-1 ring-yellow-400 shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          BBC +€5
                        </button>
                      )}
                      {gameState?.jesse.powerUpQuota.sniper > 0 && (
                        <button
                          onClick={() => {
                            const balls = prompt('Hoeveel ballen achter elkaar? (3+)');
                            if (balls && Number(balls) >= 3) {
                              togglePowerUp('jesse', 'sniper');
                              setJessePowerUps(prev => ({ ...prev, sniper: { ballsPotted: Number(balls), successful: true }}));
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            jessePowerUps.sniper
                              ? 'bg-yellow-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Sniper
                        </button>
                      )}
                      {gameState?.jesse.powerUpQuota.doubleTrouble > 0 && (
                        <button
                          onClick={() => {
                            const balls = prompt('Hoeveel ballen achter elkaar? (3+)');
                            if (balls && Number(balls) >= 3) {
                              togglePowerUp('jesse', 'doubleTrouble');
                              setJessePowerUps(prev => ({ ...prev, doubleTrouble: { ballsPotted: Number(balls), successful: true }}));
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            jessePowerUps.doubleTrouble
                              ? 'bg-pink-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Double
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Flip Power-ups */}
                  <div className="space-y-2">
                    <p className="text-xs text-orange-300 font-semibold">Flip ({gameState?.flip.powerUpQuota.toep || 0} toeps)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {gameState?.flip.powerUpQuota.ballenBak > 0 && (
                        <button
                          onClick={() => togglePowerUp('flip', 'ballenBak')}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            flipPowerUps.ballenBak
                              ? 'bg-red-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Ballenbak
                        </button>
                      )}
                      {gameState?.flip.powerUpQuota.bbc > 0 && (
                        <button
                          onClick={() => togglePowerUp('flip', 'bbc')}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            flipPowerUps.bbc
                              ? 'bg-black text-yellow-400 ring-1 ring-yellow-400 shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          BBC +€5
                        </button>
                      )}
                      {gameState?.flip.powerUpQuota.sniper > 0 && (
                        <button
                          onClick={() => {
                            const balls = prompt('Hoeveel ballen achter elkaar? (3+)');
                            if (balls && Number(balls) >= 3) {
                              togglePowerUp('flip', 'sniper');
                              setFlipPowerUps(prev => ({ ...prev, sniper: { ballsPotted: Number(balls), successful: true }}));
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            flipPowerUps.sniper
                              ? 'bg-yellow-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Sniper
                        </button>
                      )}
                      {gameState?.flip.powerUpQuota.doubleTrouble > 0 && (
                        <button
                          onClick={() => {
                            const balls = prompt('Hoeveel ballen achter elkaar? (3+)');
                            if (balls && Number(balls) >= 3) {
                              togglePowerUp('flip', 'doubleTrouble');
                              setFlipPowerUps(prev => ({ ...prev, doubleTrouble: { ballsPotted: Number(balls), successful: true }}));
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                            flipPowerUps.doubleTrouble
                              ? 'bg-pink-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Double
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ball Counters - Compacter voor iPhone */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Jesse */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30"
                >
                  <div className="text-center mb-2">
                    <h3 className="text-sm font-bold text-blue-300">Jesse</h3>
                    <div className="text-3xl font-black text-white my-1">
                      {liveGame.jesseBallsRemaining}
                    </div>
                    <div className="text-[10px] text-gray-400">ballen</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={liveGame.jesseBallsRemaining}
                    onChange={(e) => updateBalls('jesse', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
                  />
                  {/* Toep Button */}
                  <button
                    onClick={() => handleToep('Jesse')}
                    disabled={!jesseCanToep}
                    className={`w-full py-2 font-bold rounded-lg transition-all text-xs ${
                      jesseCanToep
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-3 h-3 inline mr-1" fill={jesseCanToep ? 'currentColor' : 'none'} />
                    {toepButtonText}
                  </button>
                </motion.div>

                {/* Flip */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30"
                >
                  <div className="text-center mb-2">
                    <h3 className="text-sm font-bold text-orange-300">Flip</h3>
                    <div className="text-3xl font-black text-white my-1">
                      {liveGame.flipBallsRemaining}
                    </div>
                    <div className="text-[10px] text-gray-400">ballen</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={liveGame.flipBallsRemaining}
                    onChange={(e) => updateBalls('flip', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-2"
                  />
                  {/* Toep Button */}
                  <button
                    onClick={() => handleToep('Flip')}
                    disabled={!flipCanToep}
                    className={`w-full py-2 font-bold rounded-lg transition-all text-xs ${
                      flipCanToep
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-3 h-3 inline mr-1" fill={flipCanToep ? 'currentColor' : 'none'} />
                    {toepButtonText}
                  </button>
                </motion.div>
              </div>

              {/* Finish Buttons - Compacter */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFinishGame('Jesse')}
                  className="py-4 px-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg font-bold text-sm"
                >
                  <CheckCircle className="w-5 h-5 inline mr-1" />
                  Jesse Wint
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFinishGame('Flip')}
                  className="py-4 px-4 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400 shadow-lg font-bold text-sm"
                >
                  <CheckCircle className="w-5 h-5 inline mr-1" />
                  Flip Wint
                </motion.button>
              </div>
            </>
          )}
        </motion.div>

        {/* Toep Modal */}
        {liveGame && liveGame.toepInitiatedBy && (
          <ToepModal
            isOpen={showToepModal}
            initiator={liveGame.toepInitiatedBy}
            responder={responder as PlayerName}
            currentStake={currentStake}
            onAccept={handleToepAccept}
            onReject={handleToepReject}
          />
        )}

        {/* Power-up Flash */}
        <PowerUpFlash
          isVisible={showPowerUpFlash}
          powerUpName={lastPowerUp.name}
          playerName={lastPowerUp.player}
        />
      </motion.div>
    </AnimatePresence>
  );
}
