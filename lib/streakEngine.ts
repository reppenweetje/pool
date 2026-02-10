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
  calculateSniperBonus,
  BALLENBAK_PENALTY_PER_BALL,
  BLACK_BALL_BONUS,
  DOUBLE_TROUBLE_MULTIPLIER,
  INITIAL_POWER_UP_QUOTA,
  getCurrentMonth,
  hasMonthChanged,
} from '@/types';

interface CalculateMatchParams {
  gameState: GameState;
  winner: PlayerName;
  winCondition: 'normal';
  opponentBallsRemaining: number;
  powerUpsUsed: {
    jesse?: PowerUpUsage;
    flip?: PowerUpUsage;
  };
  jesseOwnBalls?: number;
  flipOwnBalls?: number;
  toepStakeMultiplier?: number; // Voor live games met toep (1=normaal, 2=getoept, 3=overgetoept, etc.)
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
  const { gameState, winner, opponentBallsRemaining, powerUpsUsed, jesseOwnBalls = 0, flipOwnBalls = 0, toepStakeMultiplier = 1 } = params;
  
  const loser: PlayerName = winner === 'Jesse' ? 'Flip' : 'Jesse';
  const jessePlayer = { ...gameState.jesse };
  const flipPlayer = { ...gameState.flip };
  
  // Check of we in een nieuwe maand zijn (reset power-ups)
  const currentMonth = getCurrentMonth();
  if (hasMonthChanged(gameState.currentMonth, currentMonth)) {
    jessePlayer.powerUpQuota = { ...INITIAL_POWER_UP_QUOTA };
    flipPlayer.powerUpQuota = { ...INITIAL_POWER_UP_QUOTA };
  }

  const jessePowerUps = powerUpsUsed.jesse || {};
  const flipPowerUps = powerUpsUsed.flip || {};
  const winnerPowerUps = winner === 'Jesse' ? jessePowerUps : flipPowerUps;
  const loserPowerUps = winner === 'Jesse' ? flipPowerUps : jessePowerUps;

  // Bewaar de oude streaks
  const streakBefore = {
    winner: winner === 'Jesse' ? jessePlayer.streak : flipPlayer.streak,
    loser: winner === 'Jesse' ? flipPlayer.streak : jessePlayer.streak,
  };

  // ============================================================================
  // FASE 1: PRE-MATCH POWER-UPS (beide spelers)
  // ============================================================================
  
  // TOEP voor Jesse (alleen in Regular mode, in Live Mode wordt het gebruikt voor toep/overtoep)
  // Check if toepStakeMultiplier > 1, dan is TOEP gebruikt in Live Mode
  if (toepStakeMultiplier > 1) {
    // In Live Mode: Trek toep af voor elke toegepaste toep
    // Elke toep/overtoep kost 1 power-up van de initiator
    const toepCount = toepStakeMultiplier - 1; // Als stake 3 is, zijn er 2 toeps gebeurd
    
    // We weten niet exact wie welke toep heeft gedaan, maar we kunnen aannemen
    // dat beide spelers evenredig hebben bijgedragen als ze allebei toep hebben in powerUps
    if (jessePowerUps.toep) {
      jessePlayer.powerUpQuota.toep = Math.max(0, jessePlayer.powerUpQuota.toep - 1);
    }
    if (flipPowerUps.toep) {
      flipPlayer.powerUpQuota.toep = Math.max(0, flipPlayer.powerUpQuota.toep - 1);
    }
  } else {
    // Regular mode: Toep geeft +1 streak
    if (jessePowerUps.toep) {
      jessePlayer.streak += 1;
      jessePlayer.powerUpQuota.toep--;
    }
    
    if (flipPowerUps.toep) {
      flipPlayer.streak += 1;
      flipPlayer.powerUpQuota.toep--;
    }
  }

  // PULL THE PLUG (alleen als toepStakeMultiplier !== 0, want bij 0 is het een vooraf-actie)
  if (toepStakeMultiplier !== 0) {
    if (jessePowerUps.pullThePlug) {
      flipPlayer.streak = 0;
      jessePlayer.powerUpQuota.pullThePlug--;
    }
    if (flipPowerUps.pullThePlug) {
      jessePlayer.streak = 0;
      flipPlayer.powerUpQuota.pullThePlug--;
    }
  }

  // CUMBACK KID - verliezer kan dit gebruiken
  let loserUsedCumbackKid = false;
  if (loserPowerUps.cumbackKid) {
    const winnerCurrentStreak = winner === 'Jesse' ? jessePlayer.streak : flipPlayer.streak;
    const newLoserStreak = Math.max(0, winnerCurrentStreak - 1);
    
    if (loser === 'Jesse') {
      jessePlayer.streak = newLoserStreak;
      jessePlayer.powerUpQuota.cumbackKid--;
    } else {
      flipPlayer.streak = newLoserStreak;
      flipPlayer.powerUpQuota.cumbackKid--;
    }
    loserUsedCumbackKid = true;
  }

  // ============================================================================
  // FASE 2: BASIS STREAK BEREKENING
  // ============================================================================
  
  let newWinnerStreak = winner === 'Jesse' ? jessePlayer.streak : flipPlayer.streak;
  let newLoserStreak = winner === 'Jesse' ? flipPlayer.streak : jessePlayer.streak;

