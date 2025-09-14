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

Generate database migrations:
```bash
npm run drizzle:generate
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
- Stack-based navigation with 3 main screens
- Home → AddTicket, Scan screens

**State Management:**
- **Zustand store** at `src/state/useTickets.ts` handles all ticket operations
- Store methods: `refresh()`, `add()`, `markUsed()`
- Automatic refresh after mutations

**Key Features:**
- QR code scanning via expo-barcode-scanner
- PDF file picker via expo-document-picker
- Camera integration via expo-camera
- File system operations via expo-file-system

### File Organization
- `src/screens/` - Screen components (Home, AddTicket, Scan)
- `src/components/` - Reusable UI components (TicketCard)
- `src/db/` - Database schema, client, migrations
- `src/state/` - Zustand stores
- `src/utils/` - Utilities (ID generation, validation, file operations)
- `src/theme/` - React Native Paper theming

### Development Notes
- App uses French UI text and comments
- Database timestamps are stored as milliseconds
- Custom ID generation instead of auto-increment
- TypeScript path aliases configured for `@/*` imports
- Strict TypeScript configuration enabled