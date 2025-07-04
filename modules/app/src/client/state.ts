import type { Root } from "react-dom/client"
import type { ClientApi } from "@app/client/api"
import type { AppModel } from "@app/client/app/appController"
import type { AppAction } from "@app/client/app/appActions"
import type { AppEffect } from "@app/client/app/appEffects"
import type { Change, Store, StoreAction } from "@app/client/store"

import * as appController from "@app/client/app/appController"

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
