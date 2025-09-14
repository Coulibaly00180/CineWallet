import { useState, useEffect } from 'react';
import { View, Alert, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Menu, Divider, Text, Card, IconButton } from 'react-native-paper';
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
  const [cinemaId, setCinemaId] = useState('');
  const [cinemaName, setCinemaName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { add } = useTickets();
  const { items: cinemas, refresh: refreshCinemas } = useCinemas();

  useEffect(() => {
    refreshCinemas();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = 'Code requis';
    if (code.trim().length < 3) newErrors.code = 'Code trop court (min 3 caractères)';
    if (!qrPayload.trim()) newErrors.qrPayload = 'Payload QR requis';
    if (!cinemaId.trim()) newErrors.cinemaId = 'Cinéma requis';
    if (!expiresAt) newErrors.expiresAt = 'Date d\'expiration requise';
    else {
      const date = new Date(expiresAt);
      if (isNaN(date.getTime())) newErrors.expiresAt = 'Date invalide';
      if (date < new Date()) newErrors.expiresAt = 'Date d\'expiration passée';
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
        expiresAt: new Date(expiresAt),
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
                <TextInput
                  label="Cinéma"
                  value={cinemaName}
                  onTouchStart={() => setMenuVisible(true)}
                  editable={false}
                  error={!!errors.cinemaId}
                  placeholder="Sélectionnez un cinéma"
                  left={<TextInput.Icon icon="movie" />}
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setMenuVisible(true)} />}
                  style={styles.textInput}
                />
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
            <TextInput
              label="Date d'expiration"
              value={expiresAt}
              onChangeText={(text) => {
                setExpiresAt(text);
                if (errors.expiresAt) setErrors(prev => ({ ...prev, expiresAt: '' }));
              }}
              error={!!errors.expiresAt}
              placeholder="YYYY-MM-DD"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.textInput}
            />
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
});
