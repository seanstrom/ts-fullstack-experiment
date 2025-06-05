import {
    useCallback,
    useReducer,
    useRef,
} from "react"

import { usePortableLayoutEffect } from "./utils"

//---
//--- Hooks
//---

type Dispatcher<Action> = (action: Action) => void

type InteractionHandler<Interaction> = (event: Interaction) => void

type Forwarder<Model, Action, Interaction> =
    (dispatch: Dispatcher<Action>,
        model: Model,
        event: Interaction) => void

function useResponder<Model, Action, Interaction>(
    dispatch: Dispatcher<Action>,
    model: Model,
    forward: Forwarder<Model, Action, Interaction>
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
    type: typeof tags.Increment
}

interface Decrement {
    type: typeof tags.Decrement
}

type ViewAction = Increment | Decrement

type ViewEvent<El = Element, Ev = Event> = React.SyntheticEvent<El, Ev>

//---
//--- Model
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
    switch (action.type) {
        case tags.Increment:
            return { count: model.count + 1 }
        case tags.Decrement:
            return { count: model.count - 1 }
    }
}

//---
//--- View
//---

function onButtonClick(
    dispatch: Dispatcher<ViewAction>,
    model: ViewModel,
    _event: ViewEvent<HTMLButtonElement, MouseEvent>
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
    const increment = useResponder(dispatch, model, onIncrement)
    const decrement = useResponder(dispatch, model, onDecrement)
    const buttonClick = useResponder(dispatch, model, onButtonClick)

    return <>
        <button onClick={increment}>Increment</button >
        <span>{model.count}</span>
        <button onClick={decrement}>Decrement</button>
        <button onClick={buttonClick}>Test</button>
    </>
}

function Component(model: ViewModel) {
    const [state, dispatch] = useReducer(update, model)
    return view(dispatch, state)
}

export function renderApp(props: any) {
    return <Component count={props.count}></Component>
}
