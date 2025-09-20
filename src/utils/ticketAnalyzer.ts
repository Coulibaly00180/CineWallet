import * as FileSystem from 'expo-file-system/legacy';
import { ImagePickerResult } from './imageUtils';

/**
 * Structure des données extraites d'un ticket
 */
export interface ExtractedTicketData {
  /** Code du billet extrait */
  code?: string;
  /** Contenu QR détecté */
  qrPayload?: string;
  /** Date d'expiration trouvée */
  expirationDate?: string;
  /** Nom du cinéma détecté */
  cinemaName?: string;
  /** Titre du film */
  movieTitle?: string;
  /** Salle et siège */
  seatInfo?: string;
  /** Heure de la séance */
  showTime?: string;
  /** Prix du ticket */
  price?: string;
  /** Niveau de confiance (0-1) */
  confidence: number;
  /** Texte brut extrait */
  rawText: string;
  /** Erreurs rencontrées */
  errors: string[];
}

/**
 * Options d'analyse d'image
 */
export interface AnalysisOptions {
  /** Langue préférée pour l'OCR */
  language?: 'fra' | 'eng';
  /** Améliorer le contraste */
  enhanceContrast?: boolean;
  /** Pré-traitement d'image */
  preprocessImage?: boolean;
  /** Mode de débogage */
  debug?: boolean;
}

/**
 * Patterns regex pour l'extraction de données
 */
