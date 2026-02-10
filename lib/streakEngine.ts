// ============================================================================
// STREAK ENGINE - De wiskundige kern van het pool spel
// ============================================================================

import {
  Player,
  PlayerName,
  MatchResult,
  PowerUpUsage,
  GameState,
  calculateStreakAmount,
  isCapActive,
  calculateCappedAmount,
  BALLENBAK_PENALTY_PER_BALL,
  BBC_BONUS,
  INITIAL_POWER_UP_QUOTA,
  getCurrentMonth,
  hasMonthChanged,
} from '@/types';

interface CalculateMatchParams {
  gameState: GameState;
  winner: PlayerName;
  opponentBallsRemaining: number;
  powerUpsUsed: {
    winner?: PowerUpUsage;
    loser?: PowerUpUsage;
  };
  winnerOwnBalls?: number;  // Eigen ballen winnaar (voor Toep/Ballenbak Bizarre check)
}

interface CalculateMatchResult {
  newGameState: GameState;
  matchResult: MatchResult;
}

/**
 * HOOFDFUNCTIE: Berekent de nieuwe streaks, bedragen en update de game state
 * Dit is de kern van het spel - alle regels komen hier samen
 */
export function calculateMatch(params: CalculateMatchParams): CalculateMatchResult {
  const { gameState, winner, opponentBallsRemaining, powerUpsUsed, winnerOwnBalls = 0 } = params;
  
  const loser: PlayerName = winner === 'Jesse' ? 'Flip' : 'Jesse';
  const winnerPlayer = { ...gameState[winner.toLowerCase() as 'jesse' | 'flip'] };
  const loserPlayer = { ...gameState[loser.toLowerCase() as 'jesse' | 'flip'] };
  
  // Check of we in een nieuwe maand zijn (reset power-ups)
  const currentMonth = getCurrentMonth();
  if (hasMonthChanged(gameState.currentMonth, currentMonth)) {
    winnerPlayer.powerUpQuota = { ...INITIAL_POWER_UP_QUOTA };
    loserPlayer.powerUpQuota = { ...INITIAL_POWER_UP_QUOTA };
  }

  // Bewaar de oude streaks
  const streakBefore = {
    winner: winnerPlayer.streak,
    loser: loserPlayer.streak,
  };

  // ============================================================================
  // FASE 1: POWER-UPS VAN DE VERLIEZER (voor streak berekening)
  // ============================================================================
  
  let loserUsedCumbackKid = false;
  
  if (powerUpsUsed.loser?.cumbackKid) {
    // Cumback Kid: Verliezer neemt (winnaar streak - 1)
    loserPlayer.streak = Math.max(0, winnerPlayer.streak - 1);
    loserPlayer.powerUpQuota.cumbackKid--;
    loserUsedCumbackKid = true;
  }

  // ============================================================================
  // FASE 2: PRE-MATCH POWER-UPS VAN DE WINNAAR
  // ============================================================================
  
  let sniperBonus = 0;
  let pullThePlugUsed = false;

  // TOEP: Winnaar verhoogt zijn eigen streak met +1
  if (powerUpsUsed.winner?.toep) {
    if (winnerOwnBalls >= 2) {
      winnerPlayer.streak += 1;
      winnerPlayer.powerUpQuota.toep--;
    } else {
      throw new Error('Toep kan alleen gebruikt worden met minimaal 2 eigen ballen op tafel');
    }
  }

  // PULL THE PLUG: Reset tegenstander streak naar 0
  if (powerUpsUsed.winner?.pullThePlug) {
    loserPlayer.streak = 0;
    winnerPlayer.powerUpQuota.pullThePlug--;
    pullThePlugUsed = true;
  }

  // SNIPER: Bonus voor series
  if (powerUpsUsed.winner?.sniper) {
    const ballsPotted = powerUpsUsed.winner.sniper.ballsPotted;
    if (ballsPotted === 3) {
      sniperBonus = 1; // +1 level
    } else if (ballsPotted === 4) {
      sniperBonus = winnerPlayer.streak; // x2 (huidige streak nog een keer erbij)
    }
    winnerPlayer.powerUpQuota.sniper--;
  }

  // ============================================================================
  // FASE 3: BASIS STREAK BEREKENING
  // ============================================================================
  
  let newWinnerStreak = winnerPlayer.streak;
  let newLoserStreak = loserPlayer.streak;

  if (loserUsedCumbackKid) {
    // Als verliezer Cumback Kid gebruikte EN winnaar wint toch:
    // Winnaar krijgt +2 (Streaker bonus)
    newWinnerStreak = winnerPlayer.streak + 2;
    // Verliezer heeft al zijn nieuwe streak gekregen in fase 1
  } else {
    // Normale streak progression
    newWinnerStreak = winnerPlayer.streak + 1;
    newLoserStreak = 0; // Verliezer reset naar 0
  }

  // ============================================================================
  // FASE 4: BALLENBAK BIZARRE
  // ============================================================================
  
  if (powerUpsUsed.winner?.ballenBakBizarre) {
    if (winnerOwnBalls >= 3) {
      // Winnaar krijgt bonus streak gelijk aan tegenstander ballen
      newWinnerStreak += opponentBallsRemaining;
      winnerPlayer.powerUpQuota.ballenBakBizarre--;
    } else {
      throw new Error('Ballenbak Bizarre kan alleen gebruikt worden met minimaal 3 eigen ballen');
    }
  }

  // ============================================================================
  // FASE 5: SNIPER BONUS TOEPASSEN
  // ============================================================================
  
  newWinnerStreak += sniperBonus;

  // ============================================================================
  // FASE 6: BEDRAG BEREKENING
  // ============================================================================
  
  let amountWon = calculateStreakAmount(newWinnerStreak);
  let cappedAmount = false;

  // Check anti-faillissement limiet
  if (isCapActive(
    winner === 'Jesse' ? winnerPlayer.monthlyTotal : loserPlayer.monthlyTotal,
    winner === 'Jesse' ? loserPlayer.monthlyTotal : winnerPlayer.monthlyTotal
  )) {
    // Tel aantal consecutieve wins (voor capped increment)
    const recentWins = gameState.matches
      .filter(m => m.month === currentMonth && m.winner === winner)
      .length;
    
    const cappedMax = calculateCappedAmount(recentWins + 1);
    
    if (amountWon > cappedMax) {
      amountWon = cappedMax;
      cappedAmount = true;
    }
  }

  // ============================================================================
  // FASE 7: BALLENBAK BONUS (Extra penalty)
  // ============================================================================
  
  let ballenBakBonus = 0;
  if (powerUpsUsed.winner?.ballenBak) {
    ballenBakBonus = opponentBallsRemaining * BALLENBAK_PENALTY_PER_BALL;
    winnerPlayer.powerUpQuota.ballenBak--;
  }

  // ============================================================================
  // FASE 8: BBC BONUS
  // ============================================================================
  
  let bbcBonus = false;
  if (powerUpsUsed.winner?.bbc) {
    amountWon += BBC_BONUS;
    bbcBonus = true;
    // BBC is onbeperkt, geen quota aftrek
  }

  // ============================================================================
  // FASE 9: SPEEDPOT (alleen tracking)
  // ============================================================================
  
  if (powerUpsUsed.winner?.speedpot) {
    winnerPlayer.powerUpQuota.speedpot--;
    // Speedpot heeft geen effect op bedragen, alleen op gameplay
  }

  // ============================================================================
  // FASE 10: TOTALEN UPDATEN
  // ============================================================================
  
  const totalWon = amountWon + ballenBakBonus;
  winnerPlayer.monthlyTotal += totalWon;

  // Update streaks
  winnerPlayer.streak = newWinnerStreak;
  loserPlayer.streak = newLoserStreak;

  // ============================================================================
  // FASE 11: MATCH RESULT OBJECT CREËREN
  // ============================================================================
  
  const matchResult: MatchResult = {
    id: `match-${Date.now()}`,
    timestamp: new Date(),
    month: currentMonth,
    winner,
    loser,
    opponentBallsRemaining,
    powerUpsUsed,
    streakBefore,
    streakAfter: {
      winner: newWinnerStreak,
      loser: newLoserStreak,
    },
    amountWon,
    ballenBakBonus: ballenBakBonus > 0 ? ballenBakBonus : undefined,
    bbcBonus,
    cappedAmount,
  };

  // ============================================================================
  // FASE 12: NIEUWE GAME STATE SAMENSTELLEN
  // ============================================================================
  
  const newGameState: GameState = {
    ...gameState,
    [winner.toLowerCase()]: winnerPlayer,
    [loser.toLowerCase()]: loserPlayer,
    currentMonth,
    matches: [...gameState.matches, matchResult],
    lastMatchId: matchResult.id,
  };

  return {
    newGameState,
    matchResult,
  };
}

