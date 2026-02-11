'use client';

import { motion } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POWER_UP_RULES = [
  {
    name: 'Ballenbak Bizarre',
    emoji: '🟣',
    quota: '1x per maand',
    effect: 'Winnaar stijgt +1 streak per bal die tegenstander nog over had.',
    voorwaarde: 'Min. 3 eigen gekleurde ballen in spel.',
  },
  {
    name: 'Cumback Kid',
    emoji: '🔴',
    quota: '1x per maand',
    effect: 'Verliezer benadert streak van winnaar (streak - 1). Vooraf OF als verliezer inzetbaar.',
    voorwaarde: 'Winnaar die overleeft krijgt +2 bij volgende winst.',
  },
  {
    name: 'Toep',
    emoji: '🟣',
    quota: '5x per maand',
    effect: '+1 streak level. In Live Mode: tegenstander accepteert (stakes omhoog) of weigert (verlies direct).',
    voorwaarde: 'Min. 2 eigen ballen over. Overtoep mogelijk.',
  },
  {
    name: 'Ballenbak',
    emoji: '🔵',
    quota: '5x per maand',
    effect: 'Verliezer betaalt €2 extra per bal die hij nog over had. Winnaar krijgt dit bedrag.',
    voorwaarde: 'Wie inzet maakt niet uit - vraag altijd om ballen bij finish!',
  },
  {
    name: 'Pull The Plug',
    emoji: '🌈',
    quota: '1x per maand',
    effect: 'Reset streak van tegenstander naar 0. Vooraf inzetbaar.',
    voorwaarde: '-',
  },
  {
    name: 'Sniper',
    emoji: '🎯',
    quota: '3x per maand',
    effect: 'Streak bonus: 3 ballen = +1, 4 ballen = +2, 5 = +3, etc.',
    voorwaarde: 'Ballen achter elkaar in één beurt.',
  },
  {
    name: 'Speedpot',
    emoji: '⏱️',
    quota: '2x per maand',
    effect: '5-seconden regel voor tegenstander. Tijdens spel inzetbaar.',
    voorwaarde: '-',
  },
  {
    name: 'Double Trouble',
    emoji: '🟠',
    quota: '3x per maand',
    effect: '2 ballen in 1 stoot. Activeert extra Sniper (start bij 3). Verdubbelt winst bij succes.',
    voorwaarde: 'Success = verdubbeling. Geef ballen in reeks op.',
  },
  {
    name: 'BBC (Black Ball Champ)',
    emoji: '⚫',
    quota: '3x per maand',
    effect: 'Zwarte bal erin bij afstoot = direct winst + €5 bonus.',
    voorwaarde: '-',
  },
];

const STREAK_RULES = [
  'Basis: €0,50 × 2^(streak-1). Streak 1 = €0,50, Streak 2 = €1, etc.',
  'Anti-faillissement: bij >€150 verschil max €10 per potje (+€2 per volgende winst).',
  'Nieuwe maand: alle power-up quotas resetten op de 1e.',
];

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-yellow-500/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-yellow-400" />
            Spelregels
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3">Streak & Bedragen</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              {STREAK_RULES.map((rule, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-yellow-500">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3">Power-ups</h3>
            <div className="space-y-4">
              {POWER_UP_RULES.map((pu, i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{pu.emoji}</span>
                    <h4 className="font-bold text-white">{pu.name}</h4>
                    <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded">
                      {pu.quota}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{pu.effect}</p>
                  {pu.voorwaarde !== '-' && (
                    <p className="text-xs text-gray-400 italic">Voorwaarde: {pu.voorwaarde}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
