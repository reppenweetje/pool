import { NextResponse } from 'next/server';
import { saveMatch, getOrCreateGameSession } from '@/lib/db/client';
import { calculateMatch } from '@/lib/streakEngine';
import { PlayerName, WinCondition, PowerUpUsage } from '@/types';

export async function POST(request: Request) {
  try {
    // Check if database is configured
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      winner,
      winCondition,
      opponentBallsRemaining,
      powerUpsUsed,
      jesseOwnBalls,
      flipOwnBalls,
      toepStakeMultiplier,
    }: {
      winner: PlayerName;
      winCondition: WinCondition;
      opponentBallsRemaining: number;
      powerUpsUsed: {
        jesse?: PowerUpUsage;
        flip?: PowerUpUsage;
      };
      jesseOwnBalls: number;
      flipOwnBalls: number;
      toepStakeMultiplier?: number;
    } = body;

    // Get current game state
    const gameState = await getOrCreateGameSession();

    // Calculate match result
    const result = calculateMatch({
      gameState,
      winner,
      winCondition,
      opponentBallsRemaining,
      powerUpsUsed,
      jesseOwnBalls,
      flipOwnBalls,
      toepStakeMultiplier: toepStakeMultiplier || 1,
    });

    // Save to database
    await saveMatch(result.newGameState, result.matchResult);

    return NextResponse.json(result.newGameState);
  } catch (error) {
    console.error('Error saving match:', error);
    return NextResponse.json(
      { error: 'Failed to save match' },
      { status: 500 }
    );
  }
}
