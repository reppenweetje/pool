'use client';

import { Player, calculateStreakAmount, isInDangerZone, DANGER_ZONE_STREAK } from '@/types';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Zap, Crown } from 'lucide-react';

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
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`
        relative overflow-hidden rounded-xl p-3 md:p-4
        ${isDangerous ? 'danger-zone' : ''}
        ${isVeryDangerous ? 'bg-gradient-to-br from-red-900 via-red-800 to-orange-900' : 
          isDangerous ? 'bg-gradient-to-br from-orange-800 via-orange-700 to-yellow-800' :
          'bg-gradient-to-br from-poolGreen via-poolFelt to-emerald-800'}
        ${isWinning ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50' : ''}
      `}
    >
      {/* Speler naam - Compacter voor mobile */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          {player.name}
          {isWinning && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" fill="currentColor" />
            </motion.div>
          )}
        </h2>
      </div>

      {/* Streak & Bedrag Combined - Mobile optimized */}
      <div className="mb-2 relative">
        {/* On Fire Badge - bij streak > 0 */}
        {player.streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 z-10"
          >
            <motion.div
              animate={{
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-1 md:p-1.5 shadow-lg shadow-orange-500/50"
            >
              <Flame className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" />
            </motion.div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[7px] md:text-[8px] font-black text-orange-400 uppercase tracking-wider drop-shadow-lg"
              >
                ON FIRE
              </motion.span>
            </div>
          </motion.div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 md:gap-2">
            <motion.div
              animate={isDangerous ? { 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 0.5, repeat: isDangerous ? Infinity : 0, repeatDelay: 1 }}
            >
              <Flame className={`w-4 h-4 md:w-5 md:h-5 ${isDangerous ? 'text-red-400' : 'text-orange-400'}`} 
                fill={isDangerous ? 'currentColor' : 'none'} />
            </motion.div>
            <motion.div
              key={player.streak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl md:text-4xl font-black text-white"
            >
              {player.streak}
            </motion.div>
          </div>
          <motion.div
            key={streakAmount}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`text-xl md:text-2xl font-bold ${isDangerous ? 'text-red-300' : 'text-yellow-300'}`}
          >
            €{streakAmount.toFixed(2)}
          </motion.div>
        </div>
        {isDangerous && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[10px] md:text-xs font-bold text-red-300 mt-0.5 uppercase tracking-wider"
          >
            ⚠️ DANGER ZONE
          </motion.div>
        )}
      </div>

      {/* Maandtotaal - Compacter */}
      <div className="border-t border-white/20 pt-1.5 pb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
            <span className="text-[10px] md:text-xs font-semibold text-gray-300 uppercase">
              Deze maand
            </span>
          </div>
          <div className="text-lg md:text-xl font-bold text-white">
            €{player.monthlyTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Power-ups samenvatting - Extra compact voor mobile */}
      <div className="pt-1.5 border-t border-white/20">
        <div className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-wide mb-1">
          Power-ups
        </div>
        <div className="grid grid-cols-5 gap-0.5 md:gap-1 text-[9px] md:text-[10px]">
          <div className="text-center bg-purple-900/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.ballenBakBizarre}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">BBB</div>
          </div>
          <div className="text-center bg-green-900/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.cumbackKid}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">Cmb</div>
          </div>
          <div className="text-center bg-blue-900/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.toep}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">Toep</div>
          </div>
          <div className="text-center bg-red-900/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.ballenBak}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">BB</div>
          </div>
          <div className="text-center bg-red-800/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.pullThePlug}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">Plug</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-0.5 md:gap-1 text-[9px] md:text-[10px] mt-0.5 md:mt-1">
          <div className="text-center bg-yellow-900/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.sniper}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">Sniper</div>
          </div>
          <div className="text-center bg-pink-900/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.doubleTrouble}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">Dbl</div>
          </div>
          <div className="text-center bg-orange-900/40 rounded px-0.5 md:px-1 py-0.5 md:py-1">
            <div className="font-bold text-white text-xs md:text-sm">{player.powerUpQuota.speedpot}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">Speed</div>
          </div>
          <div className="text-center bg-black/60 rounded px-0.5 md:px-1 py-0.5 md:py-1 ring-1 ring-yellow-600/50">
            <div className="font-bold text-yellow-400 text-xs md:text-sm">{player.powerUpQuota.bbc}</div>
            <div className="text-gray-400 text-[8px] md:text-[10px]">BBC</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
