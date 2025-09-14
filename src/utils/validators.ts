import { z } from 'zod';

export const TicketInput = z.object({
  code: z.string().min(3),
  qrPayload: z.string().min(1),
  cinemaId: z.string().uuid(),
  sourceFileUri: z.string().min(1),
  expiresAt: z.date(),
  notes: z.string().optional().nullable(),
});

export type TicketInput = z.infer<typeof TicketInput>;
