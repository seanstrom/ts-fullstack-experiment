import { type Quote } from "../data"

import type { Transaction as ProseMirrorTransaction } from "prosemirror-state"
import type { AppAction, AppEffect, Change } from "./store"
import type { WidgetAction } from "./counter"
import type { ViewModel } from "./app"

export const CounterActionTags = {
    Decrement: ":counter/decrement",
    Increment: ":counter/increment",
} as const

export const QuoterActionTags = {
    GetRandomQuote: ":quoter/GetRandomQuote",
    GotRandomQuote: ":quoter/GotRandomQuote",
} as const

export const EditorActionTags = {
    UpdateState: ":editors/UpdateState",
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

export type ViewAction = QuoterAction | CounterAction | EditorAction | WidgetAction<any, any, any, AppEffect>

export type EditorTransaction = ProseMirrorTransaction

export interface EditorUpdateState {
    type: typeof EditorActionTags.UpdateState,
    editorId: string
    transaction: EditorTransaction
}

export type EditorAction = EditorUpdateState

export const WidgetActionTags = {
    Update: ":widgets/update",
} as const
