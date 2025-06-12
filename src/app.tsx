import { memo as memoRender } from "react"
import { Grommet, Box, Button, Text, grommet } from "grommet"

import { type Quote } from "./data"
import { type Change, type Store, type AppEffect } from "./store"
import { useResponders, type Dispatcher, type InteractionHandler } from "./framework"

//---
//--- Actions
//---

export const tags = {
    Decrement: ":counter/decrement",
    Increment: ":counter/increment",
    GotRandomQuote: ":quotes/GotRandomQuote",
} as const

interface Increment {
    type: typeof tags.Increment
}

interface Decrement {
    type: typeof tags.Decrement
}

interface GotRandomQuote {
    type: typeof tags.GotRandomQuote
    quote: Quote
}

export type ViewAction = Increment | Decrement | GotRandomQuote

//---
//--- Events
//---

export type ViewEvent<El = Element, Ev = Event> = React.UIEvent<El, Ev>

//---
//--- Models
//---

export type ViewModel = {
    count: number
    quote?: Quote
}

//---
//--- Update
//---

function update(model: ViewModel, action: ViewAction): Change<ViewModel, any> {
    switch (action.type) {
        case tags.Increment:
            return { model: { count: model.count + 1 }, effect: null }
        case tags.Decrement:
            return { model: { count: model.count - 1 }, effect: null }
        case tags.GotRandomQuote:
            return { model: Object.assign({ quote: action.quote }, model), effect: null }
        default:
            return { model: model, effect: null }
    }
}

//---
//--- Views
//---

function onButtonClick(
    dispatch: Dispatcher<ViewAction>,
    model: ViewModel,
    _event: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>
) {
    if (model.count > 3 && model.count % 2 === 0) {
        dispatch({ type: tags.Decrement })
    } else {
        dispatch({ type: tags.Increment })
    }
}

function onIncrement(
    dispatch: Dispatcher<ViewAction>,
    _model: ViewModel,
    _event: ViewEvent
) {
    dispatch({ type: tags.Increment })
}

function onDecrement(
    dispatch: Dispatcher<ViewAction>,
    _model: ViewModel,
    _event: ViewEvent
) {
    dispatch({ type: tags.Decrement })
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

function Component({ model, dispatch }: { model: ViewModel, dispatch: Dispatcher<ViewAction> }) {
    const responders = useResponders(dispatch, model, {
        onIncrement,
        onDecrement,
        onButtonClick
    })

    return <>
        <Box direction="row" justify="evenly">
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

            <ComponentLayout>
                {model.quote && (
                    <Text size="37px">
                        {model.quote.quote}
                    </Text>
                )}
            </ComponentLayout>
        </Box>
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
            <Component model={state} dispatch={state.dispatch} />
        </AppLayout>
    </>
}

export function renderApp(store: Store<ViewModel, ViewAction>) {
    return <App store={store} />
}

export const updateApp = update

export function initApp(): Change<ViewModel, AppEffect> {
    return {
        model: { count: 0 },
        effect: {
            type: ":effects/rpc",
            command: {
                type: "fetchRandomQuote",
                procedure: "query",
                input: (void 0),
            }
        }
    }
}
