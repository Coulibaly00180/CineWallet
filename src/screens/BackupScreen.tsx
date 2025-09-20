import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Switch,
  Divider,
  ProgressBar,
  Chip
} from 'react-native-paper';
import { backupManager, ExportOptions } from '@/utils/backupManager';

/**
 * Écran de gestion des sauvegardes et restaurations
 *
 * Fonctionnalités :
 * - Export sélectif des données en JSON
 * - Import avec gestion des conflits
 * - Statistiques des données actuelles
 * - Options de filtrage pour l'export
 * - Partage des sauvegardes
 */
export default function BackupScreen() {
  // États pour les options d'export
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeUsedTickets: true,
    includeExpiredTickets: true,
    includeCinemas: true,
    includePersonalData: false,
  });

  // États pour l'interface
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statistics, setStatistics] = useState({
    totalTickets: 0,
    pendingTickets: 0,
    usedTickets: 0,
    expiredTickets: 0,
    totalCinemas: 0,
  });

  /**
   * Charge les statistiques au montage du composant
   */
  useEffect(() => {
    loadStatistics();
  }, []);

  /**
   * Récupère les statistiques des données actuelles
   */
  const loadStatistics = async () => {
    try {
      const stats = await backupManager.getDataStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  /**
   * Gestionnaire d'export avec partage
   */
  const handleExport = async () => {
    setLoading(true);
    try {
      const filePath = await backupManager.exportData(exportOptions);
      if (filePath) {
        // Proposer le partage directement
        Alert.alert(
          'Sauvegarde créée',
          'Votre sauvegarde a été créée avec succès. Voulez-vous la partager ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Partager',
              onPress: () => backupManager.shareBackup(filePath)
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestionnaire d'import avec ajout
   */
  const handleImportAdd = async () => {
    setImporting(true);
    try {
      const success = await backupManager.importData(false);
      if (success) {
        await loadStatistics(); // Recharger les stats
      }
    } finally {
      setImporting(false);
    }
  };

  /**
   * Gestionnaire d'import avec remplacement
   */
  const handleImportReplace = async () => {
    Alert.alert(
      'Attention',
      'Cette action va supprimer TOUTES vos données actuelles et les remplacer par celles de la sauvegarde. Cette action est IRREVERSIBLE.\n\nÊtes-vous absolument certain de vouloir continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Remplacer tout',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              const success = await backupManager.importData(true);
              if (success) {
                await loadStatistics(); // Recharger les stats
              }
            } finally {
              setImporting(false);
            }
          }
        },
      ]
    );
  };

  /**
   * Met à jour une option d'export
   */
  const updateExportOption = (key: keyof ExportOptions, value: boolean) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="cloud-sync" size={32} iconColor="#1976d2" />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Sauvegarde & Restauration
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Gérez vos données avec les options de sauvegarde et d'import
        </Text>
      </View>

      {/* Statistiques actuelles */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Données actuelles
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="bodyLarge" style={styles.statNumber}>
                {statistics.totalTickets}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Billets total
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="bodyLarge" style={[styles.statNumber, { color: '#4caf50' }]}>
                {statistics.pendingTickets}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Valides
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="bodyLarge" style={[styles.statNumber, { color: '#666' }]}>
                {statistics.usedTickets}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Utilisés
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="bodyLarge" style={[styles.statNumber, { color: '#f44336' }]}>
                {statistics.expiredTickets}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Expirés
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.cinemaStats}>
            <Chip icon="movie" style={styles.cinemaChip}>
              {statistics.totalCinemas} cinémas configurés
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Export Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Créer une sauvegarde
          </Text>

          <Text variant="bodyMedium" style={styles.sectionDescription}>
            Exportez vos données en format JSON pour les sauvegarder ou les transférer.
          </Text>

          {/* Options d'export */}
          <View style={styles.optionsSection}>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text variant="bodyMedium">Inclure les billets utilisés</Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Exporter aussi les billets marqués comme utilisés
                </Text>
              </View>
              <Switch
                value={exportOptions.includeUsedTickets}
                onValueChange={(value) => updateExportOption('includeUsedTickets', value)}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text variant="bodyMedium">Inclure les billets expirés</Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Exporter les billets dont la date est passée
                </Text>
              </View>
              <Switch
                value={exportOptions.includeExpiredTickets}
                onValueChange={(value) => updateExportOption('includeExpiredTickets', value)}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text variant="bodyMedium">Inclure les cinémas</Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Exporter la configuration des cinémas
                </Text>
              </View>
              <Switch
                value={exportOptions.includeCinemas}
                onValueChange={(value) => updateExportOption('includeCinemas', value)}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text variant="bodyMedium">Inclure les données personnelles</Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Notes privées et chemins de fichiers locaux
                </Text>
              </View>
              <Switch
                value={exportOptions.includePersonalData}
                onValueChange={(value) => updateExportOption('includePersonalData', value)}
              />
            </View>
          </View>

          {loading && (
            <View style={styles.progressSection}>
              <ProgressBar indeterminate style={styles.progressBar} />
              <Text variant="bodySmall" style={styles.progressText}>
                Création de la sauvegarde...
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleExport}
            loading={loading}
            disabled={loading || importing}
            icon="export"
            style={styles.actionButton}
          >
            Créer et partager la sauvegarde
          </Button>
        </Card.Content>
      </Card>

      {/* Import Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Restaurer une sauvegarde
          </Text>

          <Text variant="bodyMedium" style={styles.sectionDescription}>
            Importez des données depuis un fichier de sauvegarde JSON.
          </Text>

          {importing && (
            <View style={styles.progressSection}>
              <ProgressBar indeterminate style={styles.progressBar} />
              <Text variant="bodySmall" style={styles.progressText}>
                Import en cours...
              </Text>
            </View>
          )}

          <View style={styles.importButtons}>
            <Button
              mode="outlined"
              onPress={handleImportAdd}
              loading={importing}
              disabled={loading || importing}
              icon="plus"
              style={styles.actionButton}
            >
              Ajouter à mes données
            </Button>

            <Button
              mode="outlined"
              onPress={handleImportReplace}
              loading={importing}
              disabled={loading || importing}
              icon="swap-horizontal"
              style={[styles.actionButton, styles.dangerButton]}
              labelStyle={styles.dangerButtonText}
            >
              Remplacer tout
            </Button>
          </View>

          <Text variant="bodySmall" style={styles.warningText}>
            L'option "Remplacer tout" supprimera définitivement toutes vos données actuelles.
          </Text>
        </Card.Content>
      </Card>
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
  card: {
    margin: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  sectionTitle: {
    marginBottom: 8,
    color: '#333',
    fontWeight: '600',
  },
  sectionDescription: {
    marginBottom: 16,
    color: '#666',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    marginTop: 4,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  cinemaStats: {
    alignItems: 'center',
  },
  cinemaChip: {
    backgroundColor: '#e3f2fd',
  },
  optionsSection: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionInfo: {
    flex: 1,
    marginRight: 16,
  },
  optionDescription: {
    color: '#666',
    marginTop: 2,
  },
  progressSection: {
    marginVertical: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    marginBottom: 8,
  },
  progressText: {
    color: '#666',
  },
  actionButton: {
    marginVertical: 4,
  },
  importButtons: {
    gap: 8,
  },
  dangerButton: {
    borderColor: '#f44336',
  },
  dangerButtonText: {
    color: '#f44336',
  },
  warningText: {
    marginTop: 12,
    color: '#f44336',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});