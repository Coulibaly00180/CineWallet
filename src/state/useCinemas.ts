import { create } from 'zustand';
import { db } from '@/db/client';
import { cinemas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@/utils/id';

type Cinema = typeof cinemas.$inferSelect;
type NewCinema = Omit<Cinema, 'createdAt'|'updatedAt'|'id'> & { id?: string; };

type Store = {
  loading: boolean;
  items: Cinema[];
  refresh: () => Promise<void>;
  add: (cinema: NewCinema) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useCinemas = create<Store>((set, get) => ({
  loading: false,
  items: [],
  refresh: async () => {
    set({ loading: true });
    try {
      const res = await db.select().from(cinemas);
      set({ items: res, loading: false });
    } catch (error) {
      console.error('Error refreshing cinemas:', error);
      set({ loading: false });
    }
  },
  add: async (cinema) => {
    try {
      await db.insert(cinemas).values({
        id: cinema.id ?? createId(),
        name: cinema.name,
        slug: cinema.slug,
        website: cinema.website,
        logoUri: cinema.logoUri,
        primaryColor: cinema.primaryColor,
        secondaryColor: cinema.secondaryColor,
        qrFormat: cinema.qrFormat,
        city: cinema.city,
        country: cinema.country,
        phone: cinema.phone,
        notes: cinema.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await get().refresh();
    } catch (error) {
      console.error('Error adding cinema:', error);
      throw error;
    }
  },
  remove: async (id) => {
    try {
      await db.delete(cinemas).where(eq(cinemas.id, id));
      await get().refresh();
    } catch (error) {
      console.error('Error removing cinema:', error);
      throw error;
    }
  }
}));