import type { Root } from "react-dom/client"
import type { Store, AppAction } from "./client/store"
import type { ViewModel, ViewAction } from "./client/app"
import type { ClientApi } from "./client/api"

export interface RootState<Model, Action extends AppAction> {
    root?: Root
    store?: Store<Model, Action>
    api?: ClientApi
}

export const state: RootState<ViewModel, ViewAction> = {
    root: undefined,
    store: undefined,
    api: undefined,
}
