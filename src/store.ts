import type { ViewModel, ViewAction } from "app"
import { create } from "zustand"
import { devtools, redux } from "zustand/middleware"

interface ReduxAction {
    type: string
}

export type Store = ReturnType<typeof createStore<ViewModel, ViewAction>>

export function createStore<Model, Action extends ReduxAction>(
    init: () => Model,
    update: (model: Model, action: Action) => Model
) {
    return create(devtools(redux<Model, Action>(update, init())))
}
