import { NextResponse } from 'next/server';
import { getOrCreateGameSession, saveGameState as dbSaveGameState } from '@/lib/db/client';
import { GameState } from '@/types';

export async function GET() {
  try {
    // Check if database is configured
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured', localOnly: true },
        { status: 200 }
      );
    }

    const gameState = await getOrCreateGameSession();
    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error fetching game state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game state' },
      { status: 500 }
    );
  }
}

// POST voor direct opslaan van game state (bijv. voor Cumback Kid)
export async function POST(request: Request) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 400 }
      );
    }

    const gameState: GameState = await request.json();
    
    // Save to database
    await dbSaveGameState(gameState);
    
    // Return updated state
    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error saving game state:', error);
    return NextResponse.json(
      { error: 'Failed to save game state' },
      { status: 500 }
    );
  }
}
