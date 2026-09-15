import { useQuery } from '@tanstack/react-query';
import type { ExerciseHistoryResponse } from '@workspace/shared';
import { fetchExerciseHistory } from '../services/api/exerciseApi';
import { exerciseLastNoteQueryKey } from './queryKeys';

/**
 * Sessions scanned (newest first) for a non-empty note. Kept small: the hint is
 * a lazy one-off, and a full history page would drag whole workout payloads in.
 */
const LAST_NOTE_SCAN_SESSIONS = 5;

/** Newest non-empty note left on `exerciseId`, newest session first. */
function readLastExerciseNote(
  response: ExerciseHistoryResponse,
  exerciseId: string
): string | null {
  for (const session of response.sessions) {
    const entries = session.type === 'preset' ? session.exercises : [session];
    for (const entry of entries) {
      const entryExerciseId =
        entry.exercise_id ?? entry.exercise_snapshot?.id ?? null;
      if (entryExerciseId !== exerciseId) continue;
      const note = entry.notes?.trim() ?? '';
      if (note) return note;
    }
  }
  return null;
}

/**
 * Read-only carry-over of the last note written for a library exercise.
 * Fetching is cheap because it is gated behind `enabled` (the card only
 * enables it while the Notes editor is open on an empty exercise note), and
 * the history is scanned until the newest non-empty note is found — the
 * current live session naturally drops out because its note is still empty.
 */
export function useExerciseLastNote(
  exerciseId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: exerciseLastNoteQueryKey(exerciseId ?? ''),
    queryFn: () =>
      fetchExerciseHistory(1, LAST_NOTE_SCAN_SESSIONS, exerciseId ?? undefined),
    enabled: enabled && exerciseId != null,
    staleTime: Infinity,
    select: (data) => readLastExerciseNote(data, exerciseId ?? ''),
  });
}
