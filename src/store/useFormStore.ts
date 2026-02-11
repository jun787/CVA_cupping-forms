import { create } from 'zustand';
import { deleteSession, listSessions, saveSession } from '../db/idb';
import type { Session } from '../db/schema';

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

type State = {
  sessions: Session[];
  currentSessionId: string | null;
  currentPage: number;
  fieldsPath: string;
  loadSessions: () => Promise<void>;
  createSession: () => Promise<void>;
  selectSession: (id: string) => void;
  updateValue: (fieldId: string, value: string | boolean | number | null) => Promise<void>;
  updateSessionMeta: (patch: Partial<Pick<Session, 'title' | 'sampleName'>>) => Promise<void>;
  duplicateSession: (id: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
};

export const useFormStore = create<State>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  currentPage: 2,
  fieldsPath: '/fields/fields.json',
  loadSessions: async () => {
    const sessions = (await listSessions()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    set((s) => ({ sessions, currentSessionId: s.currentSessionId ?? sessions[0]?.id ?? null }));
  },
  createSession: async () => {
    const session: Session = {
      id: uid(),
      title: `新紀錄 ${new Date().toLocaleString()}`,
      sampleName: '',
      createdAt: now(),
      updatedAt: now(),
      values: {}
    };
    await saveSession(session);
    await get().loadSessions();
    set({ currentSessionId: session.id });
  },
  selectSession: (id) => set({ currentSessionId: id }),
  updateSessionMeta: async (patch) => {
    const state = get();
    const current = state.sessions.find((s) => s.id === state.currentSessionId);
    if (!current) return;
    const next = { ...current, ...patch, updatedAt: now() };
    await saveSession(next);
    await state.loadSessions();
  },
  updateValue: async (fieldId, value) => {
    const state = get();
    const current = state.sessions.find((s) => s.id === state.currentSessionId);
    if (!current) return;
    const next = { ...current, updatedAt: now(), values: { ...current.values, [fieldId]: value } };
    await saveSession(next);
    await state.loadSessions();
  },
  duplicateSession: async (id) => {
    const session = get().sessions.find((s) => s.id === id);
    if (!session) return;
    await saveSession({ ...session, id: uid(), title: `${session.title} (複製)`, createdAt: now(), updatedAt: now() });
    await get().loadSessions();
  },
  removeSession: async (id) => {
    await deleteSession(id);
    await get().loadSessions();
  },
  setCurrentPage: (page) => set({ currentPage: page })
}));
