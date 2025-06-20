import { create } from "zustand"
import { devtools, redux } from "zustand/middleware"
import type { ClientApiEffect } from "./api"

const tags = {
    Rpc: ":effects/rpc",
    Time: ":effects/time"
} as const

export interface RpcEffect {
    type: typeof tags.Rpc
    command: ClientApiEffect
}

export interface TimeEffect {
    type: typeof tags.Time
    command: {}
}

export interface AppAction {
    type: string
}

export type AppEffect = RpcEffect | TimeEffect

export interface EffectAction<Effect, Action> {
    effect: Effect,
    dispatch: (action: Action) => void
}

export interface Change<Model, Effect> {
    model: Model
    effect?: Effect
}

export type Store<Model, Action extends AppAction, Effect extends AppEffect = AppEffect> =
    ReturnType<typeof createStore<Model, Action, Effect>>

export type Updater<Model, Action extends AppAction, Effect extends AppEffect> =
    (model: Model, action: Action) => Change<Model, Effect>

export type Reducer<Model, Action> =
    (model: Model, action: Action) => Model

export function createStore<
    Model,
    Action extends AppAction,
    Effect extends AppEffect,
>(
    init: () => Change<Model, Effect>,
    update: (model: Model, action: Action) => Change<Model, Effect>,
    forward: (effect: EffectAction<Effect, Action>) => void | Promise<void>
) {
    const ports = { dispatch: (_action: Action) => { } }

    const initialChange = init()
    const store = create(devtools(redux<Model, Action>((model, action) => {
        const change = update(model, action)
        console.log("update change: ", change)
        if (change.effect) {
            forward({
                effect: change.effect,
                dispatch: ports.dispatch,
            })
        }
        return change.model
    }, initialChange.model)))

    const dispatch = (action: Action) => { store.dispatch(action) }
    ports.dispatch = dispatch

    if (initialChange.effect) {
        forward({
            effect: initialChange.effect,
            dispatch: ports.dispatch,
        })
    }

    return store
}

export type StoreSelector<Model, Action extends AppAction> =
    Parameters<Parameters<Store<Model, Action>>[0]>[0]
