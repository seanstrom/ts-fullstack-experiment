import { Grommet, Box, grommet, type BoxExtendedProps } from "grommet"
import { create as mutate } from "mutative"

import { ProseMirrorEditor, initEditor, updateEditor, type EditorModel } from "./exampleEditor"
import { CounterWidget, updateCounter, type CounterModel, type WidgetAction } from "./counter"
import { RandomQuote, updateQuoter, type QuoterModel } from "./quoter"
import type { Change, Store, AppEffect } from "./store"

import { type ViewAction, type CounterAction, type QuoterAction, type EditorAction } from "./actions"
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

function isWidgetAction(action: ViewAction): action is WidgetAction<ViewModel, ViewAction, AppEffect> {
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
        console.log("Counter Action from App", action)
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
            case ":widgets/update": {
                const widgetOptic = Optics.optic<ViewModel>().prop("widgets").prop(action.widgetId)
                const widgetModel = Optics.get(widgetOptic)(model)
                if (widgetModel) {
                    const widgetChange = action.widgetUpdater(widgetModel, action.widgetAction)
                    return {
                        model: Optics.set(widgetOptic)(widgetChange.model)(model),
                        effect: widgetChange.effect,
                    }
                } else {
                    console.warn(`Widget with id ${action.widgetId} not found in widgets`)
                    return { model: model }
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

const outerStyles: BoxExtendedProps = {
    background: "dark-2",
    direction: "column",
    height: "100%",
    justify: "center",
}

const innerStyles: BoxExtendedProps = {
    align: "center",
    direction: "row-responsive",
    gap: "medium",
    justify: "center",
    pad: "xlarge",
}

function AppLayout(props: React.PropsWithChildren) {
    return <>
        <Grommet full={true} theme={grommet}>
            <Box {...outerStyles}>
                <Box {...innerStyles}>
                    {props.children}
                </Box>
            </Box>
        </Grommet>
    </>
}

const RandomQuoteMemo = memo(RandomQuote)
const ProseMirrorEditorMemo = memo(ProseMirrorEditor)
const CounterWidgetMemo = memo(CounterWidget)

function App({ store }: { store: Store<ViewModel, ViewAction> }) {
    const state = store((state) => state)
    return <>
        <AppLayout>
            <Box flex={{ grow: 0, shrink: 1 }}>
                <CounterWidgetMemo store={store} />
            </Box>
            <RandomQuoteMemo model={state.quoter} dispatch={state.dispatch} />
            <Box style={{ flex: "2 1" }}>
                <ProseMirrorEditorMemo model={state.editor} dispatch={state.dispatch} />
            </Box>
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
