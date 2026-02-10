import { NextResponse } from 'next/server';
import {
  createLiveGame,
  getActiveLiveGame,
  initiateToep,
  respondToToep,
  updateLiveGame,
} from '@/lib/db/client';

// GET - Haal actieve live game op
export async function GET() {
  try {
    const liveGame = await getActiveLiveGame();
    return NextResponse.json(liveGame);
  } catch (error) {
    console.error('Error fetching live game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live game' },
      { status: 500 }
    );
  }
}

// POST - Start nieuwe live game
export async function POST() {
  try {
    const liveGame = await createLiveGame();
    return NextResponse.json(liveGame);
  } catch (error) {
    console.error('Error creating live game:', error);
    return NextResponse.json(
      { error: 'Failed to create live game' },
      { status: 500 }
    );
  }
}

// PUT - Update live game (toep, balls, etc.)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, liveGameId, ...data } = body;

    switch (action) {
      case 'toep':
        await initiateToep(liveGameId, data.player);
        break;
      case 'respond_toep':
        await respondToToep(liveGameId, data.response);
        break;
      case 'update':
        await updateLiveGame(liveGameId, data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedGame = await getActiveLiveGame();
    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error('Error updating live game:', error);
    return NextResponse.json(
      { error: 'Failed to update live game' },
      { status: 500 }
    );
  }
}
