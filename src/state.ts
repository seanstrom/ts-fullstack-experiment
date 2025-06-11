import type { Root } from "react-dom/client"
import type { Store, ReduxAction } from "./store"
import type { ViewModel, ViewAction } from "./app"
import type { ClientApi } from "./clientApi"

export interface RootState<Model, Action extends ReduxAction> {
    root?: Root
    store?: Store<Model, Action>
    api?: ClientApi
}

export const state: RootState<ViewModel, ViewAction> = {
    root: undefined,
    store: undefined,
    api: undefined,
}
