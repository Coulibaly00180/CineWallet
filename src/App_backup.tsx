import { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { View, Text } from 'react-native';
import RootNavigation from '@/navigation';
import { paperTheme } from '@/theme/paperTheme';

import { db } from '@/db/client';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/db/migrations';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('🔄 Starting migrations...');
        await migrate(db, migrations);
        console.log('✅ Migrations completed');
        setIsReady(true);
      } catch (e) {
        console.error('❌ Migration error:', e);
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  if (error) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Erreur de démarrage
          </Text>
          <Text style={{ textAlign: 'center', color: 'red' }}>
            {error}
          </Text>
        </View>
      </PaperProvider>
    );
  }

  if (!isReady) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Initialisation...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <RootNavigation />
    </PaperProvider>
  );
}