import { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { FAB, Button, Text } from 'react-native-paper';
import { useTickets } from '@/state/useTickets';
import TicketCard from '@/components/TicketCard';
import { HomeScreenProps } from '@/types/navigation';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { items, refresh } = useTickets();
  useEffect(() => { refresh(); }, []);

  return (
    <View style={{ flex:1, padding:16 }}>
      <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
        <Button onPress={refresh}>Rafraîchir</Button>
        <Button onPress={() => navigation.navigate('AddTicket')}>Ajouter</Button>
      </View>

      {items.length === 0 ? (
        <Text>Aucun billet. Ajoute ton premier billet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TicketCard ticket={item} onPress={() => navigation.navigate('TicketDetail', { id: item.id })}/>
          )}
        />
      )}

      <FAB icon="plus" style={{ position:'absolute', right:16, bottom:16 }}
           onPress={() => navigation.navigate('AddTicket')} />
    </View>
  );
}