const EXTRACTION_PATTERNS = {
  // Codes de billet typiques
  ticketCode: [
    /\b[A-Z0-9]{4,8}\b/g,
    /CODE[:\s]*([A-Z0-9]{4,8})/i,
    /BILLET[:\s]*([A-Z0-9]{4,8})/i,
    /TICKET[:\s]*([A-Z0-9]{4,8})/i,
  ],

  // Dates d'expiration
  expirationDate: [
    /(?:VALIDE|EXPIRE?|VALIDITÉ?).*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
    /(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
  ],

  // Noms de cinémas connus
  cinemaNames: [
    /\b(UGC|PATHÉ|GAUMONT|CGR|KINEPOLIS|MK2|MÉGARAMA)\b/i,
    /CINÉMA\s+([A-ZÀ-Ÿ\s]+)/i,
    /CINEMA\s+([A-ZÀ-Ÿ\s]+)/i,
  ],

  // Prix
  price: [
    /(\d+[,\.]\d{2})\s*€/g,
    /€\s*(\d+[,\.]\d{2})/g,
    /PRIX[:\s]*(\d+[,\.]\d{2})/i,
  ],

  // Informations de séance
  showTime: [
    /(\d{1,2}[h:]\d{2})/g,
    /SÉANCE[:\s]*(\d{1,2}[h:]\d{2})/i,
    /HEURE[:\s]*(\d{1,2}[h:]\d{2})/i,
  ],

  // QR Code content patterns
  qrCode: [
    /(?:QR|CODE)[:\s]*([A-Z0-9]+)/i,
    /https?:\/\/[^\s]+/g,
  ],
};

/**
 * Gestionnaire d'analyse de tickets hors-ligne
 *
 * Fonctionnalités :
 * - OCR basique via extraction de texte
 * - Parsing intelligent avec patterns regex
 * - Validation des données extraites
 * - Support des formats JPEG, PNG et PDF
 */
export class TicketAnalyzer {
  private static readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'pdf'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Analyse une image de ticket et extrait les données structurées
   */
  static async analyzeTicket(
    imageUri: string,
    options: AnalysisOptions = {}
  ): Promise<ExtractedTicketData> {
    const result: ExtractedTicketData = {
      confidence: 0,
      rawText: '',
      errors: [],
    };

    try {
      // Validation du fichier
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        result.errors.push('Fichier non trouvé');
        return result;
      }

      if (fileInfo.size && fileInfo.size > this.MAX_FILE_SIZE) {
        result.errors.push('Fichier trop volumineux (max 10MB)');
        return result;
      }

      // Extraction du format
      const extension = imageUri.split('.').pop()?.toLowerCase();
      if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
        result.errors.push('Format non supporté. Utilisez JPG, PNG ou PDF');
        return result;
      }

      // Pour cette implémentation initiale, on simule l'OCR
      // avec des patterns basiques sur le nom de fichier et contenu simulé
      result.rawText = await this.simulateOCR(imageUri, options);

      // Extraction des données avec patterns
      const extractedData = this.extractDataFromText(result.rawText);
      Object.assign(result, extractedData);

      // Calcul de la confiance
      result.confidence = this.calculateConfidence(result);

      if (options.debug) {
        console.log('Analyse de ticket:', {
          uri: imageUri,
          extractedData: result,
          confidence: result.confidence,
        });
      }

    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    }

    return result;
  }

  /**
   * Simulation d'OCR basique
   * En production, ceci serait remplacé par un vrai moteur OCR mobile
   */
  private static async simulateOCR(
    imageUri: string,
    options: AnalysisOptions
  ): Promise<string> {
    // Simulation d'un contenu OCR basé sur le nom de fichier
    const fileName = imageUri.split('/').pop()?.toLowerCase() || '';

    // Templates de tickets simulés pour différents cinémas
    if (fileName.includes('ugc')) {
      return `
        UGC CINÉ CITÉ
        BILLET D'ENTRÉE
        CODE: 5CE15A
        FILM: AVATAR 3
        SALLE: 7 - SIÈGE: G12
        SÉANCE: 20:30
        PRIX: 12,50€
        VALIDITÉ: 31/12/2024
        QR: UGC_5CE15A_20241231
      `;
    }

    if (fileName.includes('pathe')) {
      return `
        PATHÉ CINEMAS
        TICKET DE CINÉMA
        CODEWEB: P8K9L2
        TITRE: DUNE PART TWO
        HORAIRE: 19:45
        PLACE: RANG M SIÈGE 15
        MONTANT: 11,80€
        EXPIRE LE: 28/02/2024
      `;
    }

    // Template par défaut
    return `
      CINÉMA EXAMPLE
      BILLET NUMÉRIQUE
      REF: ABC123
      FILM: EXEMPLE MOVIE
      HEURE: 21:00
      PRIX: 10,00€
      VALIDE JUSQU'AU: 15/03/2024
    `;
  }

  /**
   * Extrait les données structurées du texte OCR
   */
  private static extractDataFromText(text: string): Partial<ExtractedTicketData> {
    const extracted: Partial<ExtractedTicketData> = {};

    // Extraction du code de billet
    for (const pattern of EXTRACTION_PATTERNS.ticketCode) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Prendre le code le plus probable (plus court et alphanumérique)
        extracted.code = matches
          .filter(code => code.length >= 4 && code.length <= 8)
          .sort((a, b) => a.length - b.length)[0];
        break;
      }
    }

    // Extraction de la date d'expiration
    for (const pattern of EXTRACTION_PATTERNS.expirationDate) {
      const match = text.match(pattern);
      if (match) {
        extracted.expirationDate = match[1] || match[0];
        break;
      }
    }

    // Extraction du nom du cinéma
    for (const pattern of EXTRACTION_PATTERNS.cinemaNames) {
      const match = text.match(pattern);
      if (match) {
        extracted.cinemaName = match[1] || match[0];
        break;
      }
    }

    // Extraction du prix
    for (const pattern of EXTRACTION_PATTERNS.price) {
      const match = text.match(pattern);
      if (match) {
        extracted.price = match[1] || match[0];
        break;
      }
    }

    // Extraction de l'heure de séance
    for (const pattern of EXTRACTION_PATTERNS.showTime) {
      const match = text.match(pattern);
      if (match) {
        extracted.showTime = match[1] || match[0];
        break;
      }
    }

    // Extraction QR code
    for (const pattern of EXTRACTION_PATTERNS.qrCode) {
      const match = text.match(pattern);
      if (match) {
        extracted.qrPayload = match[1] || match[0];
        break;
      }
    }

    return extracted;
  }

  /**
   * Calcule un score de confiance basé sur les données extraites
   */
  private static calculateConfidence(data: ExtractedTicketData): number {
    let score = 0;
    const weights = {
      code: 0.3,
      expirationDate: 0.25,
      cinemaName: 0.2,
      showTime: 0.15,
      price: 0.1,
    };

    if (data.code) score += weights.code;
    if (data.expirationDate) score += weights.expirationDate;
    if (data.cinemaName) score += weights.cinemaName;
    if (data.showTime) score += weights.showTime;
    if (data.price) score += weights.price;

    // Bonus si le QR code est trouvé
    if (data.qrPayload) score += 0.1;

    // Pénalité si des erreurs sont présentes
    if (data.errors.length > 0) score *= 0.8;

    return Math.min(1.0, score);
  }

  /**
   * Valide et formate les données extraites
   */
  static validateExtractedData(data: ExtractedTicketData): {
    isValid: boolean;
    formattedData: Partial<ExtractedTicketData>;
    validationErrors: string[];
  } {
    const errors: string[] = [];
    const formatted: Partial<ExtractedTicketData> = { ...data };

    // Validation du code de billet
    if (data.code) {
      if (data.code.length < 3) {
        errors.push('Code de billet trop court');
        delete formatted.code;
      }
    }

    // Validation et formatage de la date
    if (data.expirationDate) {
      const dateFormats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/,
        /(\d{1,2})-(\d{1,2})-(\d{4})/,
      ];

      let validDate = false;
      for (const format of dateFormats) {
        const match = data.expirationDate.match(format);
        if (match) {
          const [, day, month, year] = match;
          const fullYear = year.length === 2 ? `20${year}` : year;
          formatted.expirationDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${fullYear}`;
          validDate = true;
          break;
        }
      }

      if (!validDate) {
        errors.push('Format de date non reconnu');
        delete formatted.expirationDate;
      }
    }

    // Validation du prix
    if (data.price) {
      const cleanPrice = data.price.replace(',', '.');
      if (!/^\d+\.?\d{0,2}$/.test(cleanPrice)) {
        errors.push('Format de prix invalide');
        delete formatted.price;
      } else {
        formatted.price = `${parseFloat(cleanPrice).toFixed(2)}€`;
      }
    }

    return {
      isValid: errors.length === 0 && data.confidence > 0.3,
      formattedData: formatted,
      validationErrors: errors,
    };
  }

  /**
   * Analyse un fichier PDF (simulation)
   */
  static async analyzePDF(pdfUri: string, options: AnalysisOptions = {}): Promise<ExtractedTicketData> {
    // Pour PDF, on simule l'extraction de texte
    // En production, utiliser une lib comme react-native-pdf-lib
    const result: ExtractedTicketData = {
      confidence: 0.5,
      rawText: 'PDF TEXT EXTRACTION SIMULATION',
      errors: ['Analyse PDF en cours de développement'],
    };

    return result;
  }
}

/**
 * Instance globale du gestionnaire d'analyse
 */
export const ticketAnalyzer = TicketAnalyzer;