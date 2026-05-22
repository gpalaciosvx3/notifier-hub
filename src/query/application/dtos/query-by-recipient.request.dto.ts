import { z } from 'zod';

export const QueryByRecipientRawSchema = z.object({
  to: z.string().min(1),
  pageToken: z.string().optional(),
});

export type QueryByRecipientDto = z.infer<typeof QueryByRecipientRawSchema>;
