import { useState, useEffect } from 'react';
import { View, Alert, ScrollView, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, HelperText, Menu, Divider, Text, Card, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTickets } from '@/state/useTickets';
import { useCinemas } from '@/state/useCinemas';
import { pickAndStoreFile, getFileType } from '@/utils/file';
import { TicketInput } from '@/utils/validators';
import { AddTicketScreenProps } from '@/types/navigation';

export default function AddTicketScreen({ navigation, route }: AddTicketScreenProps) {
  const [code, setCode] = useState('');
  const [qrPayload, setQrPayload] = useState(route.params?.qrPayload ?? '');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [sourceFileUri, setSourceFileUri] = useState('');

  // États pour le date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cinemaId, setCinemaId] = useState('');
  const [cinemaName, setCinemaName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { add } = useTickets();
  const { items: cinemas, refresh: refreshCinemas } = useCinemas();

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
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date && event.type !== 'dismissed') {
      setSelectedDate(date);
      const formattedDate = formatDateFrench(date);
      setExpiresAt(formattedDate);
      if (errors.expiresAt) setErrors(prev => ({ ...prev, expiresAt: '' }));

      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  useEffect(() => {
    if (cinemas.length === 0) {
      refreshCinemas();
    }
  }, [cinemas.length]);

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
          <View style={styles.inputSection}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(!menuVisible)}
                  icon="movie"
                  contentStyle={[styles.cinemaButtonContent, { justifyContent: 'flex-start' }]}
                  style={[styles.cinemaButton, errors.cinemaId && styles.cinemaButtonError]}
                  labelStyle={[styles.cinemaButtonLabel, !cinemaName && styles.placeholderText]}
                >
                  {cinemaName || "Sélectionnez un cinéma"}
                </Button>
              }
            >
              {cinemas.length === 0 ? (
                <Menu.Item
                  onPress={() => {}}
                  title="Aucun cinéma disponible"
                  disabled
                  leadingIcon="alert-circle"
                />
              ) : (
                cinemas.map((cinema) => (
                  <Menu.Item
                    key={cinema.id}
                    onPress={() => {
                      setCinemaId(cinema.id);
                      setCinemaName(cinema.name);
                      setMenuVisible(false);
                      if (errors.cinemaId) setErrors(prev => ({ ...prev, cinemaId: '' }));
                    }}
                    title={cinema.name}
                    leadingIcon="movie"
                    titleStyle={{ fontWeight: cinemaId === cinema.id ? 'bold' : 'normal' }}
                  />
                ))
              )}
              <Divider style={styles.menuDivider} />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('AddCinema');
                }}
                title="Ajouter un nouveau cinéma"
                leadingIcon="plus"
                titleStyle={styles.addCinemaText}
              />
            </Menu>
            <HelperText type="error" visible={!!errors.cinemaId}>{errors.cinemaId}</HelperText>
          </View>

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
      </View>

      {/* Native Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
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
  menuDivider: {
    marginVertical: 8,
  },
  addCinemaText: {
    color: '#1976d2',
    fontWeight: '500',
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
  cinemaButton: {
    backgroundColor: '#fafafa',
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  cinemaButtonError: {
    borderColor: '#f44336',
  },
  cinemaButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cinemaButtonLabel: {
    fontSize: 16,
    textAlign: 'left',
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
