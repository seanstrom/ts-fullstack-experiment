import { create } from "zustand"
import { devtools, redux } from "zustand/middleware"
import type { AppEffect } from "@app/client/app/appEffects"
import type { StateController } from "@app/client/state"

export interface StoreAction {
    type: string
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

export class AppRunner<Model, Action, Effect> {
    ports: {
        dispatch: (action: Action) => void
        forwardEffect: (effect: EffectAction<Effect, Action>) => void | Promise<void>
    }

    stateController: StateController<Model, Action, Effect>

    constructor(
        stateController: StateController<Model, Action, Effect>,
        forwardEffect: (effect: EffectAction<Effect, Action>) => void | Promise<void>
    ) {
        this.ports = {
            dispatch: (_action) => { },
            forwardEffect: forwardEffect
        }

        this.stateController = stateController
    }

    init(flags?: any) {
        return this.stateController.controller.init(flags)
    }

    update(model: Model, action: Action) {
        return this.stateController.controller.update(model, action)
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
