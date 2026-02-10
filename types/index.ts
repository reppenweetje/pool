// ============================================================================
// DATA TYPES VOOR POOL COMPETITIE
// ============================================================================

export type PlayerName = 'Jesse' | 'Flip';

export interface PowerUpQuota {
  ballenBakBizarre: number;      // 1x per maand
  cumbackKid: number;             // 1x per maand
  toep: number;                   // 5x per maand
  ballenBak: number;              // 5x per maand
  pullThePlug: number;            // 1x per maand
  sniper: number;                 // 3x per maand
  speedpot: number;               // 2x per maand
  doubleTrouble: number;          // 2x per maand
  // BBC is onbeperkt, dus geen quota
}

export const INITIAL_POWER_UP_QUOTA: PowerUpQuota = {
  ballenBakBizarre: 1,
  cumbackKid: 1,
  toep: 5,
  ballenBak: 5,
  pullThePlug: 1,
  sniper: 3,
  speedpot: 2,
  doubleTrouble: 2,
};

export interface PowerUpUsage {
  ballenBakBizarre?: boolean;     // streak += tegenstander ballen
  cumbackKid?: boolean;           // streak = andere speler streak - 1
  toep?: boolean;                 // Eigen streak +1
  ballenBak?: boolean;            // Tegenstander betaalt €2 per bal
  pullThePlug?: boolean;          // Reset tegenstander streak naar 0
  sniper?: {                      // Bonus voor reeksen
    ballsPotted: number;          // Aantal ballen gepot (3+ = bonus)
    successful: boolean;          // Was de poging succesvol?
  };
  speedpot?: boolean;             // Activeert 5-seconden regel
  doubleTrouble?: {               // Verdubbel de inzet
    ballsPotted: number;          // Aantal ballen gepot
    successful: boolean;          // Was de poging succesvol?
  };
}

export type WinCondition = 'normal' | 'blackBall'; // normal = normaal gewonnen, blackBall = tegenstander potte zwarte bal te vroeg

export interface Player {
  name: PlayerName;
  streak: number;                 // Huidige streak
  monthlyTotal: number;           // Totaal gewonnen deze maand
  powerUpQuota: PowerUpQuota;     // Resterende power-ups deze maand
  ownBallsRemaining?: number;     // Eigen ballen op tafel (voor Toep check)
}

export interface MatchResult {
  id: string;
  timestamp: Date;
  month: string;                  // YYYY-MM format
  winner: PlayerName;
  loser: PlayerName;
  winCondition: WinCondition;     // Hoe is het potje gewonnen?
  opponentBallsRemaining: number; // Ballen van verliezer op tafel
  powerUpsUsed: {
    jesse?: PowerUpUsage;         // Jesse's power-ups (ongeacht win/verlies)
    flip?: PowerUpUsage;          // Flip's power-ups (ongeacht win/verlies)
  };
  // Berekende waarden
  streakBefore: {
    winner: number;
    loser: number;
  };
  streakAfter: {
    winner: number;
    loser: number;
  };
  amountWon: number;              // Werkelijk bedrag gewonnen
  ballenBakBonus?: number;        // Extra boete bij Ballenbak power-up
  blackBallBonus?: boolean;       // €5 bonus voor zwarte bal win
  cappedAmount?: boolean;         // Was de winst gecapt vanwege limiet?
}

export interface GameState {
  jesse: Player;
  flip: Player;
  currentMonth: string;           // YYYY-MM format
  matches: MatchResult[];
  lastMatchId?: string;
}

// ============================================================================
// CONSTANTEN
// ============================================================================

export const BASE_AMOUNT = 0.50;                    // €0,50 basis
export const MAX_DIFFERENCE_THRESHOLD = 150;        // €150 verschil limiet
export const CAPPED_BASE_AMOUNT = 10;               // €10 cap bij limiet
export const CAPPED_INCREMENT = 2;                  // €2 stijging per potje
export const BALLENBAK_PENALTY_PER_BALL = 2;        // €2 per bal bij Ballenbak
export const BLACK_BALL_BONUS = 5;                  // €5 bonus bij zwarte bal win
export const DANGER_ZONE_STREAK = 6;                // Vanaf streak 6 is het gevaarlijk (€16+)

// Sniper bonussen
export function calculateSniperBonus(ballsPotted: number, currentStreak: number): number {
  if (ballsPotted === 3) return 1;                  // +1 level
  if (ballsPotted === 4) return 2;                  // +2 levels
  if (ballsPotted >= 5) return 3;                   // +3 levels
  return 0;
}

// Double Trouble: als succesvol, verdubbel je inzet (streak blijft gelijk maar bedrag x2)
export const DOUBLE_TROUBLE_MULTIPLIER = 2;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Berekent het bedrag voor een gegeven streak
 * Formule: €0,50 × 2^(streak - 1)
 */
export function calculateStreakAmount(streak: number): number {
  if (streak <= 0) return 0;
  return BASE_AMOUNT * Math.pow(2, streak - 1);
}

/**
 * Controleert of de anti-faillissement limiet actief is
 */
export function isCapActive(jesseTotal: number, flipTotal: number): boolean {
  return Math.abs(jesseTotal - flipTotal) > MAX_DIFFERENCE_THRESHOLD;
}

/**
 * Berekent het gecapte bedrag bij actieve limiet
 */
export function calculateCappedAmount(consecutiveWins: number): number {
  return CAPPED_BASE_AMOUNT + (CAPPED_INCREMENT * (consecutiveWins - 1));
}

/**
 * Controleert of een power-up gebruikt kan worden
 */
export function canUsePowerUp(
  player: Player,
  powerUp: keyof PowerUpQuota
): boolean {
  return player.powerUpQuota[powerUp] > 0;
}

/**
 * Controleert of een speler in de gevarenzone zit (hoge streak)
 */
export function isInDangerZone(streak: number): boolean {
  return streak >= DANGER_ZONE_STREAK;
}

/**
 * Genereert een maand string in YYYY-MM formaat
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Controleert of de maand is veranderd (voor reset power-ups)
 */
export function hasMonthChanged(lastMonth: string, currentMonth: string): boolean {
  return lastMonth !== currentMonth;
}
