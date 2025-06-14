import { Grommet, Box, grommet } from "grommet"
import { create as mutate } from "mutative"

import { Counter, updateCounter, type CounterModel } from "./counter"
import { RandomQuote, updateQuoter, type QuoterModel } from "./quoter"
import { type Change, type Store, type AppEffect } from "./store"
import { type ViewAction, type CounterAction, type QuoterAction } from "./actions"
export { type ViewAction } from "./actions"

//---
//--- Models
//---

export type ViewModel = {
    counter: CounterModel
    quoter: QuoterModel
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
    } else {
        return { model: model }
    }
}

//---
//--- Views
//---

function AppLayout(props: React.PropsWithChildren) {
    return <>
        <Grommet full={true} theme={grommet}>
            <Box
                background="dark-2"
                direction="column"
                height="100%"
                justify="center">
                <Box
                    align="center"
                    direction="row-responsive"
                    gap="medium"
                    justify="center"
                    pad="xlarge"
                    children={props.children}
                />
            </Box>
        </Grommet>
    </>
}

function App({ store }: { store: Store<ViewModel, ViewAction> }) {
    const state = store((state) => state)
    return <>
        <AppLayout>
            <Counter model={state.counter} dispatch={state.dispatch} />
            <RandomQuote model={state.quoter} dispatch={state.dispatch} />
        </AppLayout>
    </>
}

export function renderApp(store: Store<ViewModel, ViewAction>) {
    return <App store={store} />
}

export function initApp(): Change<ViewModel, AppEffect> {
    return {
        model: {
            counter: { count: 0 },
            quoter: {}
        },
    }
}
