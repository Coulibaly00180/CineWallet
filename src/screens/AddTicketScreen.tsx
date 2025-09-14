import { useState } from 'react';
import { View, Alert } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useTickets } from '@/state/useTickets';
import { pickAndStorePdf } from '@/utils/file';
import { TicketInput } from '@/utils/validators';
import { AddTicketScreenProps } from '@/types/navigation';

export default function AddTicketScreen({ navigation, route }: AddTicketScreenProps) {
  const [code, setCode] = useState('');
  const [qrPayload, setQrPayload] = useState(route.params?.qrPayload ?? '');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [sourceFileUri, setSourceFileUri] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { add } = useTickets();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = 'Code requis';
    if (code.trim().length < 3) newErrors.code = 'Code trop court (min 3 caractères)';
    if (!qrPayload.trim()) newErrors.qrPayload = 'Payload QR requis';
    if (!cinemaId.trim()) newErrors.cinemaId = 'ID cinéma requis';
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

  const handlePickPdf = async () => {
    try {
      const uri = await pickAndStorePdf();
      if (uri) {
        setSourceFileUri(uri);
        setErrors(prev => ({ ...prev, sourceFileUri: '' }));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'importer le fichier PDF');
    }
  };

  return (
    <View style={{ padding:16, gap:12 }}>
      <TextInput
        label="Code (ex: 5CE15A)"
        value={code}
        onChangeText={(text) => {
          setCode(text);
          if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
        }}
        error={!!errors.code}
      />
      <HelperText type="error" visible={!!errors.code}>{errors.code}</HelperText>

      <TextInput
        label="QR payload"
        value={qrPayload}
        onChangeText={(text) => {
          setQrPayload(text);
          if (errors.qrPayload) setErrors(prev => ({ ...prev, qrPayload: '' }));
        }}
        error={!!errors.qrPayload}
        multiline
      />
      <HelperText type="error" visible={!!errors.qrPayload}>{errors.qrPayload}</HelperText>

      <TextInput
        label="ID Cinéma"
        value={cinemaId}
        onChangeText={(text) => {
          setCinemaId(text);
          if (errors.cinemaId) setErrors(prev => ({ ...prev, cinemaId: '' }));
        }}
        error={!!errors.cinemaId}
        placeholder="uuid-du-cinema"
      />
      <HelperText type="error" visible={!!errors.cinemaId}>{errors.cinemaId}</HelperText>

      <TextInput
        label="Expiration (YYYY-MM-DD)"
        value={expiresAt}
        onChangeText={(text) => {
          setExpiresAt(text);
          if (errors.expiresAt) setErrors(prev => ({ ...prev, expiresAt: '' }));
        }}
        error={!!errors.expiresAt}
        placeholder="2024-12-31"
      />
      <HelperText type="error" visible={!!errors.expiresAt}>{errors.expiresAt}</HelperText>

      <Button onPress={handlePickPdf} disabled={loading}>
        {sourceFileUri ? '✓ PDF importé' : 'Importer le PDF'}
      </Button>
      <HelperText type="error" visible={!!errors.sourceFileUri}>{errors.sourceFileUri}</HelperText>

      <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}>
        Enregistrer
      </Button>

      <Button onPress={() => navigation.navigate('Scan')} disabled={loading}>
        Scanner un QR
      </Button>
    </View>
  );
}
