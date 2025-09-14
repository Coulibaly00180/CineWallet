// Utilitaire pour gérer le chargement du BarCodeScanner
let BarCodeScanner: any = null;
let isLoading = false;
let loadError: string | null = null;

export const initBarCodeScanner = async () => {
  if (isLoading) return null;
  if (BarCodeScanner) return BarCodeScanner;

  isLoading = true;
  try {
    console.log('🔄 Chargement du module BarCodeScanner...');
    const module = await import('expo-barcode-scanner');
    BarCodeScanner = module.BarCodeScanner;
    console.log('✅ BarCodeScanner chargé avec succès');
    loadError = null;
    return BarCodeScanner;
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Erreur inconnue';
    console.warn('❌ Impossible de charger BarCodeScanner:', loadError);
    return null;
  } finally {
    isLoading = false;
  }
};

export const getBarCodeScanner = () => BarCodeScanner;
export const getLoadError = () => loadError;
export const isBarCodeScannerLoading = () => isLoading;