import { syncAll } from './sync-service';

export async function syncAllData() {
  console.log('[Sync] Starting full sync...');
  
  try {
    const result = await syncAll();
    console.log('[Sync] Full sync completed successfully', result);
    return result;
  } catch (error) {
    console.error('[Sync] Error during sync:', error);
    throw error;
  }
}
