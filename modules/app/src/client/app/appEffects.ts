import type { ClientApiEffect } from "@app/client/api"

export const EffectTags = {
    Rpc: ":effects/rpc",
    Time: ":effects/time"
} as const

export interface RpcEffect {
    type: typeof EffectTags.Rpc
    command: ClientApiEffect
}

export interface TimeEffect {
    type: typeof EffectTags.Time
    command: {}
}

export type AppEffect = RpcEffect | TimeEffect
