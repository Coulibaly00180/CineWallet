import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { db } from '@/db/client';
import { tickets, cinemas } from '@/db/schema';

/**
 * Structure des données de sauvegarde
 */
export interface BackupData {
  version: string;
  exportDate: string;
  appInfo: {
    name: string;
    version: string;
  };
  data: {
    tickets: any[];
    cinemas: any[];
  };
  metadata: {
    totalTickets: number;
    totalCinemas: number;
    pendingTickets: number;
    usedTickets: number;
  };
}

/**
 * Options d'export
 */
export interface ExportOptions {
  includeUsedTickets?: boolean;
  includeExpiredTickets?: boolean;
  includeCinemas?: boolean;
  includePersonalData?: boolean;
}

/**
 * Gestionnaire de sauvegarde et restauration des données
 *
 * Fonctionnalités :
 * - Export des données en JSON structuré
 * - Import avec validation et gestion des conflits
 * - Sauvegarde sélective (tickets actifs, cinémas, etc.)
 * - Métadonnées et versioning pour la compatibilité
 */
export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0';
  private static readonly APP_NAME = 'CineWallet';
  private static readonly APP_VERSION = '1.6';

  /**
   * Exporte toutes les données de l'application en JSON
   */
  static async exportData(options: ExportOptions = {}): Promise<string | null> {
    try {
      // Options par défaut
      const exportOptions = {
        includeUsedTickets: true,
        includeExpiredTickets: true,
        includeCinemas: true,
        includePersonalData: false,
        ...options,
      };

      // Récupération des données depuis la base
      const allTickets = await db.select().from(tickets);
      const allCinemas = await db.select().from(cinemas);

      // Filtrage des tickets selon les options
      let filteredTickets = allTickets;

      if (!exportOptions.includeUsedTickets) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status !== 'USED');
      }

      if (!exportOptions.includeExpiredTickets) {
        const now = new Date();
        filteredTickets = filteredTickets.filter(ticket => new Date(ticket.expiresAt) > now);
      }

      // Nettoyage des données personnelles si demandé
      if (!exportOptions.includePersonalData) {
        filteredTickets = filteredTickets.map(ticket => ({
          ...ticket,
          notes: null,
          sourceFileUri: null, // Retirer les chemins de fichiers locaux
        }));
      }

      // Construction des métadonnées
      const metadata = {
        totalTickets: filteredTickets.length,
        totalCinemas: exportOptions.includeCinemas ? allCinemas.length : 0,
        pendingTickets: filteredTickets.filter(t => t.status === 'PENDING').length,
        usedTickets: filteredTickets.filter(t => t.status === 'USED').length,
      };

      // Structure finale de sauvegarde
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        exportDate: new Date().toISOString(),
        appInfo: {
          name: this.APP_NAME,
          version: this.APP_VERSION,
        },
        data: {
          tickets: filteredTickets,
          cinemas: exportOptions.includeCinemas ? allCinemas : [],
        },
        metadata,
      };

      // Génération du nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `cinewallet-backup-${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      // Écriture du fichier JSON
      const jsonContent = JSON.stringify(backupData, null, 2);
      await FileSystem.writeAsStringAsync(filePath, jsonContent);

      console.log('Sauvegarde créée:', filePath);
      return filePath;

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      Alert.alert('Erreur', 'Impossible de créer la sauvegarde.');
      return null;
    }
  }

  /**
   * Partage le fichier de sauvegarde via les apps natives
   */
  static async shareBackup(filePath: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil.');
        return false;
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Sauvegarder CineWallet',
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      Alert.alert('Erreur', 'Impossible de partager la sauvegarde.');
      return false;
    }
  }

  /**
   * Importe des données depuis un fichier JSON
   */
  static async importData(replaceExisting: boolean = false): Promise<boolean> {
    try {
      // Sélection du fichier
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return false;
      }

      const fileUri = result.assets[0].uri;

      // Lecture et parsing du fichier
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const backupData: BackupData = JSON.parse(fileContent);

      // Validation de la structure
      if (!this.validateBackupData(backupData)) {
        Alert.alert('Erreur', 'Le fichier de sauvegarde est invalide ou corrompu.');
        return false;
      }

      // Vérification de la compatibilité
      if (!this.isCompatibleVersion(backupData.version)) {
        Alert.alert(
          'Version incompatible',
          `Cette sauvegarde provient d'une version incompatible (${backupData.version}). ` +
          `Version actuelle supportée: ${this.BACKUP_VERSION}.`
        );
        return false;
      }

      // Confirmation de l'utilisateur
      const confirmResult = await this.showImportConfirmation(backupData, replaceExisting);
      if (!confirmResult) {
        return false;
      }

      // Import des données
      await this.performImport(backupData, replaceExisting);

      Alert.alert(
        'Import réussi',
        `${backupData.metadata.totalTickets} billets et ${backupData.metadata.totalCinemas} cinémas importés.`
      );

      return true;

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      Alert.alert('Erreur', 'Impossible d\'importer la sauvegarde. Vérifiez le format du fichier.');
      return false;
    }
  }

  /**
   * Valide la structure des données de sauvegarde
   */
  private static validateBackupData(data: any): data is BackupData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.version === 'string' &&
      typeof data.exportDate === 'string' &&
      data.appInfo &&
      typeof data.appInfo.name === 'string' &&
      data.data &&
      Array.isArray(data.data.tickets) &&
      Array.isArray(data.data.cinemas) &&
      data.metadata &&
      typeof data.metadata.totalTickets === 'number'
    );
  }

  /**
   * Vérifie la compatibilité de version
   */
  private static isCompatibleVersion(version: string): boolean {
    // Pour l'instant, on accepte seulement la version actuelle
    // Dans le futur, on pourra gérer la rétrocompatibilité
    return version === this.BACKUP_VERSION;
  }

  /**
   * Affiche une confirmation détaillée avant l'import
   */
  private static showImportConfirmation(data: BackupData, replaceExisting: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      const message = replaceExisting
        ? `Cette opération va REMPLACER toutes vos données actuelles par celles de la sauvegarde.\n\n` +
          `Sauvegarde du ${new Date(data.exportDate).toLocaleDateString('fr-FR')}:\n` +
          `• ${data.metadata.totalTickets} billets\n` +
          `• ${data.metadata.totalCinemas} cinémas\n\n` +
          `Cette action est IRREVERSIBLE. Continuer ?`
        : `Cette opération va AJOUTER les données de la sauvegarde à vos données actuelles.\n\n` +
          `Sauvegarde du ${new Date(data.exportDate).toLocaleDateString('fr-FR')}:\n` +
          `• ${data.metadata.totalTickets} billets\n` +
          `• ${data.metadata.totalCinemas} cinémas\n\n` +
          `Les doublons seront ignorés. Continuer ?`;

      Alert.alert(
        replaceExisting ? 'Remplacer les données' : 'Importer les données',
        message,
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          {
            text: replaceExisting ? 'Remplacer' : 'Importer',
            style: replaceExisting ? 'destructive' : 'default',
            onPress: () => resolve(true)
          },
        ]
      );
    });
  }

  /**
   * Effectue l'import des données dans la base
   */
  private static async performImport(data: BackupData, replaceExisting: boolean): Promise<void> {
    try {
      // Si remplacement complet, vider les tables
      if (replaceExisting) {
        await db.delete(tickets);
        await db.delete(cinemas);
      }

      // Import des cinémas d'abord (pour les clés étrangères)
      for (const cinema of data.data.cinemas) {
        try {
          await db.insert(cinemas).values({
            id: cinema.id,
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
            createdAt: cinema.createdAt,
            updatedAt: cinema.updatedAt,
          }).onConflictDoNothing(); // Ignorer les doublons
        } catch (error) {
          console.warn('Erreur import cinéma:', cinema.name, error);
        }
      }

      // Import des billets
      for (const ticket of data.data.tickets) {
        try {
          await db.insert(tickets).values({
            id: ticket.id,
            code: ticket.code,
            qrPayload: ticket.qrPayload,
            cinemaId: ticket.cinemaId,
            sourceFileUri: ticket.sourceFileUri,
            expiresAt: ticket.expiresAt,
            status: ticket.status,
            usedAt: ticket.usedAt,
            notes: ticket.notes,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
          }).onConflictDoNothing(); // Ignorer les doublons
        } catch (error) {
          console.warn('Erreur import billet:', ticket.code, error);
        }
      }

      console.log('Import terminé avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'import en base:', error);
      throw error;
    }
  }

  /**
   * Obtient des statistiques sur les données actuelles
   */
  static async getDataStatistics(): Promise<{
    totalTickets: number;
    pendingTickets: number;
    usedTickets: number;
    expiredTickets: number;
    totalCinemas: number;
  }> {
    try {
      const allTickets = await db.select().from(tickets);
      const allCinemas = await db.select().from(cinemas);

      const now = new Date();
      const expiredTickets = allTickets.filter(ticket =>
        new Date(ticket.expiresAt) < now && ticket.status === 'PENDING'
      );

      return {
        totalTickets: allTickets.length,
        pendingTickets: allTickets.filter(t => t.status === 'PENDING').length,
        usedTickets: allTickets.filter(t => t.status === 'USED').length,
        expiredTickets: expiredTickets.length,
        totalCinemas: allCinemas.length,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalTickets: 0,
        pendingTickets: 0,
        usedTickets: 0,
        expiredTickets: 0,
        totalCinemas: 0,
      };
    }
  }
}

/**
 * Instance globale du gestionnaire de sauvegarde
 */
export const backupManager = BackupManager;