import { create } from "zustand"
import { devtools, redux } from "zustand/middleware"
import type { ClientApi } from "@app/client/api"
import type { AppEffect } from "@app/client/app/appEffects"

export interface StoreAction {
    type: string
}

export interface Controller<Model, Action, Effect> {
    init(flags?: any): Change<Model, Effect>
    update(model: Model, action: Action): Change<Model, Effect>
}

export interface EffectAction<Effect, Action> {
    effect: Effect,
    dispatch: (action: Action) => void
}

export interface Change<Model, Effect> {
    model: Model
    effect?: Effect
}

export type Store<Model, Action extends StoreAction, Effect extends AppEffect = AppEffect> =
    ReturnType<typeof createStore<Model, Action, Effect>>

export type Updater<Model, Action extends StoreAction, Effect extends AppEffect> =
    (model: Model, action: Action) => Change<Model, Effect>

export type Reducer<Model, Action> =
    (model: Model, action: Action) => Model


export type Effector<Effect, Action> =
    (context: { api: ClientApi }, effect: EffectAction<Effect, Action>) => void | Promise<void>

export class AppRunner<Model, Action extends StoreAction, Effect extends AppEffect> {
    ports: {
        dispatch: (action: Action) => void
        forwardEffect: (effect: EffectAction<Effect, Action>) => void | Promise<void>
    }

    api: ClientApi
    controller: Controller<Model, Action, Effect>
    forwardEffect: Effector<Effect, Action>
    reducerMiddleware: Reducer<Model, Action>

    constructor(
        api: ClientApi,
        controller: Controller<Model, Action, Effect>,
        forwardEffect: Effector<Effect, Action>,
    ) {
        this.api = api
        this.controller = controller
        this.forwardEffect = forwardEffect
        this.ports = {
            dispatch: (_action) => { },
            forwardEffect: (effectAction) => {
                this.forwardEffect({ api: this.api }, effectAction)
            }
        }

        this.reducerMiddleware = (model: Model, action: Action) => {
            const change = this.update(model, action)
            console.log("update change: ", change)
            if (change.effect) {
                this.ports.forwardEffect({
                    effect: change.effect,
                    dispatch: this.ports.dispatch,
                })
            }
            return change.model
        }
    }

    init(flags?: any) {
        const initialChange = this.controller.init(flags)
        const store = createStore<Model, Action, Effect>(initialChange.model, (model, action) => {
            return this.reducerMiddleware(model, action)
        })
        this.ports.dispatch = store.dispatch

        if (initialChange.effect) {
            this.ports.forwardEffect({
                effect: initialChange.effect,
                dispatch: this.ports.dispatch
            })
        }

        return {
            store,
            initialChange,
        }
    }

    update(model: Model, action: Action) {
        return this.controller.update(model, action)
    }
}

export function createStore<
    Model,
    Action extends StoreAction,
    // NOTE: This seems to be heare for the StoresSelector type
    _Effect extends AppEffect,
>(
    initialModel: Model,
    reducerMiddleware: (model: Model, action: Action) => Model
) {
    return create(devtools(redux<Model, Action>((model, action) => {
        return reducerMiddleware(model, action)
    }, initialModel)))
}

export type StoreSelector<Model, Action extends StoreAction> =
    Parameters<Parameters<Store<Model, Action>>[0]>[0]
