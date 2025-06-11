import { memo as memoRender } from "react"
import { Grommet, Box, Button, Text, grommet } from "grommet"

import { type Change, type EffectAction, type Store } from "./store"
import type { Proc } from "./clientApi"
import { useResponders, type Dispatcher, type InteractionHandler } from "./framework"

//---
//--- Actions
//---

export const tags = {
    Decrement: ":counter/decrement",
    Increment: ":counter/increment",
} as const

interface Increment {
    type: typeof tags.Increment
}

interface Decrement {
    type: typeof tags.Decrement
}

export type ViewAction = Increment | Decrement

//---
//--- Events
//---

export type ViewEvent<El = Element, Ev = Event> = React.UIEvent<El, Ev>

//---
//--- Models
//---

export type ViewModel = {
    count: number
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
            <Component model={state} dispatch={state.dispatch} />
        </AppLayout>
    </>
}

export function renderApp(store: Store<ViewModel, ViewAction>) {
    return <App store={store} />
}

export const updateApp = update

export function initApp(): Change<ViewModel, Proc> {
    return {
        model: { count: 0 },
        effect: {
            type: "fetchRandomQuote",
            procedure: "query",
            input: (void 0),
        }
    }
}
