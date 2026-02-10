'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface CumbackKidButtonProps {
  playerName: string;
  opponentName: string;
  playerStreak: number;
  opponentStreak: number;
  available: boolean;
  onUse: () => void;
}

export default function CumbackKidButton({ 
  playerName, 
  opponentName, 
  playerStreak,
  opponentStreak,
  available, 
  onUse 
}: CumbackKidButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (!available) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onUse();
    setShowConfirm(false);
  };

  const newStreak = Math.max(0, opponentStreak - 1);

  if (!available) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-30">
        <div className="text-[10px] text-gray-600 font-bold uppercase">{playerName}</div>
        <div className="w-14 h-14 rounded-full bg-gray-800/50 flex items-center justify-center border-2 border-gray-700">
          <div className="text-2xl">🔴</div>
        </div>
        <div className="text-[8px] text-gray-600">Gebruikt</div>
      </div>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.15, rotate: -10 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className="relative flex flex-col items-center gap-1"
      >
        <div className="text-[10px] text-white font-bold uppercase tracking-wider">{playerName}</div>
        
        {/* Rode glow effect */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(220,38,38,0.6)',
              '0 0 30px rgba(239,68,68,0.8)',
              '0 0 20px rgba(220,38,38,0.6)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full top-5"
        />
        
        {/* Rode Button met geel puntje */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center relative border-2 border-red-400 shadow-2xl">
          <div className="text-3xl">🔴</div>
          {/* Geel accent puntje */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
        </div>
        
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[8px] text-white font-bold uppercase tracking-wide"
        >
          CUMBACK
        </motion.div>
      </motion.button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-red-900 to-gray-900 rounded-2xl p-6 max-w-md w-full border-2 border-red-500/50 shadow-2xl"
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🔴</div>
              <h2 className="text-3xl font-black text-white">
                CUMBACK KID
              </h2>
            </div>
            <p className="text-white text-center mb-2 text-lg">
              <span className="font-bold text-red-300">{playerName}</span> benadert de streak van{' '}
              <span className="font-bold text-yellow-300">{opponentName}</span>!
            </p>
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              <div className="flex justify-around text-center">
                <div>
                  <div className="text-sm text-gray-400">{playerName} nu</div>
                  <div className="text-3xl font-black text-white">{playerStreak}</div>
                </div>
                <div className="text-3xl text-red-400">→</div>
                <div>
                  <div className="text-sm text-gray-400">{playerName} nieuw</div>
                  <div className="text-3xl font-black text-red-300">{newStreak}</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mb-6 italic">
              {opponentName} heeft streak {opponentStreak}, jij krijgt {newStreak}!<br />
              Dit kan maar 1x per maand!
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="pool-button bg-gradient-to-br from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg"
              >
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Bevestig
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowConfirm(false)}
                className="pool-button bg-gradient-to-br from-gray-600 to-gray-500 text-white hover:from-gray-500 hover:to-gray-400"
              >
                <X className="w-5 h-5 inline mr-2" />
                Annuleer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
