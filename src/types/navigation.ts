import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  AddTicket: { qrPayload?: string } | undefined;
  Scan: undefined;
  TicketDetail: { id: string };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type AddTicketScreenProps = NativeStackScreenProps<RootStackParamList, 'AddTicket'>;
export type ScanScreenProps = NativeStackScreenProps<RootStackParamList, 'Scan'>;
export type TicketDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TicketDetail'>;