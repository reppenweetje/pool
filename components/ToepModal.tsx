'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X, Flame, Zap } from 'lucide-react';
import { PlayerName } from '@/types';

interface ToepModalProps {
  isOpen: boolean;
  initiator: PlayerName;
  responder: PlayerName;
  currentStake: number;
  onAccept: () => void;
  onReject: () => void;
}

export default function ToepModal({
  isOpen,
  initiator,
  responder,
  currentStake,
  onAccept,
  onReject,
}: ToepModalProps) {
  if (!isOpen) return null;

  // Als currentStake 1 is, dan is het de EERSTE toep (0→1)
  // Als currentStake > 1 is, dan is het een OVERtoep (1→2, 2→3, etc)
  const isFirstToep = currentStake === 1;
  const actionWord = isFirstToep ? 'GETOEPT' : 'OVERGETOEPT';
  const newStake = currentStake + 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      >
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900/50 rounded-3xl p-8 max-w-lg w-full border-4 border-orange-500/50 shadow-2xl shadow-orange-500/30"
        >
          {/* Fire animation at top */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Flame className="w-24 h-24 text-orange-500" fill="currentColor" />
            </motion.div>
          </div>

          {/* Alert Icon */}
          <div className="flex justify-center mb-6 mt-8">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [-5, 5, -5],
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="p-4 bg-orange-500/20 rounded-full"
            >
              <AlertTriangle className="w-16 h-16 text-orange-400" />
            </motion.div>
          </div>

          {/* Header */}
          <motion.h2
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-4xl font-black text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-400"
          >
            {actionWord}!
          </motion.h2>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-2xl font-bold text-white mb-3">
              {initiator} heeft {isFirstToep ? 'getoept' : 'overgetoept'}!
            </p>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-5xl font-black text-yellow-400 mb-3"
            >
              {newStake}x STREAKS
            </motion.div>
            <p className="text-lg text-gray-300 mb-2">
              <span className="font-bold text-white">{responder}</span>, accepteer je deze toep?
            </p>
            <p className="text-sm text-gray-400 italic">
              De winnaar krijgt {newStake} streak{newStake > 1 ? 's' : ''} in plaats van 1
            </p>
          </div>

          {/* Action Buttons met Uitleg */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAccept}
              className="pool-button bg-gradient-to-br from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 shadow-lg shadow-green-500/50 flex flex-col items-center justify-center gap-2"
            >
              <Check className="w-8 h-8" />
              <div className="text-lg font-black">ACCEPTEREN</div>
              <div className="text-xs opacity-90">
                Speel om {newStake} streak{newStake > 1 ? 's' : ''}
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReject}
              className="pool-button bg-gradient-to-br from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/50 flex flex-col items-center justify-center gap-2"
            >
              <X className="w-8 h-8" />
              <div className="text-lg font-black">WEIGEREN</div>
              <div className="text-xs opacity-90">
                Verlies direct (1 streak)
              </div>
            </motion.button>
          </div>

          {/* Warning pulse effect */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-4 border-orange-500 rounded-3xl pointer-events-none"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
