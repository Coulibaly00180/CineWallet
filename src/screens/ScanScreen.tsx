import { View, Text, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { ScanScreenProps } from '@/types/navigation';
import { useState } from 'react';

export default function ScanScreen({ navigation }: ScanScreenProps) {
  const [manualQR, setManualQR] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner QR Code</Text>
      <Text style={styles.subtitle}>
        Scanner temporairement désactivé
      </Text>

      <View style={styles.manualSection}>
        <Text style={styles.label}>Saisie manuelle du QR :</Text>
        <TextInput
          label="Contenu du QR code"
          value={manualQR}
          onChangeText={setManualQR}
          multiline
          style={styles.textInput}
        />

        <Button
          mode="contained"
          onPress={() => {
            if (manualQR.trim()) {
              navigation.navigate('AddTicket', { qrPayload: manualQR.trim() });
            }
          }}
          disabled={!manualQR.trim()}
          style={styles.button}
        >
          Utiliser ce QR
        </Button>
      </View>

      <Button onPress={() => navigation.goBack()}>
        Retour
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
  },
  manualSection: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  textInput: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
});
