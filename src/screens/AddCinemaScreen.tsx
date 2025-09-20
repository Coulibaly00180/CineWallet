import { useState } from 'react';
import { View, Alert, ScrollView, StyleSheet, Image } from 'react-native';
import { TextInput, Button, HelperText, Text, Card, IconButton, Avatar } from 'react-native-paper';
import { useCinemas } from '@/state/useCinemas';
import { AddCinemaScreenProps } from '@/types/navigation';
import { imageManager } from '@/utils/imageUtils';

/**
 * Écran pour ajouter un nouveau cinéma à la base de données
 *
 * Fonctionnalités :
 * - Formulaire complet avec validation en temps réel
 * - Support des couleurs avec prévisualisation
 * - Génération automatique de slug
 * - Validation des URLs et numéros de téléphone
 * - Interface utilisateur Material Design
 */
export default function AddCinemaScreen({ navigation }: AddCinemaScreenProps) {
  // États du formulaire
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1976d2');
  const [secondaryColor, setSecondaryColor] = useState('#e3f2fd');
  const [qrFormat, setQrFormat] = useState('');
  const [notes, setNotes] = useState('');
  const [logoUri, setLogoUri] = useState<string>('');

  // États UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hook pour ajouter des cinémas
  const { add } = useCinemas();

  /**
   * Génère un slug URL-friendly à partir du nom du cinéma
   * Supprime les accents, caractères spéciaux et normalise les espaces
   */
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s]/g, '') // Garder uniquement lettres, chiffres et espaces
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .trim();
  };

  /**
   * Valide tous les champs du formulaire
   * Retourne true si le formulaire est valide, false sinon
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validation du nom (obligatoire)
    if (!name.trim()) newErrors.name = 'Nom du cinéma requis';
    if (name.trim().length < 2) newErrors.name = 'Nom trop court (min 2 caractères)';

    // Validation de l'URL (optionnelle mais si fournie doit être valide)
    if (website && !website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'URL invalide (doit commencer par http:// ou https://)';
    }

    // Validation du téléphone (optionnel mais format valide)
    if (phone && !phone.match(/^[\d\s\-\+\(\)\.]+$/)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    // Validation des couleurs hexadécimales
    if (primaryColor && !primaryColor.match(/^#[0-9a-fA-F]{6}$/)) {
      newErrors.primaryColor = 'Couleur invalide (format #RRGGBB requis)';
    }

    if (secondaryColor && !secondaryColor.match(/^#[0-9a-fA-F]{6}$/)) {
      newErrors.secondaryColor = 'Couleur invalide (format #RRGGBB requis)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gestionnaire de sélection de logo
   * Ouvre la galerie et sauvegarde l'image sélectionnée
   */
  const handleSelectLogo = async () => {
    try {
      const result = await imageManager.pickLogo();
      if (result) {
        // Générer un slug temporaire pour la sauvegarde
        const tempSlug = generateSlug(name || 'temp');
        const savedUri = await imageManager.saveLogo(result.uri, tempSlug);
        if (savedUri) {
          setLogoUri(savedUri);
          if (errors.logoUri) setErrors(prev => ({ ...prev, logoUri: '' }));
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le logo.');
    }
  };

  /**
   * Gestionnaire de suppression de logo
   */
  const handleRemoveLogo = async () => {
    if (logoUri) {
      await imageManager.deleteLogo(logoUri);
      setLogoUri('');
    }
  };

  /**
   * Gestionnaire de sauvegarde du formulaire
   * Valide, enregistre en base et retourne à l'écran précédent
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await add({
        name: name.trim(),
        slug: generateSlug(name.trim()),
        city: city.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        primaryColor: primaryColor || '#1976d2',
        secondaryColor: secondaryColor || '#e3f2fd',
        qrFormat: qrFormat.trim() || null,
        notes: notes.trim() || null,
        logoUri: logoUri || null, // Utiliser le logo sélectionné
        country: 'France', // Valeur par défaut
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le cinéma. Vérifiez que le nom n\'est pas déjà utilisé.');
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
              onChangeText={(text) => {
                setWebsite(text);
                if (errors.website) setErrors(prev => ({ ...prev, website: '' }));
              }}
              error={!!errors.website}
              placeholder="https://cinema.example.com"
              keyboardType="url"
              autoCapitalize="none"
              left={<TextInput.Icon icon="web" />}
              style={styles.textInput}
            />
            <HelperText type="error" visible={!!errors.website}>{errors.website}</HelperText>
          </View>

          {/* Phone */}
          <View style={styles.inputSection}>
            <TextInput
              label="Téléphone"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              error={!!errors.phone}
              placeholder="01 23 45 67 89"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.textInput}
            />
            <HelperText type="error" visible={!!errors.phone}>{errors.phone}</HelperText>
          </View>

          {/* Logo Section */}
          <View style={styles.inputSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Logo du cinéma</Text>

            <View style={styles.logoContainer}>
              {/* Prévisualisation du logo */}
              <View style={styles.logoPreview}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={name.charAt(0).toUpperCase() || '?'}
                    style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}
                    labelStyle={{ fontSize: 32, color: 'white' }}
                  />
                )}
              </View>

              {/* Boutons d'action */}
              <View style={styles.logoActions}>
                <Button
                  mode="outlined"
                  onPress={handleSelectLogo}
                  disabled={loading}
                  icon="image-plus"
                  style={styles.logoButton}
                >
                  {logoUri ? 'Changer le logo' : 'Sélectionner un logo'}
                </Button>

                {logoUri && (
                  <Button
                    mode="text"
                    onPress={handleRemoveLogo}
                    disabled={loading}
                    icon="delete"
                    textColor="#f44336"
                    style={styles.logoButton}
                  >
                    Supprimer
                  </Button>
                )}
              </View>
            </View>

            <HelperText type="info">
              Formats supportés : PNG, JPG, WebP (max 2MB)
            </HelperText>
          </View>

          {/* Colors Section */}
          <View style={styles.colorSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Couleurs du thème</Text>

            <View style={styles.colorRow}>
              <View style={styles.colorInput}>
                <TextInput
                  label="Couleur principale"
                  value={primaryColor}
                  onChangeText={(text) => {
                    setPrimaryColor(text);
                    if (errors.primaryColor) setErrors(prev => ({ ...prev, primaryColor: '' }));
                  }}
                  error={!!errors.primaryColor}
                  placeholder="#1976d2"
                  left={<TextInput.Icon icon="palette" />}
                  right={
                    <View style={[styles.colorPreview, { backgroundColor: primaryColor }]} />
                  }
                  style={styles.textInput}
                />
                <HelperText type="error" visible={!!errors.primaryColor}>{errors.primaryColor}</HelperText>
              </View>

              <View style={styles.colorInput}>
                <TextInput
                  label="Couleur secondaire"
                  value={secondaryColor}
                  onChangeText={(text) => {
                    setSecondaryColor(text);
                    if (errors.secondaryColor) setErrors(prev => ({ ...prev, secondaryColor: '' }));
                  }}
                  error={!!errors.secondaryColor}
                  placeholder="#e3f2fd"
                  left={<TextInput.Icon icon="palette-outline" />}
                  right={
                    <View style={[styles.colorPreview, { backgroundColor: secondaryColor }]} />
                  }
                  style={styles.textInput}
                />
                <HelperText type="error" visible={!!errors.secondaryColor}>{errors.secondaryColor}</HelperText>
              </View>
            </View>
          </View>

          {/* QR Format Input */}
          <View style={styles.inputSection}>
            <TextInput
              label="Format QR (optionnel)"
              value={qrFormat}
              onChangeText={setQrFormat}
              placeholder="Ex: URL, TEXT, CODEWEB=..."
              left={<TextInput.Icon icon="qrcode" />}
              style={styles.textInput}
            />
            <HelperText type="info">
              Description du format des QR codes utilisé par ce cinéma
            </HelperText>
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
  colorSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 16,
  },
  colorInput: {
    flex: 1,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 20,
    marginRight: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  logoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
  },
  logoActions: {
    flex: 1,
    gap: 8,
  },
  logoButton: {
    alignSelf: 'flex-start',
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