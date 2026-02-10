import { NextResponse } from 'next/server';
import { getOrCreateGameSession } from '@/lib/db/client';

export async function GET() {
  try {
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
