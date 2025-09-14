# CineWallet

Gestion simple des billets de cinéma achetés via le CSE (import de PDF, scan QR, suivi utilisé / non utilisé, date d'expiration).

---

## ✨ Fonctionnalités (MVP)

* Importer un **PDF** de billet (stockage local en sandbox Expo)
* **Scanner** le QR code (expo-camera / expo-barcode-scanner)
* Enregistrer le **code web** et le **payload** du QR
* Suivre le **statut** du billet : `PENDING` / `USED`
* Voir la **date d'expiration** et marquer comme **utilisé**
* Base **SQLite** locale via **Drizzle ORM** (migrations)

---

## 🧰 Stack technique

* **React Native** via **Expo** (TypeScript)
* **React Navigation** (stack)
* **react-native-paper** (UI)
* **Zustand** (état léger)
* **Drizzle ORM** + **expo-sqlite** (base locale)
* **zod**, **date-fns**
* Expo : **expo-camera**, **expo-document-picker**, **expo-file-system**

---

## ✅ Prérequis

* Node.js **≥ 18**
* Windows/macOS/Linux
* (Optionnel) Android Studio pour un émulateur **ou** smartphone avec **Expo Go**

---

## 🚀 Démarrage rapide

### 1) Cloner / Créer le dossier

Le dossier **CineWallet/** existe déjà.

```powershell
cd D:\github\CineWallet
```

### 2) Installer les dépendances

```bash
npm install
```

> Si tu vois des paquets `react-native-web`/`react-dom` ajoutés par erreur, supprime-les du `package.json`, fais `npm install` puis redémarre.

### 3) Lancer l'application

```bash
npx expo start -c
```

* **Android** : appuie `a` (émulateur) ou scanne le QR avec **Expo Go**
* **iOS** : scanne le QR avec **Expo Go** (ou `i` sur macOS avec Xcode)

Les migrations SQLite s'appliquent automatiquement au premier démarrage.

---

## 📁 Arborescence

```
CineWallet/
  CLAUDE.md
  package.json
  tsconfig.json
  drizzle.config.ts
  src/
    App.tsx
    navigation/
      index.tsx
    screens/
      HomeScreen.tsx
      AddTicketScreen.tsx
      ScanScreen.tsx
    components/
      TicketCard.tsx
    db/
      client.ts
      schema.ts
      migrations/
        0000_pink_betty_ross.sql
        index.ts
        meta/_journal.json
    state/
      useTickets.ts
    utils/
      validators.ts
      file.ts
      id.ts
    theme/
      paperTheme.ts
    types/
      navigation.ts
```

---

## 🗄️ Modèle de données

### `tickets`

* `id` (uuid, PK)
* `code` (string, unique) – ex : `5CE15A`
* `qrPayload` (string, unique) – contenu brut du QR
* `cinemaId` (fk → `cinemas.id`)
* `sourceFileUri` (string) – chemin local du PDF
* `expiresAt` (date)
* `status` (`PENDING` | `USED`)
* `usedAt` (date | null)
* `notes` (string | null)
* `createdAt`, `updatedAt` (dates)

### `cinemas`

* `id` (uuid, PK)
* `name`, `slug` (unique)
* `website`, `logoUri`
* `primaryColor`, `secondaryColor`
* `qrFormat` (notes sur le format du QR, ex : `TEXT|URL|CODEWEB=...`)
* `city`, `country`, `phone`, `notes`
* `createdAt`, `updatedAt`

Indices utiles : `tickets(code)`, `tickets(status)`, `tickets(expiresAt)`

---

## 🔧 Scripts npm

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "drizzle:generate": "drizzle-kit generate"
  }
}
```

> **Ne pas utiliser** `drizzle:push` avec Expo/SQLite (c'est pour DB distante et demande une URL).

---

## ⚙️ Config Drizzle

`drizzle.config.ts` :

```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  strict: true,
});
```

Client DB : `src/db/client.ts`

```ts
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
export const sqlite = SQLite.openDatabaseSync('cinewallet.db');
export const db = drizzle(sqlite);
```

---

## 🧪 Flux de test

1. **Home → Ajouter**
2. Saisir `code`, `qrPayload`, `cinemaId`, `expiresAt` (YYYY-MM-DD)
3. **Importer PDF** → copie locale
4. **Enregistrer** → le billet apparaît dans la liste avec validation des champs
5. **Marquer utilisé** → statut passe à `USED`
6. **Scanner un QR** → renvoie vers Ajouter avec `qrPayload` pré-rempli

### Fonctionnalités de validation

* **Champs requis** : Code, QR payload, ID cinéma, date d'expiration, fichier PDF
* **Validation de format** : Date valide, code minimum 3 caractères
* **Gestion d'erreurs** : Messages d'erreur clairs, gestion des doublons
* **UX améliorée** : États de loading, scanner QR avec interface guidée

---

## 🔧 Nouvelles migrations

Pour ajouter de nouvelles migrations :

1. Modifie `src/db/schema.ts`
2. Lance `npm run drizzle:generate`
3. Copie le contenu du nouveau fichier `.sql` généré
4. Ajoute-le dans `src/db/migrations/index.ts` :

```ts
export default {
  journal,
  migrations: {
    '0000_pink_betty_ross': m0000,
    '0001_nouveau_nom': m0001, // ← Ajouter ici
  }
};
```

---

## 🧭 Alias & TS

`tsconfig.json` (extrait) :

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

> Utiliser `@/` pour référencer `src/`.

---

## 🩹 Dépannage

* **Expo réclame `react-native-web` / `react-dom`**

  * Tu as lancé `expo start --web` par erreur. Supprime ces deps du `package.json`, `npm install`, puis `npx expo start -c`.
* **`drizzle:push` demande une URL**

  * Normal, ne pas l'utiliser en Expo/SQLite.
* **Erreurs TypeScript**

  * Lance `npx tsc --noEmit` pour vérifier les types.
* **Aucun device Android**

  * Utilise **Expo Go** (scanner QR) ou lance un AVD via Android Studio puis touche `a`.

---

## 🗺️ Roadmap

* Filtres : Non utilisés / Utilisés / Expirés
* Sélecteur de cinéma (logo, couleurs)
* Notifications locales avant expiration
* Import/Export JSON (sauvegarde/restauration)
* Parsing automatique du **CODEWEB** depuis le texte des PDF
* Écran de détail des billets

---

## 📄 Licence

Projet perso