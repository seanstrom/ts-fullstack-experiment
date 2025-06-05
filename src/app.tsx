import { useCallback, useMemo, useRef, useLayoutEffect, useEffect, useReducer } from "react"

export const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useEventCallback<Args extends unknown[], R>(
    fn: (...args: Args) => R,
): (...args: Args) => R
export function useEventCallback<Args extends unknown[], R>(
    fn: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined
export function useEventCallback<Args extends unknown[], R>(
    fn: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined {
    const ref = useRef<typeof fn>(() => {
        throw new Error('Cannot call an event handler while rendering.')
    })

    useIsomorphicLayoutEffect(() => {
        ref.current = fn
    }, [fn])

    return useCallback((...args: Args) => ref.current?.(...args), [ref]) as (
        ...args: Args
    ) => R
}

export function renderApp(props: any) {
    return <Component count={props.count}></Component>
}

type ViewModel = {
    count: number
}

function onButtonPress(
    dispatch: Dispatch<ViewAction>,
    model: ViewModel,
    event: React.SyntheticEvent<HTMLButtonElement>) {

    console.log("model", model)
    console.log("event", event)

    if (model.count > 3 && model.count % 2 === 0) {
        dispatch({ type: tags.Decrement })
    } else {
        dispatch({ type: tags.Increment })
    }
}

type EventHandler<E = unknown> = (event: E) => void

type Dispatch<Action> = (action: Action) => void

type Reaction<Model, Action, E = unknown> = (dispatch: Dispatch<Action>, model: Model, event: E) => void

type EventHandlerStorage<Model, Action, E = unknown> = Map<Reaction<Model, Action, E>, EventHandler<E>>

type EventHandlerFactory<Model, Action, E = unknown> = (reaction: Reaction<Model, Action, E>) => EventHandler<E>

function memoHandler<Model, Action, E = unknown>(
    storageRef: React.RefObject<EventHandlerStorage<Model, Action, E>>,
    makeEventHandler: EventHandlerFactory<Model, Action, E>): EventHandlerFactory<Model, Action, E> {
    return (reaction: Reaction<Model, Action, E>) => {
        const storage: EventHandlerStorage<Model, Action, E> = storageRef.current
        const handler = storage.get(reaction)
        if (handler !== undefined) {
            return handler
        } else {
            const eventHandler = makeEventHandler(reaction)
            storage.set(reaction, eventHandler)
            storageRef.current = storage
            return eventHandler
        }
    }
}

function useReaction<Model, Action, E = unknown>(dispatch: Dispatch<Action>, model: Model) {
    const modelRef = useRef(model)
    const storageRef = useMemo(() => {
        return { current: new Map() }
    }, [])

    useIsomorphicLayoutEffect(() => {
        modelRef.current = model
    }, [model])

    const factory = useMemo(() => {
        return (reaction: Reaction<Model, Action, E>) => {
            const memoizer = memoHandler(storageRef, (callback: Reaction<Model, Action, E>) => {
                return (event: E) => {
                    return callback(dispatch, modelRef.current, event)
                }
            })
            return memoizer(reaction)
        }
    }, [storageRef, modelRef])

    useEffect(() => {
        return () => {
            storageRef.current.clear()
        }
    }, [storageRef])

    return factory
}

function view(makeHandler: EventHandlerFactory<ViewModel, ViewAction, React.SyntheticEvent<HTMLButtonElement>>, model: ViewModel) {
    return <>
        <button onClick={makeHandler(onButtonPress)}>Increment</button>
        <span>{model.count}</span>
    </>
}

const IncrementTag: unique symbol = Symbol("Increment")
const DecrementTag: unique symbol = Symbol("Decrement")

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

export type ViewAction = Increment | Decrement

function update(model: ViewModel, action: ViewAction): ViewModel {
    console.log("update", { model, action })
    switch (action.type) {
        case tags.Increment:
            return { count: model.count + 1 }
        case tags.Decrement:
            return { count: model.count - 1 }
    }
}

function Component(model: ViewModel) {
    const [state, dispatch] = useReducer(update, model)
    const reaction = useReaction<ViewModel, ViewAction, React.SyntheticEvent<HTMLButtonElement>>(dispatch, state)
    return view(reaction, state)
}
