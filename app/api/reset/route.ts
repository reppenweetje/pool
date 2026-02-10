import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentMonth } from '@/types';

export async function POST() {
  try {
    const currentMonth = getCurrentMonth();
    
    // Check if database is configured
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured', localOnly: true },
        { status: 200 }
      );
    }

    // Delete all matches for current session
    await sql`
      DELETE FROM matches 
      WHERE session_id IN (SELECT id FROM game_sessions WHERE month = ${currentMonth})
    `;

    // Delete all live games
    await sql`DELETE FROM live_games`;

    // Reset current session
    await sql`
      UPDATE game_sessions
      SET 
        jesse_streak = 0,
        flip_streak = 0,
        jesse_monthly_total = 0,
        flip_monthly_total = 0,
        jesse_power_ups = '{"ballenBakBizarre":1,"cumbackKid":1,"toep":5,"ballenBak":5,"pullThePlug":1,"sniper":3,"speedpot":2,"doubleTrouble":2,"bbc":3}'::jsonb,
        flip_power_ups = '{"ballenBakBizarre":1,"cumbackKid":1,"toep":5,"ballenBak":5,"pullThePlug":1,"sniper":3,"speedpot":2,"doubleTrouble":2,"bbc":3}'::jsonb
      WHERE month = ${currentMonth}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting data:', error);
    return NextResponse.json(
      { error: 'Failed to reset data' },
      { status: 500 }
    );
  }
}
