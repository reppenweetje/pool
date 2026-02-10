// ============================================================================
// LOCAL STORAGE HELPER - Persistente opslag van game state
// ============================================================================

import { GameState } from '@/types';
import { initializeGameState } from './streakEngine';

const STORAGE_KEY = 'pool-competition-state';

/**
 * Laadt de game state uit local storage
 */
export function loadGameState(): GameState {
  if (typeof window === 'undefined') {
    return initializeGameState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initializeGameState();
    }

    const parsed = JSON.parse(stored);
    
    // Converteer date strings terug naar Date objects
    if (parsed.matches) {
      parsed.matches = parsed.matches.map((match: any) => ({
        ...match,
        timestamp: new Date(match.timestamp),
      }));
    }

    return parsed as GameState;
  } catch (error) {
    console.error('Fout bij laden game state:', error);
    return initializeGameState();
  }
}

/**
 * Slaat de game state op in local storage
 */
export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fout bij opslaan game state:', error);
  }
}

/**
 * Wist alle data (voor reset)
 */
export function clearGameState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export game state als JSON (voor backup)
 */
export function exportGameState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Import game state van JSON
 */
export function importGameState(json: string): GameState {
  const parsed = JSON.parse(json);
  
  // Converteer date strings terug naar Date objects
  if (parsed.matches) {
    parsed.matches = parsed.matches.map((match: any) => ({
      ...match,
      timestamp: new Date(match.timestamp),
    }));
  }

  return parsed as GameState;
}