  if (loserUsedCumbackKid) {
    // Als verliezer Cumback Kid gebruikte EN winnaar wint toch:
    // Winnaar krijgt +2 (Streaker bonus) * toep multiplier
    newWinnerStreak = newWinnerStreak + (2 * toepStakeMultiplier);
    // Verliezer behoudt zijn cumback streak
  } else {
    // Normale streak progression * toep multiplier
    newWinnerStreak = newWinnerStreak + (1 * toepStakeMultiplier);
    newLoserStreak = 0; // Verliezer reset naar 0
  }

  // ============================================================================
  // FASE 3: POST-MATCH STREAK BONUSSEN
  // ============================================================================
  
  // BALLENBAK BIZARRE
  if (winnerPowerUps.ballenBakBizarre) {
    newWinnerStreak += opponentBallsRemaining;
    if (winner === 'Jesse') {
      jessePlayer.powerUpQuota.ballenBakBizarre--;
    } else {
      flipPlayer.powerUpQuota.ballenBakBizarre--;
    }
  }

  // SNIPER - met succescheck en reeks lengte
  if (winnerPowerUps.sniper?.successful) {
    const sniperBonus = calculateSniperBonus(winnerPowerUps.sniper.ballsPotted, newWinnerStreak);
    newWinnerStreak += sniperBonus;
    if (winner === 'Jesse') {
      jessePlayer.powerUpQuota.sniper--;
    } else {
      flipPlayer.powerUpQuota.sniper--;
    }
  }

  // Update de streaks
  if (winner === 'Jesse') {
    jessePlayer.streak = newWinnerStreak;
    flipPlayer.streak = newLoserStreak;
  } else {
    flipPlayer.streak = newWinnerStreak;
    jessePlayer.streak = newLoserStreak;
  }

  // ============================================================================
  // FASE 4: BEDRAG BEREKENING
  // ============================================================================
  
  let amountWon = calculateStreakAmount(newWinnerStreak);
  let cappedAmount = false;

  // DOUBLE TROUBLE - verdubbel de inzet als succesvol
  let doubleTroubleActive = false;
  if (winnerPowerUps.doubleTrouble?.successful) {
    amountWon *= DOUBLE_TROUBLE_MULTIPLIER;
    doubleTroubleActive = true;
    if (winner === 'Jesse') {
      jessePlayer.powerUpQuota.doubleTrouble--;
    } else {
      flipPlayer.powerUpQuota.doubleTrouble--;
    }
  }

  // Check anti-faillissement limiet
  if (isCapActive(jessePlayer.monthlyTotal, flipPlayer.monthlyTotal)) {
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
  // FASE 5: EXTRA BONUSSEN
  // ============================================================================
  
  // BALLENBAK BONUS (Extra penalty)
  let ballenBakBonus = 0;
  if (winnerPowerUps.ballenBak) {
    ballenBakBonus = opponentBallsRemaining * BALLENBAK_PENALTY_PER_BALL;
    if (winner === 'Jesse') {
      jessePlayer.powerUpQuota.ballenBak--;
    } else {
      flipPlayer.powerUpQuota.ballenBak--;
    }
  }

  // BBC BONUS (zwarte bal bij afstoot power-up)
  let blackBallBonus = false;
  if (winnerPowerUps.bbc) {
    amountWon += BLACK_BALL_BONUS;
    blackBallBonus = true;
    if (winner === 'Jesse') {
      jessePlayer.powerUpQuota.bbc--;
    } else {
      flipPlayer.powerUpQuota.bbc--;
    }
  }

  // ============================================================================
  // FASE 6: SPEEDPOT (alleen tracking, geen effect op bedrag)
  // ============================================================================
  
  if (jessePowerUps.speedpot) {
    jessePlayer.powerUpQuota.speedpot--;
  }
  if (flipPowerUps.speedpot) {
    flipPlayer.powerUpQuota.speedpot--;
  }

  // ============================================================================
  // FASE 7: TOTALEN UPDATEN
  // ============================================================================
  
  const totalWon = amountWon + ballenBakBonus;
  if (winner === 'Jesse') {
    jessePlayer.monthlyTotal += totalWon;
  } else {
    flipPlayer.monthlyTotal += totalWon;
  }

  // ============================================================================
  // FASE 8: MATCH RESULT OBJECT CREËREN
  // ============================================================================
  
  const matchResult: MatchResult = {
    id: `match-${Date.now()}`,
    timestamp: new Date(),
    month: currentMonth,
    winner,
    loser,
    winCondition: 'normal',
    opponentBallsRemaining,
    powerUpsUsed: {
      jesse: Object.keys(jessePowerUps).length > 0 ? jessePowerUps : undefined,
      flip: Object.keys(flipPowerUps).length > 0 ? flipPowerUps : undefined,
    },
    streakBefore,
    streakAfter: {
      winner: newWinnerStreak,
      loser: newLoserStreak,
    },
    amountWon,
    ballenBakBonus: ballenBakBonus > 0 ? ballenBakBonus : undefined,
    blackBallBonus,
    cappedAmount,
  };

  // ============================================================================
  // FASE 9: NIEUWE GAME STATE SAMENSTELLEN
  // ============================================================================
  
  const newGameState: GameState = {
    ...gameState,
    jesse: jessePlayer,
    flip: flipPlayer,
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
      winCondition: match.winCondition,
      opponentBallsRemaining: match.opponentBallsRemaining,
      powerUpsUsed: match.powerUpsUsed,
    });
    newState = result.newGameState;
  }

  return newState;
}
