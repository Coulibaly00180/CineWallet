import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FAB, Button, Text, Card, IconButton } from 'react-native-paper';
import { useCinemas } from '@/state/useCinemas';
import { CinemasScreenProps } from '@/types/navigation';

export default function CinemasScreen({ navigation }: CinemasScreenProps) {
  const { items, refresh, remove } = useCinemas();

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="outlined"
          onPress={refresh}
          icon="refresh"
          style={styles.headerButton}
        >
          Actualiser
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('AddCinema')}
          icon="plus"
          style={styles.headerButton}
        >
          Ajouter
        </Button>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <IconButton icon="movie" size={64} iconColor="#ccc" />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Aucun cinéma
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Ajoutez votre premier cinéma pour commencer à gérer vos billets
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddCinema')}
            icon="plus"
            style={styles.emptyButton}
          >
            Créer un cinéma
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.name}
                subtitle={`${item.city || 'Ville inconnue'} • ${item.slug}`}
                left={() => <IconButton icon="movie" iconColor="#1976d2" />}
                right={() => (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton
                      icon="pencil"
                      iconColor="#1976d2"
                      onPress={() => navigation.navigate('EditCinema', { cinemaId: item.id })}
                    />
                    <IconButton
                      icon="delete"
                      iconColor="#f44336"
                      onPress={() => handleDelete(item.id)}
                    />
                  </View>
                )}
              />
              <Card.Content style={styles.cardContent}>
                {item.website && (
                  <View style={styles.infoRow}>
                    <IconButton icon="web" size={18} iconColor="#666" style={styles.infoIcon} />
                    <Text variant="bodyMedium" style={styles.infoText}>{item.website}</Text>
                  </View>
                )}
                {item.phone && (
                  <View style={styles.infoRow}>
                    <IconButton icon="phone" size={18} iconColor="#666" style={styles.infoIcon} />
                    <Text variant="bodySmall" style={styles.infoText}>{item.phone}</Text>
                  </View>
                )}
                {item.notes && (
                  <View style={styles.infoRow}>
                    <IconButton icon="note-text" size={18} iconColor="#666" style={styles.infoIcon} />
                    <Text variant="bodySmall" style={[styles.infoText, { flex: 1 }]}>{item.notes}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddCinema')}
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
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    flex: 1,
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
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
  },
  cardContent: {
    paddingTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    margin: 0,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});