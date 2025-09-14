import { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { View, Text } from 'react-native';
import { paperTheme } from '@/theme/paperTheme';
import RootNavigation from '@/navigation';

import { db } from '@/db/client';
import { cinemas, tickets } from '@/db/schema';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('🔄 Creating tables...');

        // Créer les tables directement au lieu d'utiliser les migrations
        await db.run(`CREATE TABLE IF NOT EXISTS cinemas (
          id text PRIMARY KEY NOT NULL,
          name text NOT NULL,
          slug text NOT NULL UNIQUE,
          website text,
          logo_uri text,
          primary_color text,
          secondary_color text,
          qr_format text,
          city text,
          country text,
          phone text,
          notes text,
          created_at integer NOT NULL,
          updated_at integer NOT NULL
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS tickets (
          id text PRIMARY KEY NOT NULL,
          code text NOT NULL UNIQUE,
          qr_payload text NOT NULL UNIQUE,
          cinema_id text NOT NULL,
          source_file_uri text NOT NULL,
          expires_at integer NOT NULL,
          status text NOT NULL DEFAULT 'PENDING',
          used_at integer,
          notes text,
          created_at integer NOT NULL,
          updated_at integer NOT NULL,
          FOREIGN KEY (cinema_id) REFERENCES cinemas(id)
        )`);

        // Créer les index
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tickets_expires ON tickets(expires_at)`);

        console.log('✅ Tables created successfully');
        setIsReady(true);
      } catch (e) {
        console.error('❌ Database setup error:', e);
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
          <Text>Initialisation de la base de données...</Text>
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
