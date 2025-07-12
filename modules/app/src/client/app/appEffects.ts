import { Effect, Either } from "effect"
import type { ClientApiEffect } from "@app/client/api"
import type { AppAction } from "@app/client/app/appActions"

export const EffectTags = {
    Rpc: ":effects/rpc",
    Time: ":effects/time",
    Custom: ":effects/custom",
} as const

export interface RpcEffect {
    type: typeof EffectTags.Rpc
    command: ClientApiEffect<AppAction>
}

export type ErrorWithDeltaTime = { error: Error, deltaTime: number }

export type TimeInfo = { deltaTime: number }

type TimeCommand<Action> =
    {
        type: "timeout",
        amount: number,
        adapters: {
            toAction: (input: TimeInfo) => Action
        }
    } |
    {
        type: "interval",
        amount: number,
        adapters: {
            toAction: (input: TimeInfo) => Action
        }
    }

export interface TimeEffect<TimeAction> {
    type: typeof EffectTags.Time
    command: TimeCommand<TimeAction>
}

export interface CustomEffect<Action, Val = any, Err = any> {
    type: typeof EffectTags.Custom
    commmand: Effect.Effect<Val, Err>
    adapters: {
        toAction: (input: Either.Either<Val, Err>) => Action
    }
}

export type AppEffect = RpcEffect | TimeEffect<AppAction> | CustomEffect<AppAction>
