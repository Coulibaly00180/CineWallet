# CineWallet

Gestion simple des billets de cinéma achetés via le CSE (import de PDF, scan QR, suivi utilisé / non utilisé, date d'expiration).

---

## Fonctionnalités (MVP)

* Importer un **PDF** de billet (stockage local en sandbox Expo)
* **Scanner** le QR code (expo-camera)
* Enregistrer le **code web** et le **payload** du QR
* Suivre le **statut** du billet : `PENDING` / `USED`
* Voir la **date d'expiration** et marquer comme **utilisé**
* Base **SQLite** locale via **Drizzle ORM** (migrations)

---

## Stack technique

* **React Native** via **Expo** (TypeScript)
* **React Navigation** (stack)
* **react-native-paper** (UI, sélecteur de date personnalisé)
* **Zustand** (état léger)
* **Drizzle ORM** + **expo-sqlite** (base locale)
* **zod** (validation)
* Expo : **expo-camera**, **expo-document-picker**, **expo-file-system**

---

## Prérequis

* Node.js **≥ 18**
* Windows/macOS/Linux
* **Java 17** (pour compilation native Android)
* **Android Studio** + SDK Android (pour compilation native)
* (Optionnel) Émulateur Android ou smartphone avec débogage USB

---

## Démarrage rapide

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

### 3) Configurer le SDK Android (compilation native)

1. **Installer Android Studio** : https://developer.android.com/studio
2. **Installer les SDK** requis (API 34+, Build-Tools, Platform-Tools)
3. **Configurer les variables d'environnement** :
   ```bash
   ANDROID_HOME=C:\Users\[TonNom]\AppData\Local\Android\Sdk
   ```
4. **Générer les dossiers natifs** :
   ```bash
   npx expo prebuild
   ```

### 4) Lancer l'application

**Mode développement Expo :**
```bash
npx expo start -c
```
* **Android** : appuie `a` (émulateur) ou scanne le QR avec **Expo Go**
* **iOS** : scanne le QR avec **Expo Go** (ou `i` sur macOS avec Xcode)

**Mode compilation native :**
```bash
npx expo run:android
```
Nécessite un émulateur Android lancé ou un appareil connecté en USB.

Les migrations SQLite s'appliquent automatiquement au premier démarrage.

---

## Arborescence

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

## Modèle de données

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

## Scripts npm

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

**Compilation native :**
```bash
# Build et lancer sur Android (avec émulateur/appareil)
npx expo run:android

# Build et lancer sur iOS (macOS uniquement)
npx expo run:ios

# Build sans lancer (Android)
cd android && ./gradlew assembleDebug

# Régénérer les ressources natives (après changement d'assets)
npx expo prebuild --clean
```

**Génération d'APK :**
```bash
# Préparer l'environnement et générer l'APK
npx expo prebuild --clean
npx expo run:android

# L'APK sera généré à :
# android/app/build/outputs/apk/debug/app-debug.apk

# Installation manuelle sur appareil
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

> **Ne pas utiliser** `drizzle:push` avec Expo/SQLite (c'est pour DB distante et demande une URL).

---

## Gestion des Assets

### Configuration des ressources

L'application utilise des assets optimisés pour assurer un bon affichage sur tous les appareils :

**Exigences pour chaque asset :**
- `icon.png`: 512x512px, <100KB (icône principale de l'app)
- `adaptive-icon.png`: 432x432px, <50KB (icône adaptative Android)
- `splash-icon.png`: 1024x1024px, <200KB (écran de démarrage)
- `favicon.png`: 64x64px, <10KB (favicon web)

### Important : Régénération des ressources natives

**Après toute modification d'assets dans `/assets`**, vous DEVEZ exécuter :

```bash
npx expo prebuild --clean
```

**Pourquoi cette étape est cruciale :**
- Régénère les ressources Android/iOS natives avec vos nouveaux assets
- Met à jour les icônes dans `android/app/src/main/res/mipmap-*/`
- Sans cette commande, les anciennes ressources mises en cache seront utilisées
- **Symptômes sans cette commande** : icônes manquantes, assets non mis à jour

**Assets non optimisés :**
- Les fichiers >1MB peuvent empêcher le chargement correct
- Utilisez des outils comme [TinyPNG](https://tinypng.com/) ou [Squoosh](https://squoosh.app/) pour optimiser

---

## Config Drizzle

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

## Flux de test

1. **Home → Ajouter**
2. Saisir `code`, `qrPayload`, `cinemaId`, `expiresAt` (YYYY-MM-DD)
3. **Importer PDF** → copie locale
4. **Enregistrer** → le billet apparaît dans la liste avec validation des champs
5. **Marquer utilisé** → statut passe à `USED`
6. **Scanner un QR** → renvoie vers Ajouter avec `qrPayload` pré-rempli

### Fonctionnalités de validation

* **Champs requis** : Code, QR payload, ID cinéma, date d'expiration, fichier PDF
* **Validation de format** : Date française (JJ/MM/AAAA), code minimum 3 caractères
* **Gestion d'erreurs** : Messages d'erreur clairs, gestion des doublons
* **UX améliorée** : États de loading, scanner QR avec interface guidée, sélecteur de date modal intuitif
* **Analyse OCR** : Extraction automatique depuis photos avec validation intelligente

### Interface utilisateur

* **Sélecteur de date français** : Modal personnalisé avec boutons +/- pour jour/mois/année
* **Format de date localisé** : Affichage et saisie en format français (JJ/MM/AAAA)
* **Permissions caméra** : Gestion intelligente des autorisations avec messages explicatifs
* **Import de fichiers** : Support PDF, images, documents texte (max 10MB)

---

## Récentes améliorations (v1.4)

### Problèmes résolus (v1.3)
* **Assets/Icônes** : Résolution des problèmes d'affichage d'icônes sur smartphone
* **Date picker natif** : Remplacement du modal personnalisé par `@react-native-community/datetimepicker`
* **Persistance de formulaire** : Correction des champs qui se vidaient lors d'actions (scan QR, import fichier)
* **Optimisation assets** : Compression automatique et guidelines de taille
* **Système de fichiers** : Migration vers `expo-file-system/legacy` pour éviter les warnings

### Nouvelles fonctionnalités (v1.4)
* **Filtres de billets** : Système de filtrage avec SegmentedButtons (Tous, Valides, Utilisés, Expirés)
* **Compteurs dynamiques** : Affichage en temps réel du nombre de billets par catégorie
* **Détection d'expiration** : Identification automatique des billets expirés avec highlighting
* **🎬 Sélecteur de cinéma avancé** : Interface visuelle avec avatars colorés et support logos (prêt pour v1.5)
* **Gestion complète des cinémas** : Écran d'ajout avec couleurs, validation, et 8 cinémas pré-configurés
* **Notifications intelligentes** : Système automatique d'alertes avant expiration (3j/1j/2h)
* **Interface cohérente** : Composants réutilisables et design system unifié
* **Architecture modulaire** : Hooks personnalisés et stores optimisés pour les notifications

### **Version actuelle (v1.7)**
* **Application complète et production-ready** : Toutes les fonctionnalités de base implémentées
  - **Génération d'APK Android** : Compilation native fonctionnelle
  - **Backup/Restore complet** : Import/export JSON avec gestion des conflits
  - **Édition des cinémas** : Modification de tous les paramètres existants
  - **Calendrier visuel** : Sélecteur de date amélioré avec navigation intuitive
  - **Vue détaillée des billets** : Écran complet avec actions et métadonnées
  - **Analyse OCR traditionnelle** : Extraction automatique depuis images/PDF
  - **Gestion complète des fichiers** : Support multi-format avec validation
  - **Interface Material Design** : UI cohérente et responsive
  - **Base de données robuste** : SQLite avec migrations automatiques

### **Version précédente (v1.5)**
* **Upload de logos de cinémas** : Remplacement des avatars par de vrais logos d'images
  - Support des formats PNG, JPG, WebP
  - Validation automatique (taille max 2MB)
  - Stockage local optimisé avec nettoyage automatique
  - Interface de sélection d'image native avec prévisualisation
  - 8 cinémas pré-configurés avec logos officiels Wikipédia

### Cinémas pré-configurés
* **UGC Ciné Cité** (Rouge) - Chaîne nationale
* **Pathé** (Noir) - Réseau historique français
* **Gaumont** (Orange) - Plus ancien studio encore actif
* **CGR Cinemas** (Bleu) - Groupe indépendant français
* **Kinepolis** (Violet) - Chaîne belge en France
* **MK2** (Orange) - Cinémas d'auteur parisiens
* **Mégarama** (Vert) - Multiplexes modernes
* **Cinémas Indépendants Parisiens** (Violet) - Réseau parisien

---

## Analyse OCR de tickets

### Architecture du système d'analyse

L'application intègre un système d'analyse OCR traditionnel pour extraire automatiquement les données des tickets de cinéma depuis des images en utilisant des patterns regex spécialisés.

**Composants principaux :**
- `src/utils/ticketAnalyzer.ts` - Moteur d'analyse principal
- `src/components/TicketAnalyzerModal.tsx` - Interface utilisateur d'analyse
- Intégration dans `AddTicketScreen` avec bouton "Analyser avec OCR"

### Fonctionnalités d'extraction

**Données extraites automatiquement :**
- **Code de billet** : Codes alphanumériques (ex: 5CE15A, P8K9L2)
- **Date d'expiration** : Formats français et internationaux
- **Nom du cinéma** : Reconnaissance des chaînes principales (UGC, Pathé, Gaumont, etc.)
- **Contenu QR** : URLs et codes texte
- **Prix** : Montants en euros
- **Heure de séance** : Horaires au format français
- **Informations de place** : Salle et siège si disponibles

**Formats supportés :**
- Images : JPEG, PNG (max 10MB)
- PDF : Support basique (en développement)

### Système de validation

**Score de confiance :**
- Calcul automatique basé sur la quantité et qualité des données extraites
- Seuil minimum de 30% pour validation
- Feedback visuel avec code couleur (vert >70%, orange >40%, rouge <40%)

**Validation des données :**
- Vérification des formats (dates, codes, prix)
- Détection des erreurs et suggestions de correction
- Possibilité d'ajustement manuel avant enregistrement

### Interface utilisateur

**Modal d'analyse guidée :**
1. Sélection d'image depuis la galerie
2. Analyse en temps réel avec barre de progression
3. Prévisualisation des résultats avec score de confiance
4. Validation et correction des données extraites
5. Remplissage automatique du formulaire principal

**Fonctionnalités avancées :**
- Mode debug pour développeurs (texte brut OCR)
- Gestion des erreurs avec messages explicatifs
- Optimisation pour différents types de tickets

### Évolutions prévues vers l'IA générative

**Prochaine étape majeure - OCR avec IA mobile :**
- Remplacement du système actuel par des modèles multimodaux (BakLLaVA, LLaVA)
- Inférence locale sur appareil mobile avec MLC LLM ou similaire
- Compréhension contextuelle avancée des tickets
- Apprentissage adaptatif selon les retours utilisateur
- Support natif des formats complexes (PDF scannés, images floues)
- Reconnaissance intelligente des nouveaux formats de cinémas

---

## Nouvelles migrations

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

## Alias & TS

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

## Dépannage

* **Expo réclame `react-native-web` / `react-dom`**

  * Tu as lancé `expo start --web` par erreur. Supprime ces deps du `package.json`, `npm install`, puis `npx expo start -c`.

* **`drizzle:push` demande une URL**

  * Normal, ne pas l'utiliser en Expo/SQLite.

* **Erreurs TypeScript**

  * Lance `npx tsc --noEmit` pour vérifier les types.

* **Aucun device Android**

  * Utilise **Expo Go** (scanner QR) ou lance un AVD via Android Studio puis touche `a`.

* **Compilation native : "SDK location not found"**

  * Crée le fichier `android/local.properties` avec :
    ```
    sdk.dir=C:\\Users\\[TonNom]\\AppData\\Local\\Android\\Sdk
    ```
  * Ou configure la variable `ANDROID_HOME` dans les variables d'environnement système.

* **Build timeout ou trop lent**

  * Première compilation native : 5-15 minutes (normal)
  * Compilations suivantes : 1-3 minutes
  * Utilise `--no-build-cache` si problème de cache

* **Erreurs de dépendances natives ou builds**

  * **Première solution** : Réparer les dépendances Expo
    ```bash
    npx expo install --fix
    npx expo prebuild --clean
    ```

  * **Ces dépendances ont été remplacées par des solutions plus stables :**
    - `expo-barcode-scanner` → `expo-camera` (meilleure compatibilité native)
    - `@react-native-community/datetimepicker` → Modal personnalisé React Native Paper

  * **Si erreurs de résolution :** `npm install` puis `npx expo run:android`

* **Avertissements de dépréciation expo-file-system**

  * L'API `copyAsync` est utilisée dans sa version stable
  * Les warnings de dépréciation n'affectent pas le fonctionnement
  * Le système de fichiers fonctionne correctement en builds natifs

* **Icônes/Assets ne s'affichent pas**

  * **Cause** : Assets trop volumineux (>1MB) ou ressources natives non régénérées
  * **Solution** :
    1. Optimisez vos assets (voir section "Gestion des Assets")
    2. Exécutez `npx expo prebuild --clean`
    3. Rebuilder avec `npx expo run:android`
  * **Vérification** : Consultez `android/app/src/main/res/mipmap-*/` pour voir si les ressources sont récentes

---

## 🗺️ Roadmap

### **Fonctionnalités terminées**
* **Filtres : Non utilisés / Utilisés / Expirés** - Implémenté avec SegmentedButtons
* **Sélecteur de cinéma avec logos** - Interface visuelle avec vrais logos
* **Gestion des cinémas** - Écran d'ajout avec couleurs et validation
* **Upload de logos de cinémas** - Sélection depuis galerie, formats PNG/JPG/WebP
* **Cinémas par défaut** - 8 cinémas français avec logos officiels
* **Notifications locales avant expiration** - Système complet (3j/1j/2h avant)
* **Analyse OCR traditionnelle de tickets** - Extraction automatique avec patterns regex

### **Nouvelles fonctionnalités terminées (v1.7)**
* **Import/Export JSON** - Système complet de sauvegarde/restauration des données
  - Export sélectif (billets, cinémas ou tout)
  - Import avec gestion des conflits et validation
  - Interface utilisateur avec statistiques détaillées
  - Compatibilité versions et vérification d'intégrité
* **Édition des cinémas** - Modification complète des cinémas existants
  - Formulaire pré-rempli avec toutes les données actuelles
  - Gestion des logos avec possibilité de changement/suppression
  - Validation des modifications et gestion d'erreurs
* **Sélecteur de date amélioré** - Calendrier visuel interactif
  - Navigation mois/année avec boutons intuitifs
  - Sélections rapides (aujourd'hui, demain, semaine, mois)
  - Contraintes de dates (minimum/maximum)
  - Design Material cohérent avec l'application
* **Écran de détail des billets** - Vue complète des informations
  - Affichage du statut avec codage couleur (valide/utilisé/expiré)
  - Informations complètes du cinéma associé
  - Actions contextuelles (marquer utilisé, partager, supprimer)
  - Métadonnées et historique des modifications
  - Contenu QR sélectionnable pour copie

### **En cours ou à venir**
* **OCR avec IA générative mobile** - Remplacement par des modèles multimodaux (BakLLaVA, LLaVA)
* Mode sombre / thème personnalisable
* Statistiques d'utilisation des billets
* Synchronisation cloud (optionnelle)

---

## 📄 Licence

Projet perso