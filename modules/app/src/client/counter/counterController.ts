import { create as mutate } from "mutative"

import type { AppEffect, TimeEffect, CustomEffect } from "@app/client/app/appEffects"
import type { Change } from "@app/client/store"
import type { AppAction, FileAction } from "../app/appActions"
import { Effect, Either } from "effect"

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

function makeTimeEffect<Action>(input: TimeEffect<Action>["command"]): TimeEffect<Action> {
    return {
        type: ":effects/time",
        command: input
    }
}

function makeCustomCommand<Action, Val, Err>(input: {
    effect: Effect.Effect<Val, Err>
    adapters: {
        toAction: (input: Either.Either<Val, Err>) => Action
    }
}): CustomEffect<Action> {
    return {
        type: ":effects/custom",
        commmand: input.effect,
        adapters: input.adapters
    }
}

export function updateCounter(model: CounterModel, action: CounterAction): Change<CounterModel, AppEffect> {
    switch (action.type) {
        case CounterActionTags.Increment:
            return {
                model: mutate(model, draft => { draft.count = model.count + 1 }),
                effect: makeCustomCommand({
                    effect: Effect.gen(function* () {
                        const originTime = performance.timeOrigin + performance.now()
                        yield* Effect.sleep(1000)
                        const nowTime = performance.timeOrigin + performance.now()
                        const deltaTime = nowTime - originTime
                        return { deltaTime } 
                    }),
                    adapters: {
                        toAction(_input): CounterAction {
                            return {
                                type: ":counter/decrement"
                            }
                        }
                    }
                })
            }
        case CounterActionTags.Decrement:
            return {
                model: mutate(model, draft => { draft.count = model.count - 1 }),
                effect: makeTimeEffect<AppAction>({
                    type: "timeout",
                    amount: 100,
                    adapters: {
                        toAction(_input) {
                            return {
                                type: ":counter/increment"
                            }
                        }
                    }
                })
            }
    }
}

export function initCounter(initialCount: number = 0): Change<CounterModel, AppEffect> {
    return { model: { count: initialCount } }
}
