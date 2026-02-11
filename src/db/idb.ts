import { openDB } from 'idb';
import type { Session } from './schema';

const dbPromise = openDB('cva-forms-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sessions')) {
      db.createObjectStore('sessions', { keyPath: 'id' });
    }
  }
});

export const listSessions = async (): Promise<Session[]> => (await dbPromise).getAll('sessions');
export const getSession = async (id: string): Promise<Session | undefined> => (await dbPromise).get('sessions', id);
export const saveSession = async (session: Session): Promise<void> => {
  await (await dbPromise).put('sessions', session);
};
export const deleteSession = async (id: string): Promise<void> => {
  await (await dbPromise).delete('sessions', id);
};
