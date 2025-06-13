import { type Quote } from "../data"

export const CounterActionTags = {
    Decrement: ":counter/decrement",
    Increment: ":counter/increment",
} as const

export const QuoterActionTags = {
    GetRandomQuote: ":quoter/GetRandomQuote",
    GotRandomQuote: ":quoter/GotRandomQuote",
} as const

export const ViewActionTags = {
    Counter: CounterActionTags,
    Qouter: QuoterActionTags,
} as const

export interface Increment {
    type: typeof CounterActionTags.Increment
}

export interface Decrement {
    type: typeof CounterActionTags.Decrement
}

export interface GetRandomQuote {
    type: typeof QuoterActionTags.GetRandomQuote
}

export interface GotRandomQuote {
    type: typeof QuoterActionTags.GotRandomQuote
    quote: Quote
}

export type QuoterAction = GetRandomQuote | GotRandomQuote

export type CounterAction = Increment | Decrement

export type ViewAction = QuoterAction | CounterAction
