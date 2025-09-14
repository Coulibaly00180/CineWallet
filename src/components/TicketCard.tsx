import { Card, Text, Button } from 'react-native-paper';
import { View } from 'react-native';
import { useTickets } from '@/state/useTickets';

export default function TicketCard({ ticket, onPress }: any) {
  const { markUsed } = useTickets();
  const expired = ticket.expiresAt && ticket.expiresAt < Date.now();

  return (
    <Card onPress={onPress} style={{ marginBottom: 12 }}>
      <Card.Title title={ticket.code} subtitle={ticket.status + (expired ? ' • Expiré' : '')} />
      <Card.Content>
        <Text variant="bodyMedium">Cinéma: {ticket.cinemaId}</Text>
        <Text variant="bodySmall">Expire: {new Date(ticket.expiresAt).toLocaleDateString()}</Text>
      </Card.Content>
      <Card.Actions>
        {ticket.status !== 'USED' && <Button onPress={() => markUsed(ticket.id)}>Marquer utilisé</Button>}
      </Card.Actions>
    </Card>
  );
}
