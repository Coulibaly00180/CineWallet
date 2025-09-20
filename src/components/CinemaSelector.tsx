import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Menu, Button, HelperText, Text, Avatar, Divider } from 'react-native-paper';
import { useCinemas } from '@/state/useCinemas';

/**
 * Props du composant CinemaSelector
 */
type CinemaSelectorProps = {
  /** ID du cinéma actuellement sélectionné */
  value: string;
  /** Callback appelé lors de la sélection d'un cinéma */
  onSelect: (cinemaId: string, cinemaName: string) => void;
  /** Message d'erreur à afficher */
  error?: string;
  /** Callback pour ajouter un nouveau cinéma */
  onAddNew?: () => void;
};

/**
 * Composant sélecteur de cinéma avec interface visuelle avancée
 *
 * Fonctionnalités :
 * - Affichage des cinémas avec leurs couleurs personnalisées
 * - Support pour les logos d'images ou génération d'avatars
 * - Menu déroulant avec recherche visuelle
 * - Gestion des erreurs et validation
 * - Option pour ajouter un nouveau cinéma
 */
export default function CinemaSelector({ value, onSelect, error, onAddNew }: CinemaSelectorProps) {
  // État local pour l'affichage du menu déroulant
  const [menuVisible, setMenuVisible] = useState(false);

  // Récupération des cinémas depuis le store Zustand
  const { items: cinemas, refresh: refreshCinemas } = useCinemas();

  // Trouver le cinéma actuellement sélectionné
  const selectedCinema = cinemas.find(cinema => cinema.id === value);

  // Charger les cinémas si la liste est vide (premier chargement)
  useEffect(() => {
    if (cinemas.length === 0) {
      refreshCinemas();
    }
  }, [cinemas.length]);

  /**
   * Composant pour afficher un élément de cinéma dans le menu déroulant
   * Inclut logo/avatar, nom, ville et indicateur de sélection
   */
  const CinemaMenuItem = ({ cinema }: { cinema: typeof cinemas[0] }) => (
    <Menu.Item
      onPress={() => {
        // Déclencher la sélection et fermer le menu
        onSelect(cinema.id, cinema.name);
        setMenuVisible(false);
      }}
      title={
        <View style={styles.menuItemContent}>
          {/* Informations principales du cinéma */}
          <View style={styles.cinemaInfo}>
            {/* Logo ou avatar généré avec la couleur du cinéma */}
            {cinema.logoUri ? (
              <Image source={{ uri: cinema.logoUri }} style={styles.cinemaLogo} />
            ) : (
              <Avatar.Text
                size={32}
                label={cinema.name.charAt(0).toUpperCase()}
                style={[
                  styles.cinemaAvatar,
                  { backgroundColor: cinema.primaryColor || '#1976d2' }
                ]}
                labelStyle={{ fontSize: 14, color: 'white' }}
              />
            )}
            {/* Détails texte du cinéma */}
            <View style={styles.cinemaDetails}>
              <Text variant="bodyMedium" style={styles.cinemaName}>
                {cinema.name}
              </Text>
              {cinema.city && (
                <Text variant="bodySmall" style={styles.cinemaCity}>
                  {cinema.city}
                </Text>
              )}
            </View>
          </View>
          {/* Indicateur de sélection pour le cinéma actuel */}
          {value === cinema.id && (
            <Avatar.Icon
              size={20}
              icon="check"
              style={styles.checkIcon}
            />
          )}
        </View>
      }
      style={[
        styles.menuItem,
        value === cinema.id && styles.selectedMenuItem
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Menu déroulant principal */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        contentStyle={styles.menuContent}
        anchor={
          /* Bouton de sélection principal */
          <Button
            mode="outlined"
            onPress={() => setMenuVisible(!menuVisible)}
            contentStyle={styles.buttonContent}
            style={[styles.button, error && styles.buttonError]}
            labelStyle={[styles.buttonLabel, !selectedCinema && styles.placeholderText]}
          >
            <View style={styles.buttonInner}>
              {/* Affichage conditionnel selon la sélection */}
              {selectedCinema ? (
                <>
                  {/* Logo ou avatar du cinéma sélectionné */}
                  {selectedCinema.logoUri ? (
                    <Image
                      source={{ uri: selectedCinema.logoUri }}
                      style={styles.selectedLogo}
                    />
                  ) : (
                    <Avatar.Text
                      size={24}
                      label={selectedCinema.name.charAt(0).toUpperCase()}
                      style={[
                        styles.selectedAvatar,
                        { backgroundColor: selectedCinema.primaryColor || '#1976d2' }
                      ]}
                      labelStyle={{ fontSize: 12, color: 'white' }}
                    />
                  )}
                  {/* Informations du cinéma sélectionné */}
                  <View style={styles.selectedInfo}>
                    <Text variant="bodyMedium" style={styles.selectedName}>
                      {selectedCinema.name}
                    </Text>
                    {selectedCinema.city && (
                      <Text variant="bodySmall" style={styles.selectedCity}>
                        {selectedCinema.city}
                      </Text>
                    )}
                  </View>
                </>
              ) : (
                /* État par défaut sans sélection */
                <>
                  <Avatar.Icon size={24} icon="movie" style={styles.placeholderIcon} />
                  <Text style={styles.placeholderTextStyle}>Sélectionnez un cinéma</Text>
                </>
              )}
              {/* Icône de dropdown */}
              <Avatar.Icon size={20} icon="chevron-down" style={styles.dropdownIcon} />
            </View>
          </Button>
        }
      >
        {/* Liste des cinémas ou état vide */}
        {cinemas.length === 0 ? (
          <Menu.Item
            onPress={() => {}}
            title="Aucun cinéma disponible"
            disabled
            leadingIcon="alert-circle"
          />
        ) : (
          /* Affichage de tous les cinémas disponibles */
          cinemas.map((cinema) => (
            <CinemaMenuItem key={cinema.id} cinema={cinema} />
          ))
        )}

        {/* Option pour ajouter un nouveau cinéma (si callback fourni) */}
        {onAddNew && (
          <>
            <Divider style={styles.divider} />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onAddNew();
              }}
              title="Ajouter un nouveau cinéma"
              leadingIcon="plus"
              titleStyle={styles.addNewText}
            />
          </>
        )}
      </Menu>

      {/* Message d'erreur de validation */}
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#fafafa',
    paddingVertical: 8,
    justifyContent: 'flex-start',
  },
  buttonError: {
    borderColor: '#f44336',
  },
  buttonContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'left',
    flex: 1,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectedLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectedAvatar: {
    width: 24,
    height: 24,
  },
  selectedInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  selectedName: {
    fontWeight: '500',
    color: '#333',
  },
  selectedCity: {
    color: '#666',
    fontSize: 12,
  },
  placeholderIcon: {
    backgroundColor: '#e0e0e0',
    width: 24,
    height: 24,
  },
  placeholderText: {
    color: '#666',
  },
  placeholderTextStyle: {
    color: '#666',
    fontSize: 16,
    flex: 1,
    textAlign: 'left',
  },
  dropdownIcon: {
    backgroundColor: 'transparent',
    width: 20,
    height: 20,
  },
  menuContent: {
    maxHeight: 300,
    backgroundColor: 'white',
  },
  menuItem: {
    paddingVertical: 4,
  },
  selectedMenuItem: {
    backgroundColor: '#e3f2fd',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cinemaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cinemaLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  cinemaAvatar: {
    width: 32,
    height: 32,
  },
  cinemaDetails: {
    flex: 1,
  },
  cinemaName: {
    fontWeight: '500',
    color: '#333',
  },
  cinemaCity: {
    color: '#666',
    marginTop: 2,
  },
  checkIcon: {
    backgroundColor: '#4caf50',
    width: 20,
    height: 20,
  },
  divider: {
    marginVertical: 8,
  },
  addNewText: {
    color: '#1976d2',
    fontWeight: '500',
  },
});