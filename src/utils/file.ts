import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export async function pickAndStoreFile(): Promise<string | null> {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',           // PDF
        'image/*',                  // Toutes les images (PNG, JPG, etc.)
        'text/plain',               // Fichiers texte
        'application/msword',       // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      ],
      copyToCacheDirectory: true
    });

    if (res.canceled) return null;

    const asset = res.assets[0];

    // Vérifier la taille du fichier (limite à 10MB)
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux (max 10MB)');
    }

    // Utiliser le répertoire de documents avec un nom unique
    const fileExtension = asset.name.split('.').pop() || 'file';
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const docDir = (FileSystem as any).documentDirectory;
    const dest = `${docDir}${filename}`;

    // Copier le fichier avec l'API legacy pour éviter les warnings
    const { copyAsync } = await import('expo-file-system/legacy');
    await copyAsync({ from: asset.uri, to: dest });

    console.log(`📁 Fichier sauvegardé: ${asset.name} (${asset.size} bytes)`);
    return dest;
  } catch (error) {
    console.error('❌ Erreur lors de l\'import de fichier:', error);
    throw error;
  }
}

// Fonction pour obtenir le type de fichier à partir de l'URI
export function getFileType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return 'PDF';
    case 'jpg': case 'jpeg': return 'Image JPEG';
    case 'png': return 'Image PNG';
    case 'txt': return 'Texte';
    case 'doc': return 'Document Word';
    case 'docx': return 'Document Word';
    default: return 'Fichier';
  }
}
