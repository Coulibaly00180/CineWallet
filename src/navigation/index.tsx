import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/screens/HomeScreen';
import AddTicketScreen from '@/screens/AddTicketScreen';
import ScanScreen from '@/screens/ScanScreen';
import CinemasScreen from '@/screens/CinemasScreen';
import AddCinemaScreen from '@/screens/AddCinemaScreen';
import { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CineWallet' }}/>
        <Stack.Screen name="AddTicket" component={AddTicketScreen} options={{ title: 'Ajouter un billet' }}/>
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scanner QR' }}/>
        <Stack.Screen name="Cinemas" component={CinemasScreen} options={{ title: 'Cinémas' }}/>
        <Stack.Screen name="AddCinema" component={AddCinemaScreen} options={{ title: 'Ajouter un cinéma' }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
