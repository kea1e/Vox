// Sync hook — stub for next sprint when Supabase is wired.
import { useState } from 'react';

export function useSync() {
  const [lastSyncedAt] = useState<string | null>(null);
  return { lastSyncedAt, syncing: false, sync: async () => {} };
}
