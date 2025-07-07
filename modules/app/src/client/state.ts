import type { Root } from "react-dom/client"
import type { AppModel } from "@app/client/app/appController"
import type { AppAction } from "@app/client/app/appActions"
import type { AppEffect } from "@app/client/app/appEffects"
import type { AppRunner, Store, StoreAction } from "@app/client/store"

export interface RootState<Model, Action extends StoreAction, Effect extends AppEffect> {
    rootElement: Root
    store: Store<Model, Action>
    runner: AppRunner<Model, Action, Effect>
}

export const stateRef: { ref: RootState<AppModel, AppAction, AppEffect> | null } = { ref: null }
