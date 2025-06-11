import { create } from "zustand"
import { devtools, redux } from "zustand/middleware"
import type { Proc } from "./clientApi"

export interface ReduxAction {
    type: string
}

export interface EffectAction<Effect, Action> extends ReduxAction {
    effect: Effect,
    dispatch: (action: Action) => void
}

export interface Change<Model, Effect = Proc> {
    model: Model
    effect: Effect
}

export type Store<Model, Action extends ReduxAction> =
    ReturnType<typeof createStore<Model, Action, Proc>>

export type Updater<Model, Action extends ReduxAction> =
    (model: Model, action: Action) => Change<Model, Proc>

export type Reducer<Model, Action> =
    (model: Model, action: Action) => Model

export function createStore<
    Model,
    Action extends ReduxAction,
    Effect,
>(
    init: () => Change<Model, Proc>,
    update: (model: Model, action: Action) => Change<Model, Proc>,
    forward: (effect: EffectAction<Proc, Action>) => void | Promise<void>
) {
    const ports = { dispatch: (_action: Action) => {} }

    const initialChange = init()
    const store = create(devtools(redux<Model, Action>((model, action) => {
        const change = update(model, action)
        console.log("update change: ", change)
        forward({
            type: "effect",
            effect: change.effect,
            dispatch: ports.dispatch,
        })
        return change.model
    }, initialChange.model)))
    
    const dispatch = (action: Action) => { store.dispatch(action) }
    ports.dispatch = dispatch

    forward({
        type: "effect",
        effect: initialChange.effect,
        dispatch: ports.dispatch,
    })

    return store
}
