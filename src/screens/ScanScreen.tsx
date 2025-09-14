import { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { Button, TextInput, Divider, ActivityIndicator, Card, IconButton, Text } from 'react-native-paper';
import { ScanScreenProps } from '@/types/navigation';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export default function ScanScreen({ navigation }: ScanScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(true);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      // Attendre que permission soit chargé
      if (permission === null) {
        return;
      }

      setScannerLoading(true);
      setScannerError(null);

      try {
        if (permission.granted) {
          // Permission déjà accordée
          setScannerLoading(false);
          return;
        }

        if (!permission.canAskAgain) {
          setScannerError('Permission caméra définitivement refusée. Allez dans les paramètres pour l\'activer.');
          setScannerLoading(false);
          return;
        }

        // Demander la permission
        const result = await requestPermission();
        if (!result.granted) {
          setScannerError('Permission caméra refusée');
        }
      } catch (error) {
        console.warn('Permission request failed:', error);
        setScannerError('Erreur lors de la demande de permission');
      }

      setScannerLoading(false);
    };

    checkPermissions();
  }, [permission, requestPermission]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      navigation.navigate('AddTicket', { qrPayload: data });
    }
  };

  const handleManualInput = () => {
    if (manualQR.trim()) {
      navigation.navigate('AddTicket', { qrPayload: manualQR.trim() });
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  if (scannerLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Card style={styles.loadingCard}>
          <Card.Content style={styles.loadingContent}>
            <IconButton icon="camera" size={48} iconColor="#1976d2" />
            <ActivityIndicator size="large" style={styles.loadingIndicator} />
            <Text variant="headlineSmall" style={styles.loadingTitle}>
              Chargement du scanner...
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!permission?.granted || scannerError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorHeader}>
          <IconButton icon="camera-off" size={48} iconColor="#f44336" />
          <Text variant="headlineSmall" style={styles.errorTitle}>Scanner QR Code</Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {scannerError || 'Accès caméra refusé'}
          </Text>
          <Text variant="bodySmall" style={styles.errorSubtitle}>
            Utilisez la saisie manuelle ci-dessous
          </Text>
        </View>

        {!permission?.granted && permission?.canAskAgain && (
          <Button
            mode="outlined"
            onPress={() => requestPermission()}
            icon="camera"
            style={styles.settingsButton}
          >
            Autoriser la caméra
          </Button>
        )}

        {!permission?.canAskAgain && (
          <Button
            mode="outlined"
            onPress={openSettings}
            icon="cog"
            style={styles.settingsButton}
          >
            Ouvrir les paramètres
          </Button>
        )}

        <Card style={styles.manualCard}>
          <Card.Content>
            <View style={styles.manualHeader}>
              <IconButton icon="pencil" size={24} iconColor="#1976d2" />
              <Text variant="titleMedium" style={styles.manualTitle}>Saisie manuelle</Text>
            </View>

            <TextInput
              label="Contenu du QR code"
              value={manualQR}
              onChangeText={setManualQR}
              multiline
              numberOfLines={4}
              style={styles.manualInput}
              left={<TextInput.Icon icon="qrcode" />}
            />

            <Button
              mode="contained"
              onPress={handleManualInput}
              disabled={!manualQR.trim()}
              icon="check"
              style={styles.confirmButton}
            >
              Utiliser ce QR code
            </Button>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          style={styles.backButton}
        >
          Retour
        </Button>
      </View>
    );
  }

  if (showManual) {
    return (
      <View style={styles.manualContainer}>
        <View style={styles.manualScreenHeader}>
          <IconButton icon="pencil" size={48} iconColor="#1976d2" />
          <Text variant="headlineSmall" style={styles.manualScreenTitle}>Saisie manuelle</Text>
          <Text variant="bodyMedium" style={styles.manualScreenSubtitle}>
            Entrez le contenu du QR code manuellement
          </Text>
        </View>

        <Card style={styles.manualInputCard}>
          <Card.Content>
            <TextInput
              label="Contenu du QR code"
              value={manualQR}
              onChangeText={setManualQR}
              multiline
              numberOfLines={5}
              style={styles.manualTextInput}
              left={<TextInput.Icon icon="qrcode" />}
            />

            <Button
              mode="contained"
              onPress={handleManualInput}
              disabled={!manualQR.trim()}
              icon="check"
              style={styles.useQrButton}
            >
              Utiliser ce QR code
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.manualActions}>
          <Button
            mode="outlined"
            onPress={() => setShowManual(false)}
            icon="camera"
            style={styles.backToScanButton}
          >
            Retour au scanner
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            icon="arrow-left"
          >
            Retour
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
      />

      <View style={styles.scannerOverlay}>
        <View style={styles.scannerHeader}>
          <Text variant="headlineSmall" style={styles.scannerTitle}>
            Scanner QR Code
          </Text>
          <Text variant="bodyMedium" style={styles.scannerSubtitle}>
            Placez le QR code dans le cadre ci-dessous
          </Text>
        </View>

        <View style={styles.scanFrame}>
          <View style={styles.scanCorners}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.scannerActions}>
          {scanned && (
            <Button
              mode="contained"
              onPress={() => setScanned(false)}
              icon="refresh"
              style={styles.scanAgainButton}
              labelStyle={styles.scanAgainText}
            >
              Scanner à nouveau
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={() => setShowManual(true)}
            icon="pencil"
            style={styles.manualButton}
            buttonColor="rgba(255,255,255,0.9)"
          >
            Saisie manuelle
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            icon="arrow-left"
            style={styles.backScanButton}
            textColor="white"
          >
            Retour
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingCard: {
    elevation: 3,
    borderRadius: 12,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  loadingTitle: {
    textAlign: 'center',
    color: '#1976d2',
    fontWeight: '500',
  },

  // Error states
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'space-between',
  },
  errorHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    marginTop: 16,
    textAlign: 'center',
    color: '#1976d2',
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#f44336',
  },
  errorSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  settingsButton: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  manualCard: {
    elevation: 2,
    marginBottom: 20,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  manualTitle: {
    marginLeft: 8,
    color: '#1976d2',
    fontWeight: '600',
  },
  manualInput: {
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  confirmButton: {
    elevation: 1,
  },
  backButton: {
    alignSelf: 'center',
  },

  // Manual input screen
  manualContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  manualScreenHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 1,
  },
  manualScreenTitle: {
    marginTop: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  manualScreenSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  manualInputCard: {
    flex: 1,
    marginBottom: 20,
    elevation: 2,
  },
  manualTextInput: {
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  useQrButton: {
    elevation: 1,
  },
  manualActions: {
    gap: 12,
  },
  backToScanButton: {
    elevation: 1,
  },

  // Scanner UI
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  scannerHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scannerTitle: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanFrame: {
    alignSelf: 'center',
    width: 280,
    height: 280,
    position: 'relative',
  },
  scanCorners: {
    flex: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#1976d2',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scannerActions: {
    gap: 12,
    paddingHorizontal: 20,
  },
  scanAgainButton: {
    elevation: 2,
    backgroundColor: '#4caf50',
  },
  scanAgainText: {
    color: 'white',
    fontWeight: '600',
  },
  manualButton: {
    elevation: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  backScanButton: {
    alignSelf: 'center',
  },
});