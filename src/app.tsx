import {
    useCallback,
    useRef,
} from "react"

import { Grommet, Box, Button, Text, grommet } from "grommet"

import { type Store } from "./store"
import { usePortableLayoutEffect } from "./utils"

//---
//--- Hooks
//---

type Dispatcher<Action> = (action: Action) => void

type InteractionHandler<Interaction> = (event: Interaction) => void

type Responder<Model, Action, Interaction> =
    (dispatch: Dispatcher<Action>,
        model: Model,
        event: Interaction) => void

function useResponder<Model, Action, Interaction>(
    dispatch: Dispatcher<Action>,
    model: Model,
    forward: Responder<Model, Action, Interaction>
): InteractionHandler<Interaction> {
    const modelRef = useRef(model)
    const dispatchRef = useRef(dispatch)

    usePortableLayoutEffect(() => {
        modelRef.current = model
        dispatchRef.current = dispatch
    }, [model, dispatch])

    const callback = useCallback((event: Interaction) => {
        forward(dispatchRef.current, modelRef.current, event)
    }, [modelRef, dispatchRef])

    return callback
}


type InferredResponders<Model, Action, T> = {
    [K in keyof T]: T[K] extends Responder<Model, Action, infer I>
    ? InteractionHandler<I>
    : never
}

function useRespondersArray<
    Model,
    Action,
    Responders extends readonly Responder<Model, Action, any>[]
>(
    dispatch: Dispatcher<Action>,
    model: Model,
    responders: Responders
): InferredResponders<Model, Action, Responders> {
    return responders.map((responder) => {
        return useResponder(dispatch, model, responder)
    }) as any
}

function useResponders<
    Model,
    Action,
    Responders extends Record<string, Responder<Model, Action, any>>
>(
    dispatch: Dispatcher<Action>,
    model: Model,
    responders: Responders
): InferredResponders<Model, Action, Responders> {
    const result = {} as any

    for (const key in responders) {
        result[key] = useResponder(dispatch, model, responders[key])
    }

    return result
}

//---
//--- Actions
//---

const DecrementTag: unique symbol = Symbol("Decrement")
const IncrementTag: unique symbol = Symbol("Increment")

const tags = {
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

type ViewEvent<El = Element, Ev = Event> = React.SyntheticEvent<El, Ev>

//---
//--- Models
//---

export type ViewModel = {
    count: number
}

//---
//--- Update
//---

function update(
    model: ViewModel,
    action: ViewAction
): ViewModel {
    switch (action.type) {
        case tags.Increment:
            return { count: model.count + 1 }
        case tags.Decrement:
            return { count: model.count - 1 }
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

function view(
    dispatch: Dispatcher<ViewAction>,
    model: ViewModel
) {
    const responders = useResponders(dispatch, model, {
        onIncrement,
        onDecrement,
        onButtonClick
    })

    return <>
        <button onClick={responders.onIncrement}>Increment</button >
        <span>{model.count}</span>
        <span onClick={responders.onDecrement}>Decrement</span>
        <button onClick={responders.onButtonClick}>Test</button>
    </>
}

function AppLayout(props: React.PropsWithChildren) {
    const { children } = props

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
                    children={children}
                />
            </Box>
        </Grommet>
    </>
}

function App({ store }: { store: Store }) {
    const state = store((state) => state)
    return <>
        <AppLayout>
            <Component model={state} dispatch={state.dispatch} />
        </AppLayout>
    </>
}

function ComponentLayout(props: React.PropsWithChildren) {
    const { children } = props

    return <>
        <Box
            align="center"
            pad="large"
            gap="xsmall"
            cssGap={true}
            round={true}
            background={{ color: 'light-2', opacity: 'strong' }}
            children={children}
        />
    </>
}

function ComponentView({ model, dispatch }: { model: ViewModel, dispatch: Dispatcher<ViewAction> }) {
    const { increment, decrement, buttonClick } = useResponders(dispatch, model, {
        increment: onIncrement,
        decrement: onDecrement,
        buttonClick: onButtonClick
    })

    return <>
        <Text size="77px">
            {model.count}
        </Text>

        <Button
            primary
            label="Increment"
            onClick={increment}
        />

        <Button
            primary
            label="Decrement"
            onClick={decrement}
        />

        <Button
            label="Test"
            onClick={buttonClick}
        />
    </>
}

function Component({ model, dispatch }: { model: ViewModel, dispatch: Dispatcher<ViewAction> }) {
    return <>
        <ComponentLayout>
            <ComponentView
                model={model}
                dispatch={dispatch}
            />
        </ComponentLayout>
    </>
}

export function renderApp(store: Store) {
    return <App store={store} />
}

export const updateApp = update
export const initApp = () => ({ count: 0 } as ViewModel)

