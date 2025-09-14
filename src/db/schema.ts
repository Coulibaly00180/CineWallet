import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createId } from '@/utils/id';

export const cinemas = sqliteTable('cinemas', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  website: text('website'),
  logoUri: text('logo_uri'),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  qrFormat: text('qr_format'),      // ex: TEXT | URL | CODEWEB=...
  city: text('city'),
  country: text('country'),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date())
});

export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey().$defaultFn(createId),
  code: text('code').notNull().unique(),             // "5CE15A"
  qrPayload: text('qr_payload').notNull().unique(),  // contenu brut du QR
  cinemaId: text('cinema_id').notNull().references(() => cinemas.id),
  sourceFileUri: text('source_file_uri').notNull(),  // chemin local du PDF
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['PENDING', 'USED'] }).notNull().$default(() => 'PENDING'),
  usedAt: integer('used_at', { mode: 'timestamp_ms' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date())
});

// Index utiles
export const ticketsCodeIdx = sql`CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code);`;
export const ticketsStatusIdx = sql`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);`;
export const ticketsExpIdx = sql`CREATE INDEX IF NOT EXISTS idx_tickets_expires ON tickets(expires_at);`;
