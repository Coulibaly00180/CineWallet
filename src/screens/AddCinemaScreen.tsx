import { useState } from 'react';
import { View, Alert, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text, Card, IconButton } from 'react-native-paper';
import { useCinemas } from '@/state/useCinemas';
import { AddCinemaScreenProps } from '@/types/navigation';

export default function AddCinemaScreen({ navigation }: AddCinemaScreenProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { add } = useCinemas();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Nom requis';
    if (name.trim().length < 2) newErrors.name = 'Nom trop court (min 2 caractères)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      await add({
        name: name.trim(),
        slug,
        city: city.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        logoUri: null,
        primaryColor: null,
        secondaryColor: null,
        qrFormat: null,
        country: null,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le cinéma. Le nom existe peut-être déjà.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <IconButton icon="movie-plus" size={32} iconColor="#1976d2" />
        <Text variant="headlineSmall" style={styles.headerTitle}>Nouveau cinéma</Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Ajoutez un nouveau cinéma à votre collection
        </Text>
      </View>

      {/* Main Form Card */}
      <Card style={styles.formCard}>
        <Card.Content style={styles.formContent}>
          {/* Cinema Name - Required */}
          <View style={styles.inputSection}>
            <TextInput
              label="Nom du cinéma"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              error={!!errors.name}
              placeholder="Ex: Pathé, UGC, Gaumont..."
              left={<TextInput.Icon icon="movie" />}
              style={styles.textInput}
            />
            <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>
            <HelperText type="info" visible={!errors.name}>
              Champ requis - Le nom du cinéma sera utilisé pour identifier vos billets
            </HelperText>
          </View>

          {/* City */}
          <View style={styles.inputSection}>
            <TextInput
              label="Ville"
              value={city}
              onChangeText={setCity}
              placeholder="Paris, Lyon, Marseille..."
              left={<TextInput.Icon icon="map-marker" />}
              style={styles.textInput}
            />
          </View>

          {/* Website */}
          <View style={styles.inputSection}>
            <TextInput
              label="Site web"
              value={website}
              onChangeText={setWebsite}
              placeholder="https://cinema.example.com"
              keyboardType="url"
              autoCapitalize="none"
              left={<TextInput.Icon icon="web" />}
              style={styles.textInput}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputSection}>
            <TextInput
              label="Téléphone"
              value={phone}
              onChangeText={setPhone}
              placeholder="01 23 45 67 89"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.textInput}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputSection}>
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Informations supplémentaires (horaires, parking, etc.)"
              left={<TextInput.Icon icon="note-text" />}
              style={styles.textInput}
            />
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
          Enregistrer le cinéma
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          disabled={loading}
          icon="close"
          style={styles.cancelButton}
        >
          Annuler
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
  cancelButton: {
    paddingVertical: 4,
  },
});