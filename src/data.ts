import { z } from "zod/v4";

export type Quote = z.output<typeof QuoteSchema>

export const QuoteSchema = z.object({
    quote: z.string(),
    source: z.string(),
    author: z.string(),
    year: z.number(),
})
