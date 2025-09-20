import { useEffect } from 'react';
import { useTickets } from '@/state/useTickets';
import { useCinemas } from '@/state/useCinemas';
import { notificationManager } from '@/utils/notifications';

/**
 * Hook personnalisé pour synchroniser automatiquement les notifications avec les billets
 *
 * Fonctionnalités :
 * - Surveille les changements dans la liste des billets
 * - Programme automatiquement les notifications pour les nouveaux billets
 * - Nettoie les notifications orphelines (billets supprimés/utilisés)
 * - Assure la cohérence entre les billets et les notifications programmées
 *
 * À utiliser dans les composants qui ont besoin de synchronisation automatique
 */
export function useNotificationScheduler() {
  const { items: tickets } = useTickets();
  const { items: cinemas } = useCinemas();

  useEffect(() => {
    /**
     * Fonction de synchronisation des notifications
     * Compare l'état actuel des billets avec les notifications programmées
     */
    const syncNotifications = async () => {
      try {
        // Récupérer toutes les notifications actuellement programmées
        const scheduledNotifications = await notificationManager.getScheduledNotifications();

        // Créer un Set des IDs de billets qui ont déjà des notifications
        const notificationTicketIds = new Set(
          scheduledNotifications
            .map(notif => notif.content.data?.ticketId)
            .filter(Boolean)
        );

        // Vérifier chaque billet actif (statut PENDING)
        for (const ticket of tickets) {
          if (ticket.status === 'PENDING') {
            const cinema = cinemas.find(c => c.id === ticket.cinemaId);
            const cinemaName = cinema?.name || 'Cinéma inconnu';

            // Si le billet n'a pas de notifications programmées, les créer
            if (!notificationTicketIds.has(ticket.id)) {
              console.log(`Programmation des notifications pour le billet ${ticket.code}`);
              await notificationManager.scheduleTicketExpiration({
                ticketId: ticket.id,
                code: ticket.code,
                cinemaName,
                expiresAt: new Date(ticket.expiresAt),
              });
            }

            // Retirer ce billet de la liste des orphelins
            notificationTicketIds.delete(ticket.id);
          }
        }

        // Les IDs restants correspondent à des billets supprimés ou utilisés
        // Nettoyer leurs notifications devenues inutiles
        for (const orphanedTicketId of notificationTicketIds) {
          console.log(`Annulation des notifications orphelines pour le billet ${orphanedTicketId}`);
          await notificationManager.cancelTicketNotifications(orphanedTicketId);
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation des notifications:', error);
      }
    };

    // Exécuter la synchronisation quand les données sont disponibles
    if (tickets.length >= 0 && cinemas.length > 0) {
      syncNotifications();
    }
  }, [tickets, cinemas]); // Re-synchroniser quand les billets ou cinémas changent
}

/**
 * Hook personnalisé pour nettoyer automatiquement les notifications expirées
 *
 * Fonctionnalités :
 * - Supprime les notifications dont la date de déclenchement est passée
 * - Nettoyage automatique toutes les 6 heures
 * - Nettoyage immédiat au montage du composant
 * - Gestion du nettoyage à la destruction du composant
 *
 * Utilisation recommandée dans l'écran principal de l'application
 */
export function useNotificationCleanup() {
  useEffect(() => {
    /**
     * Fonction de nettoyage des notifications expirées
     * Supprime les notifications qui devaient se déclencher il y a plus de 24h
     */
    const cleanupExpiredNotifications = async () => {
      try {
        const scheduledNotifications = await notificationManager.getScheduledNotifications();
        const now = new Date();
        const expiredThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago

        for (const notification of scheduledNotifications) {
          // Vérifier si la notification a une date de déclenchement
          const trigger = notification.trigger;
          if ('date' in trigger && trigger.date) {
            const triggerDate = new Date(trigger.date);

            // Si la notification devait se déclencher il y a plus de 24h, la supprimer
            if (triggerDate < expiredThreshold) {
              console.log(`Nettoyage notification expirée: ${notification.content.title}`);
              await notificationManager.cancelTicketNotifications(
                notification.content.data?.ticketId
              );
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage des notifications:', error);
      }
    };

    // Planifier un nettoyage automatique toutes les 6 heures
    const interval = setInterval(cleanupExpiredNotifications, 6 * 60 * 60 * 1000);

    // Effectuer un nettoyage immédiat au montage
    cleanupExpiredNotifications();

    // Nettoyer l'intervalle à la destruction du composant
    return () => clearInterval(interval);
  }, []); // Effect exécuté une seule fois au montage
}