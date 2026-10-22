// @sr/content: cards, tokens, enemies, bosses and campaign tables as data, validated with zod.
import { z } from 'zod';

export const CardIdSchema = z.string().regex(/^(AUR|NEX|WYL|UMB|NEU|TOK|SIG)-[A-Z0-9]+$/);
export type CardId = z.infer<typeof CardIdSchema>;
