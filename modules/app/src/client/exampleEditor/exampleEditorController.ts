import { EditorState, type Transaction as ProseMirrorTransaction } from "prosemirror-state";
import {
    schema,
    defaultMarkdownParser,
    defaultMarkdownSerializer
} from "prosemirror-markdown"

import { editorPlugins } from "@app/client/exampleEditor/plugins"

import type { Change } from "@app/client/store"
import type { AppEffect } from "@app/client/app/appEffects"


export const EditorActionTags = {
    UpdateState: ":editors/UpdateState",
} as const

export type EditorTransaction = ProseMirrorTransaction

export interface EditorUpdateState {
    type: typeof EditorActionTags.UpdateState,
    editorId: string
    transaction: EditorTransaction
}

export type EditorAction = EditorUpdateState

export type EditorModel = {
    state: EditorState
}

export function initEditor(markdownContent: string): Change<EditorModel, AppEffect> {
    const state = EditorState.create({
        schema,
        doc: defaultMarkdownParser.parse(markdownContent),
        plugins: editorPlugins
    })

    return { model: { state } }
}

export function updateEditor(model: EditorModel, action: EditorAction): Change<EditorModel, AppEffect> {
    switch (action.type) {
        case EditorActionTags.UpdateState: {
            const newState = model.state.apply(action.transaction)
            return {
                model: { state: newState },
            }
        }
    }
}
