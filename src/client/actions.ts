import { type Quote } from "../data"

export const ViewActionTags = {
    Decrement: ":counter/decrement",
    Increment: ":counter/increment",
    GetRandomQuote: ":quotes/GetRandomQuote",
    GotRandomQuote: ":quotes/GotRandomQuote",
} as const

export interface Increment {
    type: typeof ViewActionTags.Increment
}

export interface Decrement {
    type: typeof ViewActionTags.Decrement
}

export interface GetRandomQuote {
    type: typeof ViewActionTags.GetRandomQuote
}

export interface GotRandomQuote {
    type: typeof ViewActionTags.GotRandomQuote
    quote: Quote
}

export type ViewAction =
    Increment
    | Decrement
    | GotRandomQuote
    | GetRandomQuote
