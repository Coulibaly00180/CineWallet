import { Camera } from 'react-native-vision-camera';
import { useCameraPermission } from 'react-native-vision-camera';

// Utilitaire pour gérer les permissions caméra avec react-native-vision-camera
let cameraPermission: any = null;
let isLoading = false;
let loadError: string | null = null;

export const initCameraPermissions = async () => {
  if (isLoading) return null;

  isLoading = true;
  try {
    console.log('🔄 Vérification des permissions caméra...');

    const permission = await Camera.requestCameraPermission();
    console.log('📷 Permission caméra:', permission);

    if (permission === 'granted') {
      loadError = null;
      return { status: 'granted' };
    } else {
      loadError = 'Permission caméra refusée';
      return { status: 'denied' };
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Erreur inconnue';
    console.warn('❌ Erreur permission caméra:', loadError);
    return { status: 'denied' };
  } finally {
    isLoading = false;
  }
};

export const getCameraPermission = () => cameraPermission;
export const getLoadError = () => loadError;
export const isCameraLoading = () => isLoading;

// Fonction helper pour utiliser les hooks de permission
export const useCameraPermissions = () => {
  return useCameraPermission();
};