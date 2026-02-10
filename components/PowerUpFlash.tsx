'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

interface PowerUpFlashProps {
  isVisible: boolean;
  powerUpName: string;
  playerName: string;
}

export default function PowerUpFlash({ isVisible, powerUpName, playerName }: PowerUpFlashProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        {/* Background flash */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-yellow-500"
        />

        {/* Power-up announcement */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-8 border-4 border-white shadow-2xl"
        >
          {/* Sparkles */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute -top-4 -right-4"
          >
            <Sparkles className="w-12 h-12 text-yellow-300" fill="currentColor" />
          </motion.div>
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-4 -left-4"
          >
            <Sparkles className="w-12 h-12 text-yellow-300" fill="currentColor" />
          </motion.div>

          <div className="text-center">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Zap className="w-16 h-16 text-yellow-300 mx-auto mb-4" fill="currentColor" />
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-2">
              POWER-UP!
            </h2>
            <p className="text-2xl font-bold text-yellow-300">
              {playerName}
            </p>
            <p className="text-xl text-white mt-2">
              gebruikt {powerUpName}!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
