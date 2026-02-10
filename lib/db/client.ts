// ============================================================================
// DATABASE CLIENT - Vercel Postgres
// ============================================================================

import { sql } from '@vercel/postgres';
import { GameState, MatchResult, PowerUpQuota, getCurrentMonth } from '@/types';

// ============================================================================
// GAME SESSION OPERATIONS
// ============================================================================

export async function getOrCreateGameSession(): Promise<GameState> {
  const month = getCurrentMonth();
  
  try {
    // Probeer huidige maand te laden
    const { rows } = await sql`
      SELECT * FROM game_sessions WHERE month = ${month}
    `;

    if (rows.length > 0) {
      const session = rows[0];
      
      // Laad alle matches voor deze maand
      const matchesResult = await sql`
        SELECT * FROM matches 
        WHERE session_id = ${session.id}
        ORDER BY created_at ASC
      `;

      return {
        jesse: {
          name: 'Jesse',
          streak: session.jesse_streak,
          monthlyTotal: parseFloat(session.jesse_monthly_total),
          powerUpQuota: session.jesse_power_ups,
        },
        flip: {
          name: 'Flip',
          streak: session.flip_streak,
          monthlyTotal: parseFloat(session.flip_monthly_total),
          powerUpQuota: session.flip_power_ups,
        },
        currentMonth: session.month,
        matches: matchesResult.rows.map(row => ({
          id: `match-${row.id}`,
          timestamp: new Date(row.created_at),
          month: session.month,
          winner: row.winner,
          loser: row.loser,
          winCondition: row.win_condition,
          opponentBallsRemaining: row.opponent_balls_remaining,
          powerUpsUsed: {
            jesse: Object.keys(row.jesse_power_ups_used).length > 0 ? row.jesse_power_ups_used : undefined,
            flip: Object.keys(row.flip_power_ups_used).length > 0 ? row.flip_power_ups_used : undefined,
          },
          streakBefore: {
            winner: row.winner === 'Jesse' ? row.streak_before_jesse : row.streak_before_flip,
            loser: row.winner === 'Jesse' ? row.streak_before_flip : row.streak_before_jesse,
          },
          streakAfter: {
            winner: row.winner === 'Jesse' ? row.streak_after_jesse : row.streak_after_flip,
            loser: row.winner === 'Jesse' ? row.streak_after_flip : row.streak_after_jesse,
          },
          amountWon: parseFloat(row.amount_won),
          ballenBakBonus: row.ballenbak_bonus > 0 ? parseFloat(row.ballenbak_bonus) : undefined,
          blackBallBonus: row.black_ball_bonus,
          cappedAmount: row.capped_amount,
        })),
        lastMatchId: matchesResult.rows.length > 0 ? `match-${matchesResult.rows[matchesResult.rows.length - 1].id}` : undefined,
      };
    }

    // Maak nieuwe sessie voor deze maand
    const { rows: newSession } = await sql`
      INSERT INTO game_sessions (month)
      VALUES (${month})
      RETURNING *
    `;

    return {
      jesse: {
        name: 'Jesse',
        streak: 0,
        monthlyTotal: 0,
        powerUpQuota: newSession[0].jesse_power_ups,
      },
      flip: {
        name: 'Flip',
        streak: 0,
        monthlyTotal: 0,
        powerUpQuota: newSession[0].flip_power_ups,
      },
      currentMonth: month,
      matches: [],
    };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export async function saveGameState(gameState: GameState): Promise<void> {
  try {
    await sql`
      UPDATE game_sessions
      SET 
        jesse_streak = ${gameState.jesse.streak},
        flip_streak = ${gameState.flip.streak},
        jesse_monthly_total = ${gameState.jesse.monthlyTotal},
        flip_monthly_total = ${gameState.flip.monthlyTotal},
        jesse_power_ups = ${JSON.stringify(gameState.jesse.powerUpQuota)}::jsonb,
        flip_power_ups = ${JSON.stringify(gameState.flip.powerUpQuota)}::jsonb
      WHERE month = ${gameState.currentMonth}
    `;
  } catch (error) {
    console.error('Failed to save game state:', error);
    throw error;
  }
}

export async function saveMatch(gameState: GameState, match: MatchResult): Promise<void> {
  try {
    // Get session id
    const { rows } = await sql`
      SELECT id FROM game_sessions WHERE month = ${gameState.currentMonth}
    `;

    if (rows.length === 0) throw new Error('Session not found');

    const sessionId = rows[0].id;

    // Insert match
    await sql`
      INSERT INTO matches (
        session_id, winner, loser, win_condition, opponent_balls_remaining,
        jesse_power_ups_used, flip_power_ups_used,
        streak_before_jesse, streak_before_flip,
        streak_after_jesse, streak_after_flip,
        amount_won, ballenbak_bonus, black_ball_bonus, capped_amount
      ) VALUES (
        ${sessionId},
        ${match.winner},
        ${match.loser},
        ${match.winCondition},
        ${match.opponentBallsRemaining},
        ${JSON.stringify(match.powerUpsUsed.jesse || {})}::jsonb,
        ${JSON.stringify(match.powerUpsUsed.flip || {})}::jsonb,
        ${match.winner === 'Jesse' ? match.streakBefore.winner : match.streakBefore.loser},
        ${match.winner === 'Flip' ? match.streakBefore.winner : match.streakBefore.loser},
        ${match.winner === 'Jesse' ? match.streakAfter.winner : match.streakAfter.loser},
        ${match.winner === 'Flip' ? match.streakAfter.winner : match.streakAfter.loser},
        ${match.amountWon},
        ${match.ballenBakBonus || 0},
        ${match.blackBallBonus || false},
        ${match.cappedAmount || false}
      )
    `;

    // Update game state
    await saveGameState(gameState);
  } catch (error) {
    console.error('Failed to save match:', error);
    throw error;
  }
}

// ============================================================================
// LIVE GAME OPERATIONS
// ============================================================================

export interface LiveGame {
  id: number;
  sessionId: number;
  status: 'active' | 'finished' | 'cancelled';
  currentToepStake: number;
  toepInitiatedBy: 'Jesse' | 'Flip' | null;
  toepResponse: 'pending' | 'accepted' | 'rejected' | null;
  jesseBallsRemaining: number;
  flipBallsRemaining: number;
  jessePendingPowerUps: any;
  flipPendingPowerUps: any;
  startedAt: Date;
  lastActionAt: Date;
}

export async function createLiveGame(): Promise<LiveGame> {
  const month = getCurrentMonth();
  
  try {
    // Get session id
    const { rows: sessionRows } = await sql`
      SELECT id FROM game_sessions WHERE month = ${month}
    `;

    if (sessionRows.length === 0) {
      throw new Error('No active session found');
    }

    const sessionId = sessionRows[0].id;

    // Cancel any existing active games
    await sql`
      UPDATE live_games 
      SET status = 'cancelled'
      WHERE session_id = ${sessionId} AND status = 'active'
    `;

    // Create new live game - expliciet current_toep_stake op 0 zetten!
    const { rows } = await sql`
      INSERT INTO live_games (session_id, current_toep_stake)
      VALUES (${sessionId}, 0)
      RETURNING *
    `;

    const game = rows[0];
    return {
      id: game.id,
      sessionId: game.session_id,
      status: game.status,
      currentToepStake: game.current_toep_stake,
      toepInitiatedBy: game.toep_initiated_by,
      toepResponse: game.toep_response,
      jesseBallsRemaining: game.jesse_balls_remaining,
      flipBallsRemaining: game.flip_balls_remaining,
      jessePendingPowerUps: game.jesse_pending_power_ups,
      flipPendingPowerUps: game.flip_pending_power_ups,
      startedAt: new Date(game.started_at),
      lastActionAt: new Date(game.last_action_at),
    };
  } catch (error) {
    console.error('Failed to create live game:', error);
    throw error;
  }
}

export async function getActiveLiveGame(): Promise<LiveGame | null> {
  try {
    const { rows } = await sql`
      SELECT * FROM live_games 
      WHERE status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    const game = rows[0];
    return {
      id: game.id,
      sessionId: game.session_id,
      status: game.status,
      currentToepStake: game.current_toep_stake,
      toepInitiatedBy: game.toep_initiated_by,
      toepResponse: game.toep_response,
      jesseBallsRemaining: game.jesse_balls_remaining,
      flipBallsRemaining: game.flip_balls_remaining,
      jessePendingPowerUps: game.jesse_pending_power_ups,
      flipPendingPowerUps: game.flip_pending_power_ups,
      startedAt: new Date(game.started_at),
      lastActionAt: new Date(game.last_action_at),
    };
  } catch (error) {
    console.error('Failed to get active live game:', error);
    return null;
  }
}

export async function initiateToep(liveGameId: number, player: 'Jesse' | 'Flip'): Promise<void> {
  try {
    await sql`
      UPDATE live_games
      SET 
        toep_initiated_by = ${player},
        toep_response = 'pending',
        current_toep_stake = current_toep_stake + 1,
        last_action_at = NOW()
      WHERE id = ${liveGameId}
    `;
  } catch (error) {
    console.error('Failed to initiate toep:', error);
    throw error;
  }
}

export async function respondToToep(liveGameId: number, response: 'accepted' | 'rejected'): Promise<void> {
  try {
    // Bij accepted: reset toep state zodat overtoep mogelijk is
    // Bij rejected: game eindigt dus maakt niet uit
    if (response === 'accepted') {
      await sql`
        UPDATE live_games
        SET 
          toep_response = NULL,
          toep_initiated_by = NULL,
          last_action_at = NOW()
        WHERE id = ${liveGameId}
      `;
    } else {
      await sql`
        UPDATE live_games
        SET 
          toep_response = ${response},
          last_action_at = NOW()
        WHERE id = ${liveGameId}
      `;
    }
  } catch (error) {
    console.error('Failed to respond to toep:', error);
    throw error;
  }
}

export async function updateLiveGame(liveGameId: number, updates: Partial<LiveGame>): Promise<void> {
  try {
    const setClauses: string[] = ['last_action_at = NOW()'];
    const values: any[] = [];

    if (updates.jesseBallsRemaining !== undefined) {
      setClauses.push(`jesse_balls_remaining = $${values.length + 1}`);
      values.push(updates.jesseBallsRemaining);
    }
    if (updates.flipBallsRemaining !== undefined) {
      setClauses.push(`flip_balls_remaining = $${values.length + 1}`);
      values.push(updates.flipBallsRemaining);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${values.length + 1}`);
      values.push(updates.status);
    }

    await sql.query(
      `UPDATE live_games SET ${setClauses.join(', ')} WHERE id = ${liveGameId}`
    );
  } catch (error) {
    console.error('Failed to update live game:', error);
    throw error;
  }
}
