import * as appController from "./app/appController"
import type { Root } from "react-dom/client"
import type { AppEffect } from "./effects"
import type { Change, Store, StoreAction } from "./store"
import type { AppModel, AppAction } from "./app"
import type { ClientApi } from "./api"

export interface Controller<Model, Action, Effect> {
    init(flags?: any): Change<Model, Effect>
    update(model: Model, action: Action): Change<Model, Effect>
}

export interface StateController<Model, Action, Effect> {
    controller: Controller<Model, Action, Effect>
}

export interface RootState<Model, Action extends StoreAction, Effect extends AppEffect> {
    renderRoot?: Root
    store?: Store<Model, Action>
    api?: ClientApi
    controller: Controller<Model, Action, Effect>
}

export const state: RootState<AppModel, AppAction, AppEffect> = {
    controller: appController
}
