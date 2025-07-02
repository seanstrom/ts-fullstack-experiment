import { create } from "zustand"
import { devtools, redux } from "zustand/middleware"
import type { AppEffect } from "./effects"
import type { StateController } from "./state"

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

class StoreRunner<Model, Action, Effect> {
    ports: {
        dispatch: (action: Action) => void
        forward: (effect: EffectAction<Effect, Action>) => void | Promise<void>
    }

    stateController: StateController<Model, Action, Effect>

    constructor(stateController: StateController<Model, Action, Effect>, forward: (effect: EffectAction<Effect, Action>) => void | Promise<void>) {
        this.ports = {
            dispatch: (_action) => { },
            forward: forward
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

function createZustandStore<
    Model,
    Action extends StoreAction,
    Effect extends AppEffect
>(
    storeRunner: StoreRunner<Model, Action, Effect>,
    initialModel: Model
) {
    return create(devtools(redux<Model, Action>((model, action) => {
        const change = storeRunner.update(model, action)
        console.log("update change: ", change)
        if (change.effect) {
            storeRunner.ports.forward({
                effect: change.effect,
                dispatch: storeRunner.ports.dispatch,
            })
        }
        return change.model
    }, initialModel)))
}

export function createStore<
    Model,
    Action extends StoreAction,
    Effect extends AppEffect,
>(
    stateController: StateController<Model, Action, Effect>,
    forward: (effect: EffectAction<Effect, Action>) => void | Promise<void>
) {
    const storeRunner = new StoreRunner(stateController, forward)
    const initialChange = storeRunner.init()
    const store = createZustandStore(storeRunner, initialChange.model)
    storeRunner.ports.dispatch = store.dispatch

    if (initialChange.effect) {
        forward({
            effect: initialChange.effect,
            dispatch: storeRunner.ports.dispatch,
        })
    }

    return store
}

export type StoreSelector<Model, Action extends StoreAction> =
    Parameters<Parameters<Store<Model, Action>>[0]>[0]
