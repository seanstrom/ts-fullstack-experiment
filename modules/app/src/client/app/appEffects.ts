import type { ClientApiEffect } from "@app/client/api"
import type { AppAction } from "@app/client/app/appActions"

export const EffectTags = {
    Rpc: ":effects/rpc",
    Time: ":effects/time"
} as const

export interface RpcEffect {
    type: typeof EffectTags.Rpc
    command: ClientApiEffect<AppAction>
}

export interface TimeEffect {
    type: typeof EffectTags.Time
    command: {}
}

export type AppEffect = RpcEffect | TimeEffect
