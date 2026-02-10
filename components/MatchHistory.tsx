'use client';

import { MatchResult } from '@/types';
import { Trash2, TrendingUp, Flame, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface MatchHistoryProps {
  matches: MatchResult[];
  onRemoveMatch: (matchId: string) => void;
}

export default function MatchHistory({ matches, onRemoveMatch }: MatchHistoryProps) {
  // Sorteer matches van nieuw naar oud
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Nog geen potjes gespeeld deze maand</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedMatches.map((match, index) => {
        const totalAmount = match.amountWon + (match.ballenBakBonus || 0);
        const powerUpsUsed = [
          ...(match.powerUpsUsed.winner ? Object.keys(match.powerUpsUsed.winner) : []),
          ...(match.powerUpsUsed.loser ? Object.keys(match.powerUpsUsed.loser) : []),
        ];

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-4 relative overflow-hidden"
          >
            {/* Timestamp */}
            <div className="text-xs text-gray-400 mb-2">
              {format(new Date(match.timestamp), 'dd/MM/yyyy HH:mm')}
            </div>

            {/* Match info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-white">
                  {match.winner}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Flame className="w-4 h-4" />
                  <span>{match.streakBefore.winner} → {match.streakAfter.winner}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  +€{totalAmount.toFixed(2)}
                </div>
                {match.cappedAmount && (
                  <div className="text-xs text-orange-400 font-semibold">
                    (gecapt)
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
              <div>
                {match.loser}: {match.opponentBallsRemaining} ballen over
              </div>
              {match.bbcBonus && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Gift className="w-4 h-4" />
                  <span>BBC +€5</span>
                </div>
              )}
              {match.ballenBakBonus && (
                <div className="flex items-center gap-1 text-red-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Ballenbak +€{match.ballenBakBonus.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Power-ups gebruikt */}
            {powerUpsUsed.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {match.powerUpsUsed.winner?.ballenBakBizarre && (
                  <span className="px-2 py-1 text-xs font-semibold bg-purple-600/30 text-purple-300 rounded-lg">
                    BBB
                  </span>
                )}
                {match.powerUpsUsed.loser?.cumbackKid && (
                  <span className="px-2 py-1 text-xs font-semibold bg-green-600/30 text-green-300 rounded-lg">
                    Cumback Kid
                  </span>
                )}
                {match.powerUpsUsed.winner?.toep && (
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-600/30 text-blue-300 rounded-lg">
                    Toep
                  </span>
                )}
                {match.powerUpsUsed.winner?.ballenBak && (
                  <span className="px-2 py-1 text-xs font-semibold bg-red-600/30 text-red-300 rounded-lg">
                    Ballenbak
                  </span>
                )}
                {match.powerUpsUsed.winner?.pullThePlug && (
                  <span className="px-2 py-1 text-xs font-semibold bg-red-800/30 text-red-300 rounded-lg">
                    Pull The Plug
                  </span>
                )}
                {match.powerUpsUsed.winner?.sniper && (
                  <span className="px-2 py-1 text-xs font-semibold bg-yellow-600/30 text-yellow-300 rounded-lg">
                    Sniper ({match.powerUpsUsed.winner.sniper.ballsPotted})
                  </span>
                )}
                {match.powerUpsUsed.winner?.speedpot && (
                  <span className="px-2 py-1 text-xs font-semibold bg-orange-600/30 text-orange-300 rounded-lg">
                    Speedpot
                  </span>
                )}
              </div>
            )}

            {/* Delete button */}
            <button
              onClick={() => {
                if (confirm(`Weet je zeker dat je dit potje wilt verwijderen?`)) {
                  onRemoveMatch(match.id);
                }
              }}
              className="absolute top-4 right-4 p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
