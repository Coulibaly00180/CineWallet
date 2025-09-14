import { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FAB, Button, Text, Card, IconButton } from 'react-native-paper';
import { useTickets } from '@/state/useTickets';
import TicketCard from '@/components/TicketCard';
import { HomeScreenProps } from '@/types/navigation';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { items, refresh, loading } = useTickets();

  useEffect(() => {
    refresh();
  }, []);

  const pendingTickets = items.filter(ticket => ticket.status === 'PENDING');
  const usedTickets = items.filter(ticket => ticket.status === 'USED');

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
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => navigation.navigate('TicketDetail', { id: item.id })}
            />
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
});
