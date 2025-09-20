import { useState } from 'react';
import { View, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Button,
  Text,
  Card,
  IconButton,
  ProgressBar,
  Chip,
  Divider
} from 'react-native-paper';
import { imageManager, ImagePickerResult } from '@/utils/imageUtils';
import { ticketAnalyzer, ExtractedTicketData, AnalysisOptions } from '@/utils/ticketAnalyzer';

/**
 * Props du composant TicketAnalyzerModal
 */
interface TicketAnalyzerModalProps {
  /** Modal visible */
  visible: boolean;
  /** Fermeture du modal */
  onDismiss: () => void;
  /** Callback avec les données extraites */
  onDataExtracted: (data: ExtractedTicketData) => void;
  /** Mode de débogage */
  debug?: boolean;
}

/**
 * Modal d'analyse de tickets avec IA locale
 *
 * Fonctionnalités :
 * - Sélection d'image depuis la galerie
 * - Analyse en temps réel avec feedback
 * - Prévisualisation des données extraites
 * - Validation et correction manuelle
 * - Interface intuitive Material Design
 */
export default function TicketAnalyzerModal({
  visible,
  onDismiss,
  onDataExtracted,
  debug = false,
}: TicketAnalyzerModalProps) {
  // États pour l'interface
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExtractedTicketData | null>(null);
  const [showResults, setShowResults] = useState(false);

  /**
   * Gestionnaire de sélection d'image
   */
  const handleSelectImage = async () => {
    try {
      const result = await imageManager.pickLogo({
        quality: 0.9,
        allowsEditing: false, // Pas de crop pour les tickets
      });

      if (result) {
        setSelectedImage(result);
        setAnalysisResult(null);
        setShowResults(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  /**
   * Lance l'analyse du ticket
   */
  const handleAnalyzeTicket = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    try {
      const options: AnalysisOptions = {
        language: 'fra',
        enhanceContrast: true,
        preprocessImage: true,
        debug,
      };

      const result = await ticketAnalyzer.analyzeTicket(selectedImage.uri, options);
      setAnalysisResult(result);
      setShowResults(true);

      if (result.confidence < 0.3) {
        Alert.alert(
          'Analyse incomplète',
          'L\'analyse n\'a pas pu extraire suffisamment de données. Vous pouvez ajuster manuellement.'
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'analyser le ticket.');
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Utilise les données extraites
   */
  const handleUseExtractedData = () => {
    if (analysisResult) {
      const validation = ticketAnalyzer.validateExtractedData(analysisResult);

      if (validation.isValid) {
        onDataExtracted(analysisResult);
        handleClose();
      } else {
        Alert.alert(
          'Données incomplètes',
          `Problèmes détectés :\n${validation.validationErrors.join('\n')}\n\nContinuer quand même ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Continuer',
              onPress: () => {
                onDataExtracted(analysisResult);
                handleClose();
              }
            },
          ]
        );
      }
    }
  };

  /**
   * Ferme le modal et remet à zéro
   */
  const handleClose = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setShowResults(false);
    setAnalyzing(false);
    onDismiss();
  };

  /**
   * Rendu de la section de sélection d'image
   */
  const renderImageSelection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <IconButton icon="camera-plus" size={24} />
          <Text variant="titleMedium">Sélectionner un ticket</Text>
        </View>

        <Text variant="bodyMedium" style={styles.description}>
          Choisissez une photo de votre ticket de cinéma depuis votre galerie.
          L'IA va analyser automatiquement les informations.
        </Text>

        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <Text variant="bodySmall" style={styles.imageInfo}>
              {selectedImage.fileName} • {Math.round(selectedImage.size / 1024)}KB
            </Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSelectImage}
          icon="image-plus"
          style={styles.actionButton}
        >
          {selectedImage ? 'Changer d\'image' : 'Sélectionner une image'}
        </Button>

        {selectedImage && (
          <Button
            mode="outlined"
            onPress={handleAnalyzeTicket}
            loading={analyzing}
            disabled={analyzing}
            icon="brain"
            style={styles.actionButton}
          >
            {analyzing ? 'Analyse en cours...' : 'Analyser le ticket'}
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  /**
   * Rendu des résultats d'analyse
   */
  const renderAnalysisResults = () => {
    if (!analysisResult || !showResults) return null;

    const confidence = Math.round(analysisResult.confidence * 100);
    const confidenceColor = confidence > 70 ? '#4caf50' : confidence > 40 ? '#ff9800' : '#f44336';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <IconButton icon="brain" size={24} />
            <Text variant="titleMedium">Résultats d'analyse</Text>
            <Chip
              icon="percent"
              style={[styles.confidenceChip, { backgroundColor: confidenceColor }]}
              textStyle={{ color: 'white' }}
            >
              {confidence}%
            </Chip>
          </View>

          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {/* Données extraites */}
            <View style={styles.dataGrid}>
              {analysisResult.code && (
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.label}>Code :</Text>
                  <Text variant="bodyMedium" style={styles.value}>{analysisResult.code}</Text>
                </View>
              )}

              {analysisResult.cinemaName && (
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.label}>Cinéma :</Text>
                  <Text variant="bodyMedium" style={styles.value}>{analysisResult.cinemaName}</Text>
                </View>
              )}

              {analysisResult.movieTitle && (
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.label}>Film :</Text>
                  <Text variant="bodyMedium" style={styles.value}>{analysisResult.movieTitle}</Text>
                </View>
              )}

              {analysisResult.expirationDate && (
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.label}>Expiration :</Text>
                  <Text variant="bodyMedium" style={styles.value}>{analysisResult.expirationDate}</Text>
                </View>
              )}

              {analysisResult.showTime && (
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.label}>Séance :</Text>
                  <Text variant="bodyMedium" style={styles.value}>{analysisResult.showTime}</Text>
                </View>
              )}

              {analysisResult.price && (
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.label}>Prix :</Text>
                  <Text variant="bodyMedium" style={styles.value}>{analysisResult.price}</Text>
                </View>
              )}

              {analysisResult.qrPayload && (
                <View style={styles.dataRow}>
                  <Text variant="bodySmall" style={styles.label}>QR Code :</Text>
                  <Text variant="bodyMedium" style={styles.value} numberOfLines={2}>
                    {analysisResult.qrPayload}
                  </Text>
                </View>
              )}
            </View>

            {/* Erreurs */}
            {analysisResult.errors.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.errorsTitle}>Avertissements :</Text>
                {analysisResult.errors.map((error, index) => (
                  <Text key={index} variant="bodySmall" style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </>
            )}

            {/* Texte brut (mode debug) */}
            {debug && analysisResult.rawText && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.debugTitle}>Texte brut (debug) :</Text>
                <Text variant="bodySmall" style={styles.rawText}>
                  {analysisResult.rawText}
                </Text>
              </>
            )}
          </ScrollView>

          <Button
            mode="contained"
            onPress={handleUseExtractedData}
            icon="check"
            style={styles.actionButton}
          >
            Utiliser ces données
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Analyse de ticket IA
          </Text>
          <IconButton
            icon="close"
            onPress={handleClose}
            style={styles.closeButton}
          />
        </View>

        {analyzing && (
          <View style={styles.progressContainer}>
            <ProgressBar indeterminate style={styles.progressBar} />
            <Text variant="bodyMedium" style={styles.progressText}>
              Analyse en cours...
            </Text>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderImageSelection()}
          {renderAnalysisResults()}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  closeButton: {
    margin: 0,
  },
  progressContainer: {
    padding: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    marginBottom: 12,
  },
  progressText: {
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  description: {
    marginBottom: 16,
    color: '#666',
    lineHeight: 20,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  imageInfo: {
    color: '#666',
  },
  actionButton: {
    marginVertical: 4,
  },
  confidenceChip: {
    marginLeft: 'auto',
  },
  resultsContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  dataGrid: {
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  label: {
    width: 80,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  errorsTitle: {
    color: '#f44336',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    lineHeight: 18,
  },
  debugTitle: {
    color: '#ff9800',
    fontWeight: '600',
    marginBottom: 8,
  },
  rawText: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    color: '#666',
    lineHeight: 16,
  },
});