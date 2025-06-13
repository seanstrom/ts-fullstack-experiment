import { memo as memoRender } from "react"
import { Grommet, Box, Button, Text, grommet } from "grommet"
import { create as mutate } from "mutative"

import { type Quote } from "../data"
import { type Change, type Store, type AppEffect, type RpcEffect } from "./store"
import { useResponders, type Dispatcher, type InteractionHandler } from "./framework"

import { type ViewAction, type CounterAction, type QuoterAction, CounterActionTags, QuoterActionTags } from "./actions"
export { type ViewAction } from "./actions"

//---
//--- Events
//---

export type ViewEvent<El = Element, Ev = Event> = React.UIEvent<El, Ev>

//---
//--- Models
//---

export type CounterModel = {
    count: number
}

export type QuoterModel = {
    quote?: Quote
}

export type ViewModel = {
    counter: CounterModel
    quoter: QuoterModel
}

//---
//--- Update
//---

const randomQuoteEffect: RpcEffect = {
    type: ":effects/rpc",
    command: {
        type: "fetchRandomQuote",
        procedure: "query",
        input: (void 0),
    }
}

function isQuoterAction(action: ViewAction): action is QuoterAction {
    return action.type.includes(":quoter/")
}

function isCounterAction(action: ViewAction): action is CounterAction {
    return action.type.includes(":counter/")
}

function updateQuoter(model: QuoterModel, action: QuoterAction): Change<QuoterModel, AppEffect> {
    switch (action.type) {
        case QuoterActionTags.GotRandomQuote:
            return { model: Object.assign({}, model, { quote: action.quote }) }
        case QuoterActionTags.GetRandomQuote:
            return { model: model, effect: randomQuoteEffect }
    }
}

function updateCounter(model: CounterModel, action: CounterAction): Change<CounterModel, AppEffect> {
    switch (action.type) {
        case CounterActionTags.Increment:
            return { model: mutate(model, draft => { draft.count = model.count + 1 }) }
        case CounterActionTags.Decrement:
            return { model: mutate(model, draft => { draft.count = model.count - 1 }) }
    }
}

function update(model: ViewModel, action: ViewAction): Change<ViewModel, AppEffect> {
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

function onButtonClick(
    dispatch: Dispatcher<ViewAction>,
    model: CounterModel,
    _event: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>
) {
    if (model.count > 3 && model.count % 2 === 0) {
        dispatch({ type: CounterActionTags.Decrement })
    } else {
        dispatch({ type: CounterActionTags.Increment })
    }
}

function onIncrement(
    dispatch: Dispatcher<ViewAction>,
    _model: CounterModel,
    _event: ViewEvent
) {
    dispatch({ type: CounterActionTags.Increment })
}

function onDecrement(
    dispatch: Dispatcher<ViewAction>,
    _model: CounterModel,
    _event: ViewEvent
) {
    dispatch({ type: CounterActionTags.Decrement })
}

function ComponentLayout(props: React.PropsWithChildren) {
    return <>
        <Box
            align="center"
            pad="large"
            gap="xsmall"
            cssGap={true}
            round={true}
            background={{ color: 'light-2', opacity: 'strong' }}
            style={{ minWidth: "auto" }}
            children={props.children}
        />
    </>
}

function ComponentButton<
    ButtonInteraction extends React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>,
    ClickHandler extends InteractionHandler<ButtonInteraction>>
    (props: { label: string, onClick: ClickHandler }) {
    return <>
        <Button
            primary
            label={props.label}
            onClick={props.onClick}
        />
    </>
}

const ComponentButtonMemo = memoRender(ComponentButton)

function onGetRandomQuote(
    dispatch: Dispatcher<ViewAction>,
    _model: QuoterModel,
    _event: ViewEvent
) {
    dispatch({ type: QuoterActionTags.GetRandomQuote })
}

function RandomQuote({ model, dispatch }: { model: QuoterModel, dispatch: Dispatcher<ViewAction> }) {
    const quote = model.quote
    const message = quote ? quote.quote : "Want to see a quote?"

    const responders = useResponders(dispatch, model, { onGetRandomQuote })

    return <>
        <ComponentLayout>
            <Text size="37px">
                {message}
            </Text>
            <ComponentButtonMemo
                label="Get Quote"
                onClick={responders.onGetRandomQuote}
            />
        </ComponentLayout>
    </>
}

function Counter({ model, dispatch }: { model: CounterModel, dispatch: Dispatcher<ViewAction> }) {
    const responders = useResponders(dispatch, model, {
        onIncrement,
        onDecrement,
        onButtonClick
    })

    return <>
        <ComponentLayout>
            <Text size="77px">
                {model.count}
            </Text>
            <ComponentButtonMemo
                label="Increment"
                onClick={responders.onIncrement}
            />
            <Button
                primary
                label="Decrement"
                onClick={responders.onDecrement}
            />
            <Button
                label="Test"
                onClick={responders.onButtonClick}
            />
        </ComponentLayout>
    </>
}


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

export const updateApp = update

export function initApp(): Change<ViewModel, AppEffect> {
    return {
        model: {
            counter: { count: 0 },
            quoter: {}
        },
    }
}
