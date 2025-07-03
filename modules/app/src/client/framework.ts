import * as Optics from "optics-ts"
import { useCallback, useRef } from "react"
import { usePortableLayoutEffect } from "./utils"
import type { StoreAction, Store, StoreSelector, Updater } from "./store"
import { WidgetActionTags, type WidgetAction } from "./actions"
import type { AppEffect } from "@app/client/effects"

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

export function useModel<Model, SelectedModel, Action extends StoreAction>(
    store: Store<Model, Action>,
    modelSelector: (state: StoreSelector<Model, Action>) => SelectedModel
) {
    const model = store(modelSelector)
    const dispatch = store(state => state.dispatch)
    return { model, dispatch }
}

export interface EffectAction<Effect, Action> {
    effect: Effect,
    dispatch: (action: Action) => void
}

export function useWidget<Model, WidgetModel, Action extends StoreAction, Effect extends AppEffect>(
    widgetOptic: Optics.Lens<Model, any, WidgetModel>,
    storeDispatch: Dispatcher<WidgetAction<Model, WidgetModel, Action, Effect>>,
    widgetModel: WidgetModel,
    update: Updater<WidgetModel, Action, Effect>,
) {
    const widgetDispatch = useResponder(storeDispatch, widgetModel, (dispatch, model, widgetAction: Action) => {
        const change = update(model, widgetAction)
        const action: WidgetAction<Model, WidgetModel, Action, Effect> = {
            type: WidgetActionTags.Update,
            widgetOptic,
            widgetChange: change,
            widgetAction
        }
        dispatch(action)
    })
    return { model: widgetModel, dispatch: widgetDispatch }
}
