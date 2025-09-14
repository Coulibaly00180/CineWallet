import * as DocumentPicker from 'expo-document-picker';
import { documentDirectory, StorageAccessFramework, deleteAsync } from 'expo-file-system';

export async function pickAndStorePdf(): Promise<string | null> {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true
    });

    if (res.canceled) return null;

    const asset = res.assets[0];

    // Utiliser le répertoire de documents avec un nom unique
    const filename = `${Date.now()}_${asset.name}`;
    const dest = `${documentDirectory}${filename}`;

    // Copier le fichier (l'API copyAsync est toujours valide)
    const { copyAsync } = await import('expo-file-system/legacy');
    await copyAsync({ from: asset.uri, to: dest });

    return dest;
  } catch (error) {
    console.error('Erreur lors du pick PDF:', error);
    return null;
  }
}
