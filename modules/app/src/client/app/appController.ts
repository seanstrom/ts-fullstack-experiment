import * as Optics from "optics-ts"
import { create as mutate } from "mutative"

import { initEditor, updateEditor, type EditorModel } from "@app/client/exampleEditor/exampleEditorController"
import { initCounter, updateCounter, type CounterModel } from "@app/client/counter/counterController"
import { updateQuoter, type QuoterModel } from "@app/client/quoter/quoterController"
import type { AppEffect, RpcEffect } from "@app/client/app/appEffects"
import type { Change } from "@app/client/store"

import {
    FileActionTags,
    isCounterAction,
    isEditorAction,
    isFileAction,
    isQuoterAction,
    isWidgetAction,
    WidgetActionTags,
    type AppAction,
} from "./appActions"

export type AppModel = {
    counter: CounterModel
    quoter: QuoterModel
    editor: EditorModel
    widgets: { counters: Record<string, CounterModel> }
    files: Record<string, string>
}

const fileContentEffect: RpcEffect = {
    type: ":effects/rpc",
    command: {
        type: "fetchFileContent",
        procedure: "query",
        input: {
            fileId: "Test.md"
        },
    }
}

export function initApp(): Change<AppModel, AppEffect> {
    return {
        model: {
            files: {},
            counter: initCounter().model,
            quoter: {},
            editor: initEditor("# Header 1").model,
            widgets: {
                counters: {}
            },
        },
        effect: fileContentEffect
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
    else if (isFileAction(action)) {
        switch (action.type) {
            case FileActionTags.GotFileContent: {
                return {
                    model: mutate(model, draft => {
                        draft.files[action.fileId] = action.fileContent
                    })
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
