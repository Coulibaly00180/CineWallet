import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

/**
 * Options pour la sélection d'image
 */
export interface ImagePickerOptions {
  /** Qualité de l'image (0-1) */
  quality?: number;
  /** Permet de recadrer l'image */
  allowsEditing?: boolean;
  /** Format de sortie */
  mediaTypes?: ImagePicker.MediaTypeOptions;
  /** Ratio d'aspect pour le recadrage */
  aspect?: [number, number];
}

/**
 * Résultat de la sélection d'image
 */
export interface ImagePickerResult {
  /** URI locale de l'image */
  uri: string;
  /** Nom du fichier */
  fileName: string;
  /** Taille en octets */
  size: number;
  /** Type MIME */
  mimeType: string;
}

/**
 * Gestionnaire d'images pour les logos de cinémas
 *
 * Fonctionnalités :
 * - Sélection depuis galerie ou appareil photo
 * - Redimensionnement automatique pour les logos
 * - Stockage local optimisé
 * - Validation des formats et tailles
 */
export class ImageManager {
  // Dossier pour stocker les logos des cinémas
  private static readonly LOGOS_DIRECTORY = `${FileSystem.documentDirectory}cinema_logos/`;

  // Taille maximale pour un logo (en octets) - 2MB
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  // Formats supportés
  private static readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Initialise le dossier de stockage des logos
   */
  static async initializeStorage(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.LOGOS_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.LOGOS_DIRECTORY, { intermediates: true });
        console.log('Dossier des logos créé:', this.LOGOS_DIRECTORY);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du stockage:', error);
    }
  }

  /**
   * Demande les permissions nécessaires pour accéder aux images
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Permission pour la galerie
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (galleryStatus !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la galerie photos est nécessaire pour sélectionner un logo.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  /**
   * Ouvre la galerie pour sélectionner une image de logo
   */
  static async pickLogo(options: ImagePickerOptions = {}): Promise<ImagePickerResult | null> {
    try {
      // Vérifier les permissions
      if (!await this.requestPermissions()) {
        return null;
      }

      // Configuration par défaut pour les logos
      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Carré pour les logos
        quality: 0.8,
        ...options,
      };

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];

      // Validation de la taille
      if (asset.fileSize && asset.fileSize > this.MAX_FILE_SIZE) {
        Alert.alert(
          'Fichier trop volumineux',
          `La taille maximum autorisée est de ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB.`
        );
        return null;
      }

      // Validation du format
      if (asset.mimeType && !this.SUPPORTED_FORMATS.includes(asset.mimeType)) {
        Alert.alert(
          'Format non supporté',
          'Formats supportés: JPG, PNG, WebP'
        );
        return null;
      }

      return {
        uri: asset.uri,
        fileName: asset.fileName || `logo_${Date.now()}.jpg`,
        size: asset.fileSize || 0,
        mimeType: asset.mimeType || 'image/jpeg',
      };
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
      return null;
    }
  }

  /**
   * Sauvegarde un logo dans le dossier local et retourne l'URI
   */
  static async saveLogo(imageUri: string, cinemaSlug: string): Promise<string | null> {
    try {
      // Initialiser le stockage
      await this.initializeStorage();

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${cinemaSlug}_${timestamp}.${extension}`;
      const destinationUri = `${this.LOGOS_DIRECTORY}${fileName}`;

      // Copier le fichier
      await FileSystem.copyAsync({
        from: imageUri,
        to: destinationUri,
      });

      console.log('Logo sauvegardé:', destinationUri);
      return destinationUri;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du logo:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le logo.');
      return null;
    }
  }

  /**
   * Supprime un logo du stockage local
   */
  static async deleteLogo(logoUri: string): Promise<boolean> {
    try {
      if (!logoUri.startsWith(this.LOGOS_DIRECTORY)) {
        return true; // Ce n'est pas un logo local
      }

      const fileInfo = await FileSystem.getInfoAsync(logoUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(logoUri);
        console.log('Logo supprimé:', logoUri);
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du logo:', error);
      return false;
    }
  }

  /**
   * Nettoie les logos orphelins (non utilisés par les cinémas)
   */
  static async cleanupOrphanedLogos(usedLogoUris: string[]): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.LOGOS_DIRECTORY);
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(this.LOGOS_DIRECTORY);
      const usedFileNames = new Set(
        usedLogoUris
          .filter(uri => uri.startsWith(this.LOGOS_DIRECTORY))
          .map(uri => uri.split('/').pop())
      );

      for (const fileName of files) {
        if (!usedFileNames.has(fileName)) {
          const filePath = `${this.LOGOS_DIRECTORY}${fileName}`;
          await FileSystem.deleteAsync(filePath);
          console.log('Logo orphelin supprimé:', fileName);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des logos:', error);
    }
  }

  /**
   * Obtient la taille du dossier des logos en octets
   */
  static async getStorageSize(): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.LOGOS_DIRECTORY);
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(this.LOGOS_DIRECTORY);
      let totalSize = 0;

      for (const fileName of files) {
        const filePath = `${this.LOGOS_DIRECTORY}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Erreur lors du calcul de la taille:', error);
      return 0;
    }
  }
}

/**
 * Instance globale du gestionnaire d'images
 */
export const imageManager = ImageManager;