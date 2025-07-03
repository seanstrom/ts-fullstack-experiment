import * as Optics from "optics-ts"
import type { Transaction as ProseMirrorTransaction } from "prosemirror-state"

import type { Quote } from "../data"
import type { AppEffect } from "./effects"
import type { StoreAction, Change } from "./store"
import type { AppModel } from "./app"
import { CounterActionTags, type CounterAction } from "@app/client/counter/counterController"

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

export interface GetRandomQuote {
    type: typeof QuoterActionTags.GetRandomQuote
}

export interface GotRandomQuote {
    type: typeof QuoterActionTags.GotRandomQuote
    quote: Quote
}

export type QuoterAction = GetRandomQuote | GotRandomQuote

export type AppAction = QuoterAction | CounterAction | EditorAction | WidgetAction<any, any, any, AppEffect>

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

export type AppWidgetAction = WidgetAction<AppModel, any, AppAction, AppEffect>

export interface WidgetUpdate<ViewModel, WidgetModel, WidgetAction extends StoreAction, Effect extends AppEffect> {
    type: typeof WidgetActionTags.Update
    widgetOptic: Optics.Lens<ViewModel, any, WidgetModel>
    widgetAction: WidgetAction
    widgetChange: Change<WidgetModel, Effect>
}

export type WidgetAction<Model, WidgetModel, Action extends StoreAction, Effect extends AppEffect> =
    | WidgetUpdate<Model, WidgetModel, Action, Effect>


export function isQuoterAction(action: AppAction): action is QuoterAction {
    return action.type.includes(":quoter/")
}

export function isCounterAction(action: AppAction): action is CounterAction {
    return action.type.includes(":counter/")
}

export function isEditorAction(action: AppAction): action is EditorAction {
    return action.type.includes(":editors/")
}

export function isWidgetAction(action: AppAction): action is AppWidgetAction {
    return action.type.includes(":widgets/")
}
