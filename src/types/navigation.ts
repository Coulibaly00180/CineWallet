import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  AddTicket: { qrPayload?: string } | undefined;
  Scan: undefined;
  TicketDetail: { id: string };
  Cinemas: undefined;
  AddCinema: undefined;
  Backup: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type AddTicketScreenProps = NativeStackScreenProps<RootStackParamList, 'AddTicket'>;
export type ScanScreenProps = NativeStackScreenProps<RootStackParamList, 'Scan'>;
export type TicketDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TicketDetail'>;
export type CinemasScreenProps = NativeStackScreenProps<RootStackParamList, 'Cinemas'>;
export type AddCinemaScreenProps = NativeStackScreenProps<RootStackParamList, 'AddCinema'>;
export type BackupScreenProps = NativeStackScreenProps<RootStackParamList, 'Backup'>;