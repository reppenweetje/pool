// ============================================================================
// SUPABASE CLIENT - Database & Real-time connection
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface DbGameState {
  id: string;
  created_at: string;
  updated_at: string;
  jesse_streak: number;
  flip_streak: number;
  jesse_monthly_total: number;
  flip_monthly_total: number;
  jesse_power_ups: Record<string, number>;
  flip_power_ups: Record<string, number>;
  current_month: string;
}

export interface DbMatch {
  id: string;
  game_state_id: string;
  created_at: string;
  winner: 'Jesse' | 'Flip';
  loser: 'Jesse' | 'Flip';
  win_condition: 'normal' | 'blackBall';
  opponent_balls_remaining: number;
  power_ups_used: Record<string, any>;
  streak_before: Record<string, number>;
  streak_after: Record<string, number>;
  amount_won: number;
  ballenbak_bonus?: number;
  black_ball_bonus?: boolean;
  capped_amount?: boolean;
}

export interface DbLiveGame {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'waiting' | 'active' | 'finished';
  current_player: 'Jesse' | 'Flip' | null;
  jesse_joined: boolean;
  flip_joined: boolean;
  
  // Toep mechanisme
  toep_active: boolean;
  toep_by: 'Jesse' | 'Flip' | null;
  toep_level: number; // 1 = normal, 2 = toep, 3 = overtoep, etc.
  toep_response?: 'accepted' | 'rejected' | null;
  
  // Game state
  jesse_balls_remaining: number;
  flip_balls_remaining: number;
  
  // Power-ups tijdens game
  active_power_ups: Record<string, any>;
  
  // Metadata
  game_state_id: string;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Haal of creëer de huidige game state
 */
export async function getOrCreateGameState(): Promise<DbGameState | null> {
  try {
    // Probeer de meest recente game state op te halen
    const { data: existing, error: fetchError } = await supabase
      .from('game_states')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing && !fetchError) {
      return existing;
    }

    // Als er geen bestaat, maak een nieuwe aan
    const { data: newState, error: createError } = await supabase
      .from('game_states')
      .insert([
        {
          jesse_streak: 0,
          flip_streak: 0,
          jesse_monthly_total: 0,
          flip_monthly_total: 0,
          jesse_power_ups: {
            ballenBakBizarre: 1,
            cumbackKid: 1,
            toep: 5,
            ballenBak: 5,
            pullThePlug: 1,
            sniper: 3,
            speedpot: 2,
            doubleTrouble: 2,
          },
          flip_power_ups: {
            ballenBakBizarre: 1,
            cumbackKid: 1,
            toep: 5,
            ballenBak: 5,
            pullThePlug: 1,
            sniper: 3,
            speedpot: 2,
            doubleTrouble: 2,
          },
          current_month: new Date().toISOString().slice(0, 7),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating game state:', createError);
      return null;
    }

    return newState;
  } catch (error) {
    console.error('Error in getOrCreateGameState:', error);
    return null;
  }
}

/**
 * Update game state
 */
export async function updateGameState(
  id: string,
  updates: Partial<DbGameState>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_states')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating game state:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateGameState:', error);
    return false;
  }
}

/**
 * Sla een match op in de database
 */
export async function saveMatch(match: DbMatch): Promise<boolean> {
  try {
    const { error } = await supabase.from('matches').insert([match]);

    if (error) {
      console.error('Error saving match:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveMatch:', error);
    return false;
  }
}

/**
 * Haal alle matches op voor een game state
 */
export async function getMatches(gameStateId: string): Promise<DbMatch[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('game_state_id', gameStateId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching matches:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMatches:', error);
    return [];
  }
}

/**
 * Creëer een nieuwe live game
 */
export async function createLiveGame(
  gameStateId: string
): Promise<DbLiveGame | null> {
  try {
    const { data, error } = await supabase
      .from('live_games')
      .insert([
        {
          status: 'waiting',
          current_player: null,
          jesse_joined: false,
          flip_joined: false,
          toep_active: false,
          toep_by: null,
          toep_level: 1,
          toep_response: null,
          jesse_balls_remaining: 7,
          flip_balls_remaining: 7,
          active_power_ups: {},
          game_state_id: gameStateId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating live game:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createLiveGame:', error);
    return null;
  }
}

/**
 * Update live game
 */
export async function updateLiveGame(
  id: string,
  updates: Partial<DbLiveGame>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('live_games')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating live game:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateLiveGame:', error);
    return false;
  }
}

/**
 * Subscribe to live game updates
 */
export function subscribeLiveGame(
  liveGameId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`live_game:${liveGameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_games',
        filter: `id=eq.${liveGameId}`,
      },
      callback
    )
    .subscribe();
}
