import { Grommet, Box, grommet, type BoxExtendedProps } from "grommet"
import { create as mutate } from "mutative"

import { ProseMirrorEditor, initEditor, updateEditor, type EditorModel } from "./exampleEditor"
import { Counter, updateCounter, type CounterModel } from "./counter"
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
    }
    else {
        return { model: model }
    }
}

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

const CounterMemo = memo(Counter)
const RandomQuoteMemo = memo(RandomQuote)

function App({ store }: { store: Store<ViewModel, ViewAction> }) {
    const state = store((state) => state)
    return <>
        <AppLayout>
            <Box flex={{ grow: 0, shrink: 1 }}>
                <CounterMemo model={state.counter} dispatch={state.dispatch} />
            </Box>
            <RandomQuoteMemo model={state.quoter} dispatch={state.dispatch} />
            <Box style={{flex: "2 1"}}>
                <ProseMirrorEditor model={state.editor} dispatch={state.dispatch} />
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
        },
    }
}
