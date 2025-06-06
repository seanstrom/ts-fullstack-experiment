import {
    useCallback,
    useReducer,
    useRef,
} from "react"

import { usePortableLayoutEffect } from "./utils"

import { Grommet, Box, Button, Text, grommet } from "grommet"

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

//---
//--- Actions
//---

const DecrementTag: unique symbol = Symbol("Decrement")
const IncrementTag: unique symbol = Symbol("Increment")

const tags = {
    Decrement: DecrementTag,
    Increment: IncrementTag,
} as const

interface Increment {
    tag: typeof tags.Increment
}

interface Decrement {
    tag: typeof tags.Decrement
}

type ViewAction = Increment | Decrement

//---
//--- Events
//---

type ViewEvent<El = Element, Ev = Event> = React.SyntheticEvent<El, Ev>

//---
//--- Models
//---

type ViewModel = {
    count: number
}

//---
//--- Update
//---

function update(
    model: ViewModel,
    action: ViewAction
): ViewModel {
    switch (action.tag) {
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
        dispatch({ tag: tags.Decrement })
    } else {
        dispatch({ tag: tags.Increment })
    }
}

function onIncrement(
    dispatch: Dispatcher<ViewAction>,
    _model: ViewModel,
    _event: ViewEvent
) {
    dispatch({ tag: tags.Increment })
}

function onDecrement(
    dispatch: Dispatcher<ViewAction>,
    _model: ViewModel,
    _event: ViewEvent
) {
    dispatch({ tag: tags.Decrement })
}

function view(
    dispatch: Dispatcher<ViewAction>,
    model: ViewModel
) {
    const increment = useResponder(dispatch, model, onIncrement)
    const decrement = useResponder(dispatch, model, onDecrement)
    const buttonClick = useResponder(dispatch, model, onButtonClick)

    return <>
        <button onClick={increment}>Increment</button >
        <span>{model.count}</span>
        <span onClick={decrement}>Decrement</span>
        <button onClick={buttonClick}>Test</button>
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
                    background="dark-2"
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

function App(model: ViewModel) {
    return <>
        <AppLayout>
            <Component {...model} />
        </AppLayout>
    </>
}

function ComponentLayout(props: React.PropsWithChildren) {
    const { children } = props

    return <>
        <Box
            align="center"
            gap="small"
            pad="large"
            round={true}
            background={{ color: 'light-2', opacity: 'strong' }}
            children={children}
        />
    </>
}

function ComponentView({ model, dispatch }: { model: ViewModel, dispatch: Dispatcher<ViewAction> }) {
    const increment = useResponder(dispatch, model, onIncrement)
    const decrement = useResponder(dispatch, model, onDecrement)
    const buttonClick = useResponder(dispatch, model, onButtonClick)

    return <>
        <Text size="77px">
            {model.count}
        </Text>

        <Button
            label="Increment"
            onClick={increment}
        />

        <Button
            label="Decrement"
            onClick={decrement}
        />

        <Button
            label="Test"
            onClick={buttonClick}
        />
    </>
}

function Component(model: ViewModel) {
    const [state, dispatch] = useReducer(update, model)
    return <>
        <ComponentLayout>
            <ComponentView
                model={state}
                dispatch={dispatch}
            />
        </ComponentLayout>
    </>
}

export function renderApp(props: any) {
    return <App {...props} />
}
