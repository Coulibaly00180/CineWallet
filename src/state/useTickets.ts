import { create } from 'zustand';
import { db } from '@/db/client';
import { tickets, cinemas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@/utils/id';
import { notificationManager } from '@/utils/notifications';

/**
 * Type pour un billet complet tel que stocké en base
 */
type Ticket = typeof tickets.$inferSelect;

/**
 * Type pour un nouveau billet à créer
 * Exclut les champs auto-générés et permet de surcharger certains champs
 */
type NewTicket = Omit<Ticket, 'createdAt'|'updatedAt'|'id'|'status'|'usedAt'> & {
  id?: string;
  status?: 'PENDING'|'USED';
  usedAt?: Date|null;
};

/**
 * Interface du store Zustand pour la gestion des billets
 */
type Store = {
  /** Indicateur de chargement pour les opérations asynchrones */
  loading: boolean;
  /** Liste des billets en mémoire */
  items: Ticket[];
  /** Recharge la liste des billets depuis la base de données */
  refresh: () => Promise<void>;
  /** Ajoute un nouveau billet et programme ses notifications */
  add: (t: NewTicket) => Promise<void>;
  /** Marque un billet comme utilisé et annule ses notifications */
  markUsed: (id: string) => Promise<void>;
  /** Supprime un billet et annule ses notifications */
  remove: (id: string) => Promise<void>;
};

/**
 * Store Zustand pour la gestion des billets de cinéma
 *
 * Fonctionnalités intégrées :
 * - CRUD complet sur les billets
 * - Gestion automatique des notifications d'expiration
 * - Synchronisation avec la base de données SQLite
 * - Gestion des états de chargement
 */
export const useTickets = create<Store>((set, get) => ({
  loading: false,
  items: [],

  /**
   * Recharge tous les billets depuis la base de données
   * Met à jour l'état de chargement pendant l'opération
   */
  refresh: async () => {
    set({ loading: true });
    const res = await db.select().from(tickets);
    set({ items: res, loading: false });
  },
  /**
   * Ajoute un nouveau billet à la base de données
   *
   * Étapes :
   * 1. Génère un ID unique si non fourni
   * 2. Insère le billet en base avec les métadonnées
   * 3. Programme automatiquement les notifications d'expiration
   * 4. Rafraîchit la liste en mémoire
   *
   * @param t Données du nouveau billet
   */
  add: async (t) => {
    const ticketId = t.id ?? createId();

    // Insertion en base de données
    await db.insert(tickets).values({
      id: ticketId,
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

    // Programmation automatique des notifications d'expiration
    try {
      const cinema = await db.select().from(cinemas).where(eq(cinemas.id, t.cinemaId)).limit(1);
      const cinemaName = cinema[0]?.name || 'Cinéma inconnu';

      await notificationManager.scheduleTicketExpiration({
        ticketId,
        code: t.code,
        cinemaName,
        expiresAt: t.expiresAt,
      });
    } catch (error) {
      console.warn('Impossible de programmer les notifications:', error);
    }

    // Rafraîchir la liste en mémoire
    await get().refresh();
  },
  /**
   * Marque un billet comme utilisé
   *
   * Actions :
   * 1. Met à jour le statut et la date d'utilisation en base
   * 2. Annule toutes les notifications liées au billet
   * 3. Rafraîchit la liste en mémoire
   *
   * @param id Identifiant du billet à marquer comme utilisé
   */
  markUsed: async (id) => {
    // Mise à jour du statut en base de données
    await db.update(tickets)
      .set({ status: 'USED', usedAt: new Date(), updatedAt: new Date() })
      .where(eq(tickets.id, id));

    // Annulation des notifications devenues inutiles
    try {
      await notificationManager.cancelTicketNotifications(id);
    } catch (error) {
      console.warn('Impossible d\'annuler les notifications:', error);
    }

    // Rafraîchir la liste en mémoire
    await get().refresh();
  },

  /**
   * Supprime définitivement un billet
   *
   * Actions :
   * 1. Annule toutes les notifications liées au billet
   * 2. Supprime le billet de la base de données
   * 3. Rafraîchit la liste en mémoire
   *
   * @param id Identifiant du billet à supprimer
   */
  remove: async (id) => {
    // Annulation des notifications avant suppression
    try {
      await notificationManager.cancelTicketNotifications(id);
    } catch (error) {
      console.warn('Impossible d\'annuler les notifications:', error);
    }

    // Suppression de la base de données
    await db.delete(tickets).where(eq(tickets.id, id));

    // Rafraîchir la liste en mémoire
    await get().refresh();
  }
}));
