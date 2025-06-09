import { useCallback, useRef } from "react"
import { usePortableLayoutEffect } from "./utils"

export type Dispatcher<Action> = (action: Action) => void

export type InteractionHandler<Interaction> = (event: Interaction) => void

export type Responder<Model, Action, Interaction> =
    (dispatch: Dispatcher<Action>,
        model: Model,
        event: Interaction) => void

type InferredResponders<Model, Action, T> = {
    [K in keyof T]: T[K] extends Responder<Model, Action, infer I>
    ? InteractionHandler<I>
    : never
}

export function useResponder<Model, Action, Interaction>(
    dispatch: Dispatcher<Action>,
    model: Model,
    respond: Responder<Model, Action, Interaction>
): InteractionHandler<Interaction> {
    const modelRef = useRef(model)
    const dispatchRef = useRef(dispatch)
    const respondRef = useRef(respond)

    usePortableLayoutEffect(() => {
        modelRef.current = model
        dispatchRef.current = dispatch
    }, [model, dispatch])

    const callback = useCallback((event: Interaction) => {
        respondRef.current(dispatchRef.current, modelRef.current, event)
    }, [modelRef, dispatchRef, respondRef])

    return callback
}

export function useRespondersArray<
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

export function useResponders<
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
