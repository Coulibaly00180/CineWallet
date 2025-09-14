import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/screens/HomeScreen';
import AddTicketScreen from '@/screens/AddTicketScreen';
import ScanScreen from '@/screens/ScanScreen';
import { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CineWallet' }}/>
        <Stack.Screen name="AddTicket" component={AddTicketScreen} options={{ title: 'Ajouter un billet' }}/>
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scanner QR' }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
