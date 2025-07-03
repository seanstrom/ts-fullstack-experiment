import { create as mutate } from "mutative"

import type { AppEffect } from "@app/client/effects"
import type { Change } from "@app/client/store"

// --- Actions

export type CounterAction = Increment | Decrement

export const CounterActionTags = {
    Decrement: ":counter/decrement",
    Increment: ":counter/increment",
} as const

export interface Increment {
    type: typeof CounterActionTags.Increment
}

export interface Decrement {
    type: typeof CounterActionTags.Decrement
}

//--- Models

export type CounterModel = {
    count: number
}

//--- Update

export function updateCounter(model: CounterModel, action: CounterAction): Change<CounterModel, AppEffect> {
    switch (action.type) {
        case CounterActionTags.Increment:
            return { model: mutate(model, draft => { draft.count = model.count + 1 }) }
        case CounterActionTags.Decrement:
            return { model: mutate(model, draft => { draft.count = model.count - 1 }) }
    }
}
