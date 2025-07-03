import * as Optics from "optics-ts"
import type { Transaction as ProseMirrorTransaction } from "prosemirror-state"

import type { AppEffect } from "@app/client/effects"
import type { StoreAction, Change } from "@app/client/store"
import type { AppModel } from "@app/client/app"
import type { CounterAction } from "@app/client/counter/counterController"
import type { QuoterAction } from "@app/client/quoter/quoterController"

export const EditorActionTags = {
    UpdateState: ":editors/UpdateState",
} as const

export type AppAction =
    QuoterAction
    | CounterAction
    | EditorAction
    | WidgetAction<any, any, any, AppEffect>

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
