import * as Optics from "optics-ts"
import { create as mutate } from "mutative"

import { initEditor, updateEditor, type EditorModel } from "../exampleEditor"
import { updateCounter, type CounterModel } from "@app/client/counter/counterController"
import { updateQuoter, type QuoterModel } from "../quoter"
import type { AppEffect } from "../effects"
import type { Change } from "../store"

import {
    isCounterAction,
    isEditorAction,
    isQuoterAction,
    isWidgetAction,
    WidgetActionTags,
    type AppAction,
} from "../actions"

export type AppModel = {
    counter: CounterModel
    quoter: QuoterModel
    editor: EditorModel
    widgets: { counters: Record<string, CounterModel> }
}

export function initApp(): Change<AppModel, AppEffect> {
    return {
        model: {
            counter: { count: 0 },
            quoter: {},
            editor: initEditor("# Header 1"),
            widgets: {
                counters: {}
            },
        },
    }
}

export function updateApp(model: AppModel, action: AppAction): Change<AppModel, AppEffect> {
    if (isQuoterAction(action)) {
        const change = updateQuoter(model.quoter, action)
        return {
            model: mutate(model, draft => { draft.quoter = change.model }),
            effect: change.effect
        }
    } else if (isCounterAction(action)) {
        const change = updateCounter(model.counter, action)
        return {
            model: mutate(model, draft => { draft.counter = change.model }),
            effect: change.effect
        }
    } else if (isEditorAction(action)) {
        const change = updateEditor(model.editor, action)
        return {
            model: { ...model, editor: change.model },
            effect: change.effect
        }
    } else if (isWidgetAction(action)) {
        switch (action.type) {
            case WidgetActionTags.Update: {
                const modelWithChange = Optics.set(action.widgetOptic)(action.widgetChange.model)(model)
                return {
                    model: modelWithChange,
                    effect: action.widgetChange.effect,
                }
            }
        }
    }
    else {
        return { model: model }
    }
}

export const update = updateApp
export const init = initApp
