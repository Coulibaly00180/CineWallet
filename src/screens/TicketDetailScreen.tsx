import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  Avatar
} from 'react-native-paper';
import { useTickets } from '@/state/useTickets';
import { useCinemas } from '@/state/useCinemas';
import { TicketDetailScreenProps } from '@/types/navigation';

/**
 * Écran de détail d'un billet
 *
 * Fonctionnalités :
 * - Affichage complet des informations du billet
 * - Actions contextuelles (marquer utilisé, partager, etc.)
 * - Informations du cinéma associé
 * - Statut visuel et gestion des dates d'expiration
 * - Historique des modifications
 */
export default function TicketDetailScreen({ navigation, route }: TicketDetailScreenProps) {
  const { id } = route.params;
  const { items: tickets, markUsed, remove } = useTickets();
  const { items: cinemas } = useCinemas();

  // Trouver le billet et le cinéma
  const ticket = tickets.find(t => t.id === id);
  const cinema = ticket ? cinemas.find(c => c.id === ticket.cinemaId) : null;

  const [loading, setLoading] = useState(false);

  // Rediriger si le billet n'existe pas
  useEffect(() => {
    if (!ticket) {
      Alert.alert('Erreur', 'Billet introuvable.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [ticket, navigation]);

  if (!ticket) {
    return null;
  }

  // Vérifications de statut
  const isExpired = new Date() > new Date(ticket.expiresAt) && ticket.status === 'PENDING';
  const isUsed = ticket.status === 'USED';
  const isValid = ticket.status === 'PENDING' && !isExpired;

  // Couleurs et icônes selon le statut
  const getStatusInfo = () => {
    if (isUsed) {
      return {
        color: '#666',
        backgroundColor: '#f5f5f5',
        icon: 'check-circle',
        label: 'Utilisé',
        description: `Utilisé le ${ticket.usedAt ? new Date(ticket.usedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}`
      };
    }
    if (isExpired) {
      return {
        color: '#f44336',
        backgroundColor: '#ffebee',
        icon: 'alert-circle',
        label: 'Expiré',
        description: `Expiré le ${new Date(ticket.expiresAt).toLocaleDateString('fr-FR')}`
      };
    }
    return {
      color: '#4caf50',
      backgroundColor: '#e8f5e8',
      icon: 'check-circle-outline',
      label: 'Valide',
      description: `Expire le ${new Date(ticket.expiresAt).toLocaleDateString('fr-FR')}`
    };
  };

  const statusInfo = getStatusInfo();

  /**
   * Marquer le billet comme utilisé
   */
  const handleMarkUsed = async () => {
    if (isUsed) return;

    Alert.alert(
      'Marquer comme utilisé',
      'Êtes-vous sûr de vouloir marquer ce billet comme utilisé ? Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await markUsed(ticket.id);
              Alert.alert('Succès', 'Billet marqué comme utilisé.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de marquer le billet comme utilisé.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  /**
   * Supprimer le billet
   */
  const handleDelete = async () => {
    Alert.alert(
      'Supprimer le billet',
      'Êtes-vous sûr de vouloir supprimer ce billet ? Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await remove(ticket.id);
              Alert.alert('Succès', 'Billet supprimé.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le billet.');
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  /**
   * Partager les informations du billet
   */
  const handleShare = async () => {
    try {
      const shareContent = `Billet de cinéma - ${cinema?.name || 'Cinéma inconnu'}
Code: ${ticket.code}
Expire le: ${new Date(ticket.expiresAt).toLocaleDateString('fr-FR')}
Statut: ${statusInfo.label}

Géré avec CineWallet`;

      await Share.share({
        message: shareContent,
        title: 'Billet de cinéma',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  /**
   * Calculer les jours restants
   */
  const getDaysUntilExpiration = () => {
    if (isUsed || isExpired) return null;

    const now = new Date();
    const expirationDate = new Date(ticket.expiresAt);
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Expire aujourd\'hui';
    if (diffDays === 1) return 'Expire demain';
    return `Expire dans ${diffDays} jours`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec statut */}
      <View style={[styles.header, { backgroundColor: statusInfo.backgroundColor }]}>
        <View style={styles.headerContent}>
          <IconButton icon={statusInfo.icon} size={48} iconColor={statusInfo.color} />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={[styles.headerTitle, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              {statusInfo.description}
            </Text>
            {getDaysUntilExpiration() && (
              <Text variant="bodySmall" style={styles.daysRemaining}>
                {getDaysUntilExpiration()}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Informations du billet */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Informations du billet
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={styles.infoLabel}>Code</Text>
                <Text variant="titleMedium" style={styles.infoValue}>{ticket.code}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={styles.infoLabel}>Statut</Text>
                <Chip
                  icon={statusInfo.icon}
                  style={[styles.statusChip, { backgroundColor: statusInfo.backgroundColor }]}
                  textStyle={{ color: statusInfo.color }}
                >
                  {statusInfo.label}
                </Chip>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={styles.infoLabel}>Date d'expiration</Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {new Date(ticket.expiresAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {ticket.usedAt && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text variant="bodySmall" style={styles.infoLabel}>Date d'utilisation</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {new Date(ticket.usedAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Informations du cinéma */}
      {cinema && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cinéma
            </Text>

            <View style={styles.cinemaInfo}>
              <Avatar.Text
                size={64}
                label={cinema.name.charAt(0).toUpperCase()}
                style={[styles.cinemaAvatar, { backgroundColor: cinema.primaryColor || '#1976d2' }]}
              />
              <View style={styles.cinemaDetails}>
                <Text variant="titleLarge" style={styles.cinemaName}>
                  {cinema.name}
                </Text>
                {cinema.city && (
                  <Text variant="bodyMedium" style={styles.cinemaCity}>
                    {cinema.city}
                  </Text>
                )}
                {cinema.website && (
                  <Text variant="bodySmall" style={styles.cinemaWebsite}>
                    {cinema.website}
                  </Text>
                )}
              </View>
            </View>

            {cinema.qrFormat && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.qrFormatInfo}>
                  <Text variant="bodySmall" style={styles.infoLabel}>Format QR</Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>{cinema.qrFormat}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* QR Code */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Contenu QR Code
          </Text>
          <View style={styles.qrContent}>
            <Text variant="bodyMedium" style={styles.qrText} selectable>
              {ticket.qrPayload}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Notes */}
      {ticket.notes && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notes
            </Text>
            <Text variant="bodyMedium" style={styles.notesText}>
              {ticket.notes}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Métadonnées */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Informations techniques
          </Text>
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text variant="bodySmall" style={styles.infoLabel}>Créé le</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text variant="bodySmall" style={styles.infoLabel}>Modifié le</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {new Date(ticket.updatedAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {isValid && (
          <Button
            mode="contained"
            onPress={handleMarkUsed}
            loading={loading}
            disabled={loading}
            icon="check"
            style={[styles.actionButton, styles.useButton]}
          >
            Marquer comme utilisé
          </Button>
        )}

        <Button
          mode="outlined"
          onPress={handleShare}
          disabled={loading}
          icon="share"
          style={styles.actionButton}
        >
          Partager
        </Button>

        <Button
          mode="outlined"
          onPress={handleDelete}
          disabled={loading}
          icon="delete"
          style={[styles.actionButton, styles.deleteButton]}
          labelStyle={styles.deleteButtonText}
        >
          Supprimer
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#666',
  },
  daysRemaining: {
    marginTop: 4,
    fontWeight: '500',
    color: '#1976d2',
  },
  card: {
    margin: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
    fontWeight: '600',
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    color: '#333',
    fontWeight: '600',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 8,
  },
  cinemaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cinemaAvatar: {
    alignSelf: 'flex-start',
  },
  cinemaDetails: {
    flex: 1,
  },
  cinemaName: {
    fontWeight: 'bold',
    color: '#333',
  },
  cinemaCity: {
    color: '#666',
    marginTop: 2,
  },
  cinemaWebsite: {
    color: '#1976d2',
    marginTop: 4,
  },
  qrFormatInfo: {
    paddingTop: 8,
  },
  qrContent: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qrText: {
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 20,
  },
  notesText: {
    color: '#333',
    lineHeight: 22,
  },
  metadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  metadataItem: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 4,
  },
  useButton: {
    backgroundColor: '#4caf50',
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
  },
});