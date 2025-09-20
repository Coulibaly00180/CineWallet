import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FAB, Button, Text, Card, IconButton, SegmentedButtons } from 'react-native-paper';
import { useTickets } from '@/state/useTickets';
import TicketCard from '@/components/TicketCard';
import { HomeScreenProps } from '@/types/navigation';
import { useNotificationScheduler, useNotificationCleanup } from '@/hooks/useNotificationScheduler';

type FilterType = 'all' | 'pending' | 'used' | 'expired';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { items, refresh, loading } = useTickets();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Initialiser les hooks de notification
  useNotificationScheduler();
  useNotificationCleanup();

  useEffect(() => {
    refresh();
  }, []);

  // Helper function to check if ticket is expired
  const isExpired = (expiresAt: Date) => {
    return new Date() > new Date(expiresAt);
  };

  // Filter tickets based on active filter
  const getFilteredTickets = () => {
    const now = new Date();
    switch (activeFilter) {
      case 'pending':
        return items.filter(ticket => ticket.status === 'PENDING' && !isExpired(ticket.expiresAt));
      case 'used':
        return items.filter(ticket => ticket.status === 'USED');
      case 'expired':
        return items.filter(ticket => ticket.status === 'PENDING' && isExpired(ticket.expiresAt));
      default: // 'all'
        return items;
    }
  };

  const filteredTickets = getFilteredTickets();
  const pendingTickets = items.filter(ticket => ticket.status === 'PENDING' && !isExpired(ticket.expiresAt));
  const usedTickets = items.filter(ticket => ticket.status === 'USED');
  const expiredTickets = items.filter(ticket => ticket.status === 'PENDING' && isExpired(ticket.expiresAt));

  return (
    <View style={styles.container}>
      {/* Header avec actions */}
      <View style={styles.header}>
        <Button
          mode="outlined"
          onPress={refresh}
          icon="refresh"
          loading={loading}
          style={styles.headerButton}
        >
          Actualiser
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('AddTicket')}
          icon="ticket"
          style={styles.headerButton}
        >
          Nouveau
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Cinemas')}
          icon="movie"
          style={styles.headerButton}
        >
          Cinémas
        </Button>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <SegmentedButtons
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as FilterType)}
          buttons={[
            {
              value: 'all',
              label: `Tous (${items.length})`,
              icon: 'ticket-outline',
            },
            {
              value: 'pending',
              label: `Valides (${pendingTickets.length})`,
              icon: 'clock-outline',
            },
            {
              value: 'used',
              label: `Utilisés (${usedTickets.length})`,
              icon: 'check-circle-outline',
            },
            {
              value: 'expired',
              label: `Expirés (${expiredTickets.length})`,
              icon: 'alert-circle-outline',
              style: expiredTickets.length > 0 ? { backgroundColor: '#ffebee' } : undefined,
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Statistiques */}
      {items.length > 0 && (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>{pendingTickets.length}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Billets actifs</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>{usedTickets.length}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Billets utilisés</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>{items.length}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Total</Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Liste des billets ou état vide */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <IconButton icon="ticket" size={64} iconColor="#ccc" />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Aucun billet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Commencez par ajouter votre premier billet de cinéma
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddTicket')}
            icon="plus"
            style={styles.emptyButton}
          >
            Ajouter un billet
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => navigation.navigate('TicketDetail', { id: item.id })}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <IconButton
                icon={
                  activeFilter === 'pending' ? 'clock-outline' :
                  activeFilter === 'used' ? 'check-circle-outline' :
                  activeFilter === 'expired' ? 'alert-circle-outline' :
                  'ticket-outline'
                }
                size={48}
                iconColor="#999"
              />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                {activeFilter === 'pending' && 'Aucun billet valide'}
                {activeFilter === 'used' && 'Aucun billet utilisé'}
                {activeFilter === 'expired' && 'Aucun billet expiré'}
                {activeFilter === 'all' && 'Aucun billet'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {activeFilter === 'pending' && 'Tous vos billets sont soit utilisés, soit expirés'}
                {activeFilter === 'used' && 'Aucun billet n\'a encore été marqué comme utilisé'}
                {activeFilter === 'expired' && 'Aucun de vos billets n\'est expiré'}
                {activeFilter === 'all' && 'Commencez par ajouter votre premier billet'}
              </Text>
            </View>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTicket')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  segmentedButtons: {
    elevation: 0,
  },
});
