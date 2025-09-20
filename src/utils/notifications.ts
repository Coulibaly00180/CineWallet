import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Configuration globale du gestionnaire de notifications
 * Définit le comportement par défaut lorsqu'une notification est reçue
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Afficher l'alerte à l'écran
    shouldPlaySound: true,    // Jouer le son de notification
    shouldSetBadge: false,    // Ne pas modifier le badge de l'app
  }),
});

/**
 * Interface pour les données d'un billet à notifier
 */
export interface TicketNotification {
  /** Identifiant unique du billet */
  ticketId: string;
  /** Code du billet (ex: 5CE15A) */
  code: string;
  /** Nom du cinéma */
  cinemaName: string;
  /** Date d'expiration du billet */
  expiresAt: Date;
}

/**
 * Gestionnaire centralisé des notifications locales pour les billets de cinéma
 *
 * Fonctionnalités :
 * - Initialisation et configuration des permissions
 * - Programmation automatique des notifications d'expiration
 * - Gestion des canaux Android
 * - Nettoyage et synchronisation des notifications
 *
 * Pattern Singleton pour garantir une instance unique
 */
export class NotificationManager {
  private static instance: NotificationManager;
  private isInitialized = false;

  /**
   * Récupère l'instance unique du gestionnaire (Singleton)
   */
  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialise le système de notifications
   *
   * Étapes :
   * 1. Vérifie que l'app tourne sur un appareil physique
   * 2. Demande les permissions de notification
   * 3. Configure le canal Android si nécessaire
   *
   * @returns true si l'initialisation réussit, false sinon
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Les notifications ne fonctionnent que sur des appareils physiques
      if (!Device.isDevice) {
        console.log('Les notifications ne fonctionnent que sur un appareil physique');
        return false;
      }

      // Vérification et demande des permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Si les permissions ne sont pas accordées, les demander
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Échec si les permissions sont refusées
      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        return false;
      }

      // Configuration spécifique Android : créer un canal de notification
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('ticket-expiration', {
          name: 'Expiration des billets',
          description: 'Notifications avant expiration des billets de cinéma',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250], // Pattern de vibration
          lightColor: '#1976d2', // Couleur de la LED
        });
      }

      this.isInitialized = true;
      console.log('Système de notifications initialisé');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
      return false;
    }
  }

  /**
   * Programme les notifications d'expiration pour un billet
   *
   * Crée 3 notifications :
   * - 3 jours avant expiration (normal)
   * - 1 jour avant expiration (high)
   * - 2 heures avant expiration (urgent)
   *
   * @param ticket Données du billet à notifier
   * @returns ID de la dernière notification programmée ou null en cas d'erreur
   */
  async scheduleTicketExpiration(ticket: TicketNotification): Promise<string | null> {
    // S'assurer que le système est initialisé
    if (!this.isInitialized && !await this.initialize()) {
      return null;
    }

    try {
      const now = new Date();
      const expirationDate = new Date(ticket.expiresAt);

      // Calcul des moments de notification (en millisecondes)
      const threeDaysBefore = new Date(expirationDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      const oneDayBefore = new Date(expirationDate.getTime() - 24 * 60 * 60 * 1000);
      const twoHoursBefore = new Date(expirationDate.getTime() - 2 * 60 * 60 * 1000);

      // Configuration des 3 types de notifications
      const notifications = [
        {
          trigger: threeDaysBefore,
          title: '🎬 Billet bientôt expiré',
          body: `Votre billet ${ticket.code} chez ${ticket.cinemaName} expire dans 3 jours`,
          priority: 'normal' as const,
        },
        {
          trigger: oneDayBefore,
          title: '⚠️ Billet expire demain',
          body: `N'oubliez pas ! Votre billet ${ticket.code} chez ${ticket.cinemaName} expire demain`,
          priority: 'high' as const,
        },
        {
          trigger: twoHoursBefore,
          title: '🚨 Billet expire bientôt !',
          body: `URGENT : Votre billet ${ticket.code} chez ${ticket.cinemaName} expire dans 2 heures`,
          priority: 'high' as const,
        },
      ];

      let lastScheduledId: string | null = null;

      // Programmer chaque notification si elle est dans le futur
      for (const notification of notifications) {
        if (notification.trigger > now) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.body,
              // Données personnalisées pour identifier la notification
              data: {
                ticketId: ticket.ticketId,
                type: 'ticket-expiration',
                code: ticket.code,
                cinemaName: ticket.cinemaName,
              },
              // Canal Android spécifique
              ...(Platform.OS === 'android' && {
                channelId: 'ticket-expiration',
              }),
            },
            trigger: {
              date: notification.trigger,
            },
          });

          lastScheduledId = notificationId;
          console.log(`📅 Notification programmée: ${notification.title} le ${notification.trigger.toLocaleString('fr-FR')}`);
        }
      }

      return lastScheduledId;
    } catch (error) {
      console.error('❌ Erreur lors de la programmation de notification:', error);
      return null;
    }
  }

  /**
   * Annule toutes les notifications associées à un billet spécifique
   *
   * Recherche et supprime toutes les notifications programmées
   * pour un billet donné (utile lors de la suppression ou utilisation du billet)
   *
   * @param ticketId Identifiant du billet
   */
  async cancelTicketNotifications(ticketId: string): Promise<void> {
    try {
      // Récupérer toutes les notifications programmées
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Filtrer pour ne garder que celles du billet spécifique
      const ticketNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.ticketId === ticketId
      );

      // Annuler chaque notification trouvée
      for (const notification of ticketNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log(`${ticketNotifications.length} notifications annulées pour le billet ${ticketId}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des notifications:', error);
    }
  }

  /**
   * Annule toutes les notifications programmées de l'application
   *
   * Utile pour le nettoyage global ou la réinitialisation
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation de toutes les notifications:', error);
    }
  }

  /**
   * Récupère la liste de toutes les notifications programmées
   *
   * @returns Liste des notifications en attente
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  /**
   * Met à jour les notifications pour un billet modifié
   *
   * Supprime les anciennes notifications et en programme de nouvelles
   * avec les données mises à jour
   *
   * @param ticket Nouvelles données du billet
   */
  async updateTicketNotifications(ticket: TicketNotification): Promise<void> {
    // Annuler les anciennes notifications
    await this.cancelTicketNotifications(ticket.ticketId);

    // Programmer les nouvelles avec les données mises à jour
    await this.scheduleTicketExpiration(ticket);
  }
}

/**
 * Instance globale singleton du gestionnaire de notifications
 * À utiliser dans toute l'application pour gérer les notifications
 */
export const notificationManager = NotificationManager.getInstance();