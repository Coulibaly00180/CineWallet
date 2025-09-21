# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Start the development server:
```bash
npm run start
```

Run on specific platforms:
```bash
npm run android
npm run ios
npm run web
```

Build and run native Android APK:
```bash
npx expo run:android
```

Generate database migrations:
```bash
npm run drizzle:generate
```

Regenerate native resources (after asset changes):
```bash
npx expo prebuild --clean
```

Fix dependency issues:
```bash
npx expo install --fix
```

## Architecture Overview

**CineWallet** is a React Native Expo app for managing cinema tickets with QR code scanning capabilities.

### Core Technology Stack
- **React Native** with **Expo** (~54.0.7)
- **TypeScript** with strict mode and path aliases (`@/*` → `src/*`)
- **Drizzle ORM** with SQLite (expo-sqlite) for local data storage
- **React Navigation** (native stack) for app navigation
- **React Native Paper** for Material Design UI components
- **Zustand** for state management
- **Zod** for validation

### Database Architecture
The app uses SQLite with Drizzle ORM and automatic migrations:

**Schema** (`src/db/schema.ts`):
- `cinemas` table: Cinema information (name, branding, QR format, location)
- `tickets` table: Ticket data with QR payload, cinema reference, expiration, status

**Key relationships:**
- Tickets belong to cinemas via `cinemaId` foreign key
- Tickets have status: `PENDING` | `USED`
- All entities use custom ID generation via `@/utils/id`

**Migration system:**
- Migrations auto-run on app start in `App.tsx:14`
- Generate new migrations with `npm run drizzle:generate`
- Migration files stored in `src/db/migrations/`

### Application Architecture

**Navigation Structure** (`src/navigation/index.tsx`):
- Stack-based navigation with comprehensive screen structure
- Main screens: Home, AddTicket, Scan, TicketDetail, EditCinema, Backup, Cinemas
- Nested navigation with proper TypeScript typing

**State Management:**
- **Zustand stores** for tickets (`src/state/useTickets.ts`) and cinemas (`src/state/useCinemas.ts`)
- Ticket store methods: `refresh()`, `add()`, `markUsed()`, `remove()`
- Cinema store methods: `refresh()`, `add()`, `update()`, `remove()`
- Automatic refresh after mutations and proper error handling

**Key Features:**
- QR code scanning via expo-camera
- File picker supporting PDF, images, documents via expo-document-picker
- Image picker for cinema logos via expo-image-picker
- Local storage and file system operations via expo-file-system
- Push notifications via expo-notifications
- Data sharing capabilities via expo-sharing
- OCR analysis with pattern recognition

### File Organization
- `src/screens/` - Screen components (Home, AddTicket, Scan, TicketDetail, EditCinema, Backup, Cinemas)
- `src/components/` - Reusable UI components (TicketCard, CinemaSelector, DatePickerModal, TicketAnalyzerModal)
- `src/db/` - Database schema, client, migrations
- `src/state/` - Zustand stores (tickets, cinemas)
- `src/utils/` - Utilities (ID generation, validation, file operations, OCR, notifications, backup)
- `src/theme/` - React Native Paper theming
- `src/hooks/` - Custom React hooks (notification scheduler)

### Assets Management
The app uses optimized assets for better performance and proper display:

**Asset Requirements:**
- `icon.png`: 512x512px, <100KB (main app icon)
- `adaptive-icon.png`: 432x432px, <50KB (Android adaptive icon)
- `splash-icon.png`: 1024x1024px, <200KB (splash screen)
- `favicon.png`: 64x64px, <10KB (web favicon)

**Important Notes:**
- After modifying assets in `/assets` directory, **always run** `npx expo prebuild --clean`
- This regenerates native Android/iOS resources with new assets
- Without this step, old cached assets will be used
- Large unoptimized assets (>1MB) can prevent proper loading

### Development Notes
- App uses French UI text and comments
- Database timestamps are stored as milliseconds
- Custom ID generation instead of auto-increment
- TypeScript path aliases configured for `@/*` imports
- Strict TypeScript configuration enabled

### Build and Deployment

**APK Generation:**
The app can be compiled to a native Android APK using:
```bash
npx expo prebuild --clean
npx expo run:android
```

**APK Location:**
Generated APK is located at: `android/app/build/outputs/apk/debug/app-debug.apk`

**Installation:**
- Direct installation on connected device with USB debugging
- Manual APK installation via `adb install app-debug.apk`
- Side-loading for distribution and testing

**Build Requirements:**
- Android Studio with SDK 24+ (minSdk), compileSdk 36, targetSdk 36
- Java 17 for Android builds
- NDK 27.1.12297006 for native components
- Kotlin 2.1.20 for modern Android development

### Current Application Status (v1.7)

**Completed Features:**
- Complete ticket management system (add, edit, view, delete)
- Cinema management with logo support and editing
- QR code scanning and analysis
- File import/export (PDF, images, documents)
- OCR-based ticket analysis with pattern recognition
- Local notifications before ticket expiration
- Backup/restore system with JSON export/import
- Visual date picker with calendar interface
- Comprehensive ticket detail view with actions
- Filtering system (valid, used, expired tickets)
- Material Design UI with consistent theming

**Technical Implementation:**
- SQLite database with Drizzle ORM and automatic migrations
- Zustand state management for tickets and cinemas
- React Navigation with TypeScript typing
- expo-camera for QR scanning
- expo-notifications for scheduled alerts
- expo-file-system for local storage
- expo-sharing for data export
- Custom hooks for notification scheduling
- Comprehensive error handling and validation