/**
 * Initialiseert een nieuwe game state
 */
export function initializeGameState(): GameState {
  const currentMonth = getCurrentMonth();
  
  return {
    jesse: {
      name: 'Jesse',
      streak: 0,
      monthlyTotal: 0,
      powerUpQuota: { ...INITIAL_POWER_UP_QUOTA },
    },
    flip: {
      name: 'Flip',
      streak: 0,
      monthlyTotal: 0,
      powerUpQuota: { ...INITIAL_POWER_UP_QUOTA },
    },
    currentMonth,
    matches: [],
  };
}

/**
 * Reset power-ups aan het begin van een nieuwe maand
 */
export function resetMonthlyStats(gameState: GameState): GameState {
  return {
    ...gameState,
    jesse: {
      ...gameState.jesse,
      monthlyTotal: 0,
      powerUpQuota: { ...INITIAL_POWER_UP_QUOTA },
    },
    flip: {
      ...gameState.flip,
      monthlyTotal: 0,
      powerUpQuota: { ...INITIAL_POWER_UP_QUOTA },
    },
    currentMonth: getCurrentMonth(),
  };
}

/**
 * Verwijdert een match uit de geschiedenis (voor correcties)
 */
export function removeMatch(gameState: GameState, matchId: string): GameState {
  const matchToRemove = gameState.matches.find(m => m.id === matchId);
  if (!matchToRemove) {
    throw new Error('Match niet gevonden');
  }

  // Herbereken de game state vanaf scratch zonder deze match
  const matchesWithoutRemoved = gameState.matches.filter(m => m.id !== matchId);
  
  let newState = initializeGameState();
  
  // Replay alle matches behalve de verwijderde
  for (const match of matchesWithoutRemoved) {
    const result = calculateMatch({
      gameState: newState,
      winner: match.winner,
      opponentBallsRemaining: match.opponentBallsRemaining,
      powerUpsUsed: match.powerUpsUsed,
    });
    newState = result.newGameState;
  }

  return newState;
}
