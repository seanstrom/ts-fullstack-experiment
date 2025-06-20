import { create as mutate } from "mutative"
import { Flex, Theme } from "@radix-ui/themes"

import { ProseMirrorEditor, initEditor, updateEditor, type EditorModel } from "./exampleEditor"
import { CounterWidget, updateCounter, type CounterModel, type WidgetAction } from "./counter"
import { RandomQuote, updateQuoter, type QuoterModel } from "./quoter"
import type { Change, Store, AppEffect } from "./store"

import { type ViewAction, type CounterAction, type QuoterAction, type EditorAction, WidgetActionTags } from "./actions"
import { memo } from "react"
export { type ViewAction } from "./actions"

//---
//--- Models
//---

export type ViewModel = {
    counter: CounterModel
    quoter: QuoterModel
    editor: EditorModel
    widgets: Record<string, any>
}

//---
//--- Update
//---

function isQuoterAction(action: ViewAction): action is QuoterAction {
    return action.type.includes(":quoter/")
}

function isCounterAction(action: ViewAction): action is CounterAction {
    return action.type.includes(":counter/")
}

function isEditorAction(action: ViewAction): action is EditorAction {
    return action.type.includes(":editors/")
}

function isWidgetAction(action: ViewAction): action is WidgetAction<ViewModel, any, ViewAction, AppEffect> {
    return action.type.includes(":widgets/")
}

export function updateApp(model: ViewModel, action: ViewAction): Change<ViewModel, AppEffect> {
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

import * as Optics from "optics-ts"

//---
//--- Views
//---

function AppLayout(props: React.PropsWithChildren) {
    return <>
        <Theme>
            <Flex direction="column" justify="center" className="flex-1">
                <Flex direction="row" align="center" p="96px" gap="30px">
                    {props.children}
                </Flex>
            </Flex>
        </Theme>
    </>
}

const RandomQuoteMemo = memo(RandomQuote)
const ProseMirrorEditorMemo = memo(ProseMirrorEditor)
const CounterWidgetMemo = memo(CounterWidget)

const counterLens = Optics.optic<ViewModel>().prop("counter")

function App({ store }: { store: Store<ViewModel, ViewAction> }) {
    const quoterState = store((state) => state.quoter)
    const editorState = store((state) => state.editor)
    const dispatch = store(state => state.dispatch)
    return <>
        <AppLayout>
            <Flex
                flexGrow="0"
                flexShrink="1"
                className="flex-row content-center">
                <CounterWidgetMemo store={store} optic={counterLens} />
            </Flex>
            <RandomQuoteMemo model={quoterState} dispatch={dispatch} />
            <Flex flexGrow="2" flexShrink="1">
                <ProseMirrorEditorMemo model={editorState} dispatch={dispatch} />
            </Flex>
        </AppLayout>
    </>
}

//---
//--- Main
//---

export function renderApp(store: Store<ViewModel, ViewAction>) {
    return <App store={store} />
}

export function initApp(): Change<ViewModel, AppEffect> {
    return {
        model: {
            counter: { count: 0 },
            quoter: {},
            editor: initEditor("# Header 1"),
            widgets: {
                "counter": { count: 0 }
            },
        },
    }
}
