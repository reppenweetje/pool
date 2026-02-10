'use client';

import { Player, calculateStreakAmount, isInDangerZone, DANGER_ZONE_STREAK } from '@/types';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Zap } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isWinning?: boolean;
}

export default function PlayerCard({ player, isWinning }: PlayerCardProps) {
  const streakAmount = calculateStreakAmount(player.streak);
  const isDangerous = isInDangerZone(player.streak);
  const isVeryDangerous = player.streak >= DANGER_ZONE_STREAK + 2;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        relative overflow-hidden rounded-3xl p-6 
        ${isDangerous ? 'danger-zone' : ''}
        ${isVeryDangerous ? 'bg-gradient-to-br from-red-900 to-orange-900' : 
          isDangerous ? 'bg-gradient-to-br from-orange-800 to-yellow-800' :
          'bg-gradient-to-br from-poolGreen to-poolFelt'}
        ${isWinning ? 'ring-4 ring-yellow-400' : ''}
      `}
    >
      {/* Speler naam */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-white">
          {player.name}
        </h2>
        {isWinning && (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
          </motion.div>
        )}
      </div>

      {/* Streak */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame className={`w-6 h-6 ${isDangerous ? 'text-red-400' : 'text-orange-400'}`} />
          <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Streak
          </span>
        </div>
        <motion.div
          key={player.streak}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-6xl font-black text-white"
        >
          {player.streak}
        </motion.div>
        <div className="text-xl font-bold text-yellow-300 mt-1">
          €{streakAmount.toFixed(2)}
        </div>
        {isDangerous && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-sm font-bold text-red-300 mt-2"
          >
            ⚠️ DANGER ZONE
          </motion.div>
        )}
      </div>

      {/* Maandtotaal */}
      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Deze maand
          </span>
        </div>
        <div className="text-3xl font-bold text-white">
          €{player.monthlyTotal.toFixed(2)}
        </div>
      </div>

      {/* Power-ups samenvatting */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Power-ups beschikbaar
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-bold text-white">{player.powerUpQuota.ballenBakBizarre}</div>
            <div className="text-gray-400">BBB</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-white">{player.powerUpQuota.cumbackKid}</div>
            <div className="text-gray-400">CK</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-white">{player.powerUpQuota.toep}</div>
            <div className="text-gray-400">Toep</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-white">{player.powerUpQuota.sniper}</div>
            <div className="text-gray-400">Sniper</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
