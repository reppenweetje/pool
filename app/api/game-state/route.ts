import { NextResponse } from 'next/server';
import { getOrCreateGameSession } from '@/lib/db/client';

export async function GET() {
  try {
    // Check if database is configured
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Vercel Postgres.' },
        { status: 503 }
      );
    }

    const gameState = await getOrCreateGameSession();
    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error fetching game state:', error);
    return NextResponse.json(
      { error: 'Database connection failed. Please check your database setup.' },
      { status: 500 }
    );
  }
}
