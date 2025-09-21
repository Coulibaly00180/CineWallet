import { useState, useEffect } from 'react';
import { View, Alert, ScrollView, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, HelperText, Text, Card, IconButton } from 'react-native-paper';
import { useTickets } from '@/state/useTickets';
import { pickAndStoreFile, getFileType } from '@/utils/file';
import { TicketInput } from '@/utils/validators';
import { AddTicketScreenProps } from '@/types/navigation';
import CinemaSelector from '@/components/CinemaSelector';
import TicketAnalyzerModal from '@/components/TicketAnalyzerModal';
import DatePickerModal from '@/components/DatePickerModal';
import { ExtractedTicketData } from '@/utils/ticketAnalyzer';

export default function AddTicketScreen({ navigation, route }: AddTicketScreenProps) {
  const [code, setCode] = useState('');
  const [qrPayload, setQrPayload] = useState(route.params?.qrPayload ?? '');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [sourceFileUri, setSourceFileUri] = useState('');

  // États pour le date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [cinemaId, setCinemaId] = useState('');
  const [cinemaName, setCinemaName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAnalyzerModal, setShowAnalyzerModal] = useState(false);
  const { add } = useTickets();

  // Fonction pour formater la date en français
  const formatDateFrench = (date: Date): string => {
    return date.toLocaleDateString('fr-FR');
  };

  // Fonction pour convertir une date française en format ISO
  const parseFrenchDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Handler pour le changement de date
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = formatDateFrench(date);
    setExpiresAt(formattedDate);
    if (errors.expiresAt) setErrors(prev => ({ ...prev, expiresAt: '' }));
  };


  // Persist QR payload from navigation params
  useEffect(() => {
    if (route.params?.qrPayload) {
      setQrPayload(route.params.qrPayload);
    }
  }, [route.params?.qrPayload]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = 'Code requis';
    if (code.trim().length < 3) newErrors.code = 'Code trop court (min 3 caractères)';
    if (!qrPayload.trim()) newErrors.qrPayload = 'Payload QR requis';
    if (!cinemaId.trim()) newErrors.cinemaId = 'Cinéma requis';
    if (!expiresAt) newErrors.expiresAt = 'Date d\'expiration requise';
    else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(expiresAt)) {
      newErrors.expiresAt = 'Format de date invalide (JJ/MM/AAAA)';
    } else {
      try {
        const date = parseFrenchDate(expiresAt);
        if (isNaN(date.getTime())) {
          newErrors.expiresAt = 'Date invalide';
        } else if (date < new Date()) {
          newErrors.expiresAt = 'Date d\'expiration passée';
        }
      } catch {
        newErrors.expiresAt = 'Date invalide';
      }
    }
    if (!sourceFileUri) newErrors.sourceFileUri = 'Fichier PDF requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await add({
        code: code.trim(),
        qrPayload: qrPayload.trim(),
        cinemaId: cinemaId.trim(),
        sourceFileUri,
        expiresAt: parseFrenchDate(expiresAt),
        notes: null
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le billet. Vérifiez que le code et le QR ne sont pas déjà utilisés.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestionnaire pour les données extraites par l'IA
   */
  const handleExtractedData = (data: ExtractedTicketData) => {
    // Remplir automatiquement les champs avec les données extraites
    if (data.code) {
      setCode(data.code);
      setErrors(prev => ({ ...prev, code: '' }));
    }

    if (data.qrPayload) {
      setQrPayload(data.qrPayload);
      setErrors(prev => ({ ...prev, qrPayload: '' }));
    }

    if (data.expirationDate) {
      setExpiresAt(data.expirationDate);
      // Mettre à jour le date picker
      try {
        const date = parseFrenchDate(data.expirationDate);
        setSelectedDate(date);
        setErrors(prev => ({ ...prev, expiresAt: '' }));
      } catch (error) {
        console.warn('Date invalide extraite:', data.expirationDate);
      }
    }

    // Si le cinéma est détecté, essayer de le mapper
    if (data.cinemaName) {
      // Pour l'instant, on affiche juste une notification
      Alert.alert(
        'Cinéma détecté',
        `Le cinéma "${data.cinemaName}" a été détecté. Sélectionnez-le manuellement dans la liste.`,
        [{ text: 'OK' }]
      );
    }

    Alert.alert(
      'Analyse terminée',
      `Données extraites avec ${Math.round(data.confidence * 100)}% de confiance. Vérifiez et ajustez si nécessaire.`,
      [{ text: 'OK' }]
    );
  };

  const handlePickFile = async () => {
    try {
      const uri = await pickAndStoreFile();
      if (uri) {
        setSourceFileUri(uri);
        setErrors(prev => ({ ...prev, sourceFileUri: '' }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur d\'import', errorMsg);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <IconButton icon="ticket-confirmation" size={32} iconColor="#1976d2" />
        <Text variant="headlineSmall" style={styles.headerTitle}>Nouveau billet</Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Ajoutez un nouveau billet de cinéma à votre collection
        </Text>
      </View>

      {/* Main Form Card */}
      <Card style={styles.formCard}>
        <Card.Content style={styles.formContent}>
          {/* Code Input */}
          <View style={styles.inputSection}>
            <TextInput
              label="Code du billet"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
              }}
              error={!!errors.code}
              placeholder="Ex: 5CE15A"
              left={<TextInput.Icon icon="barcode" />}
              style={styles.textInput}
            />
            <HelperText type="error" visible={!!errors.code}>{errors.code}</HelperText>
          </View>

          {/* QR Payload Input */}
          <View style={styles.inputSection}>
            <TextInput
              label="Contenu du QR code"
              value={qrPayload}
              onChangeText={(text) => {
                setQrPayload(text);
                if (errors.qrPayload) setErrors(prev => ({ ...prev, qrPayload: '' }));
              }}
              error={!!errors.qrPayload}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="qrcode" />}
              style={styles.textInput}
            />
            <HelperText type="error" visible={!!errors.qrPayload}>{errors.qrPayload}</HelperText>
          </View>

          {/* Cinema Selection */}
          <CinemaSelector
            value={cinemaId}
            onSelect={(id, name) => {
              setCinemaId(id);
              setCinemaName(name);
              if (errors.cinemaId) setErrors(prev => ({ ...prev, cinemaId: '' }));
            }}
            error={errors.cinemaId}
            onAddNew={() => navigation.navigate('AddCinema')}
          />

          {/* Expiration Date Input */}
          <View style={styles.inputSection}>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              icon="calendar"
              contentStyle={[styles.dateButtonContent, { justifyContent: 'flex-start' }]}
              style={[styles.dateButton, errors.expiresAt && styles.dateButtonError]}
              labelStyle={[styles.dateButtonLabel, !expiresAt && styles.placeholderText]}
            >
              {expiresAt || "Sélectionnez une date"}
            </Button>
            <HelperText type="error" visible={!!errors.expiresAt}>{errors.expiresAt}</HelperText>
            <HelperText type="info" visible={!errors.expiresAt}>
              Calendrier visuel avec sélections rapides
            </HelperText>
          </View>

          {/* File Import Section */}
          <View style={styles.inputSection}>
            <Button
              mode="outlined"
              onPress={handlePickFile}
              disabled={loading}
              icon={sourceFileUri ? "check-circle" : "file-upload"}
              style={[styles.fileButton, sourceFileUri && styles.fileButtonSuccess]}
              labelStyle={sourceFileUri && styles.fileButtonSuccessText}
            >
              {sourceFileUri ? `${getFileType(sourceFileUri)} importé` : 'Importer un fichier'}
            </Button>
            <HelperText type="info" visible={!sourceFileUri && !errors.sourceFileUri}>
              Formats supportés : PDF, Images, Texte, DOC/DOCX
            </HelperText>
            <HelperText type="error" visible={!!errors.sourceFileUri}>{errors.sourceFileUri}</HelperText>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          icon="content-save"
          style={styles.saveButton}
          labelStyle={styles.saveButtonText}
        >
          Enregistrer le billet
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Scan')}
          disabled={loading}
          icon="qrcode-scan"
          style={styles.scanButton}
        >
          Scanner un QR code
        </Button>

        <Button
          mode="outlined"
          onPress={() => setShowAnalyzerModal(true)}
          disabled={loading}
          icon="brain"
          style={[styles.scanButton, styles.aiButton]}
          labelStyle={styles.aiButtonText}
        >
          Analyser avec IA
        </Button>
      </View>

      {/* Modal Date Picker */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateSelect={handleDateChange}
        onDismiss={() => setShowDatePicker(false)}
        minimumDate={new Date()}
        title="Date d'expiration du billet"
      />

      {/* Modal d'analyse IA */}
      <TicketAnalyzerModal
        visible={showAnalyzerModal}
        onDismiss={() => setShowAnalyzerModal(false)}
        onDataExtracted={handleExtractedData}
        debug={__DEV__}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 1,
  },
  headerTitle: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  formContent: {
    paddingVertical: 8,
  },
  inputSection: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#fafafa',
  },
  fileButton: {
    paddingVertical: 8,
  },
  fileButtonSuccess: {
    borderColor: '#4caf50',
  },
  fileButtonSuccessText: {
    color: '#4caf50',
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  saveButton: {
    paddingVertical: 4,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    paddingVertical: 4,
  },
  aiButton: {
    borderColor: '#9c27b0',
  },
  aiButtonText: {
    color: '#9c27b0',
  },
  placeholderText: {
    color: '#666',
  },
  dateButton: {
    backgroundColor: '#fafafa',
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  dateButtonError: {
    borderColor: '#f44336',
  },
  dateButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dateButtonLabel: {
    fontSize: 16,
    textAlign: 'left',
  },
});
