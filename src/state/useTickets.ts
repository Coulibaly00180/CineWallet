import { create } from 'zustand';
import { db } from '@/db/client';
import { tickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@/utils/id';

type Ticket = typeof tickets.$inferSelect;
type NewTicket = Omit<Ticket, 'createdAt'|'updatedAt'|'id'|'status'|'usedAt'> & { id?: string; status?: 'PENDING'|'USED'; usedAt?: Date|null; };

type Store = {
  loading: boolean;
  items: Ticket[];
  refresh: () => Promise<void>;
  add: (t: NewTicket) => Promise<void>;
  markUsed: (id: string) => Promise<void>;
};

export const useTickets = create<Store>((set, get) => ({
  loading: false,
  items: [],
  refresh: async () => {
    set({ loading: true });
    const res = await db.select().from(tickets);
    set({ items: res, loading: false });
  },
  add: async (t) => {
    await db.insert(tickets).values({
      id: t.id ?? createId(),
      code: t.code,
      qrPayload: t.qrPayload,
      cinemaId: t.cinemaId,
      sourceFileUri: t.sourceFileUri,
      expiresAt: t.expiresAt,
      status: t.status ?? 'PENDING',
      usedAt: t.usedAt ?? null,
      notes: t.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await get().refresh();
  },
  markUsed: async (id) => {
    await db.update(tickets)
      .set({ status: 'USED', usedAt: new Date(), updatedAt: new Date() })
      .where(eq(tickets.id, id));
    await get().refresh();
  }
}));
