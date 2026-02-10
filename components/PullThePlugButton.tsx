'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface PullThePlugButtonProps {
  playerName: string;
  targetName: string;
  available: boolean;
  onUse: () => void;
}

export default function PullThePlugButton({ playerName, targetName, available, onUse }: PullThePlugButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (!available) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    // Play laugh sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGJ0fPTgjMGHmq+8OScTgwOUKnn77RgGgU7k9jzy3krBSh+zPLaizsKGWS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zg8L1rIAM0iM/z1YU2Bhxqvu/mnE4MDlCp5++zYBoFOpTX88p3KwUme8rx3Is+CRZgtOnrrVYSC0mi4PG8aB8ENIvR88yAMAYfbL/v5ptPDAsTsOjvrmEZBTqU1/PKdysF'); 
    audio.play().catch(e => console.log('Audio play failed'));
    
    onUse();
    setShowConfirm(false);
  };

  if (!available) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-30">
        <div className="text-[10px] text-gray-600 font-bold uppercase">{playerName}</div>
        <div className="w-14 h-14 rounded-full bg-gray-800/50 flex items-center justify-center border-2 border-gray-700">
          <div className="text-2xl">🌈</div>
        </div>
        <div className="text-[8px] text-gray-600">Gebruikt</div>
      </div>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.15, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className="relative flex flex-col items-center gap-1"
      >
        <div className="text-[10px] text-white font-bold uppercase tracking-wider">{playerName}</div>
        
        {/* Rainbow glow effect */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 30px rgba(255,0,0,0.8)',
              '0 0 30px rgba(255,165,0,0.8)',
              '0 0 30px rgba(255,255,0,0.8)',
              '0 0 30px rgba(0,255,0,0.8)',
              '0 0 30px rgba(0,0,255,0.8)',
              '0 0 30px rgba(75,0,130,0.8)',
              '0 0 30px rgba(238,130,238,0.8)',
              '0 0 30px rgba(255,0,0,0.8)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full top-5"
        />
        
        {/* Rainbow Button */}
        <motion.div
          animate={{
            background: [
              'linear-gradient(0deg, #ff0000, #ff7f00)',
              'linear-gradient(51deg, #ff7f00, #ffff00)',
              'linear-gradient(102deg, #ffff00, #00ff00)',
              'linear-gradient(153deg, #00ff00, #0000ff)',
              'linear-gradient(204deg, #0000ff, #4b0082)',
              'linear-gradient(255deg, #4b0082, #9400d3)',
              'linear-gradient(306deg, #9400d3, #ff0000)',
              'linear-gradient(357deg, #ff0000, #ff7f00)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 rounded-full flex items-center justify-center relative border-2 border-white shadow-2xl"
        >
          <div className="text-3xl">🌈</div>
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-[8px] text-white font-bold uppercase tracking-wide"
        >
          PLUG
        </motion.div>
      </motion.button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-900 to-red-900 rounded-3xl p-8 max-w-md border-4 border-red-500"
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🌈</div>
              <h2 className="text-3xl font-black text-white">
                PULL THE PLUG
              </h2>
            </div>
            <p className="text-white text-center mb-2 text-xl font-bold">
              {playerName} reset {targetName}&apos;s streak naar 0!
            </p>
            <p className="text-sm text-gray-400 text-center mb-6 italic">
              Dit kan maar 1x per maand! Weet je het zeker?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleConfirm}
                className="py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
              >
                JA, RESET!
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="py-4 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
              >
                Annuleren
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
