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
};

export interface PowerUpUsage {
  ballenBakBizarre?: boolean;     // Winnaar: streak += tegenstander ballen
  cumbackKid?: boolean;           // Verliezer: streak = winnaar streak - 1
  toep?: boolean;                 // Eigen streak +1
  ballenBak?: boolean;            // Verliezer betaalt €2 per bal
  pullThePlug?: boolean;          // Reset tegenstander streak naar 0
  sniper?: {                      // 3 ballen = +1 level, 4 ballen = x2 levels
    ballsPotted: 3 | 4;
  };
  speedpot?: boolean;             // Activeert 5-seconden regel
  bbc?: boolean;                  // Zwarte bal bij afstoot = €5 bonus
}

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
  opponentBallsRemaining: number; // Ballen van verliezer op tafel
  powerUpsUsed: {
    winner?: PowerUpUsage;
    loser?: PowerUpUsage;
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
  bbcBonus?: boolean;             // €5 bonus voor zwarte bal
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
export const BBC_BONUS = 5;                         // €5 bonus bij BBC
export const DANGER_ZONE_STREAK = 6;                // Vanaf streak 6 is het gevaarlijk (€16+)

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
