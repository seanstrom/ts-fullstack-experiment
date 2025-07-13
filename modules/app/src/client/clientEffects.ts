import { Effect, Either } from "effect"
import type { RpcEffect, TimeEffect, CustomEffect } from "@app/client/app/appEffects"

import { type ClientApi } from "@app/client/api"
import type { Dispatcher } from "@app/client/framework"
import { type AppAction } from "@app/client/app/appActions"

//---
//--- Effects Runtime
//---

export async function runRpcEffect(
    api: ClientApi,
    effect: RpcEffect,
    dispatch: Dispatcher<AppAction>
) {
    // NOTE: needed to dectect the untyped symbol from TRPC until we patch the client library
    if (typeof effect.command.type === "symbol") return

    // NOTE: needed to use `any` type to avoid type puzzle with
    // narrowing the response type based on the rpcEffect.
    const sendApiCommand = api[effect.command.type][effect.command.procedure]

    return sendApiCommand(effect.command.input as any)
        .then(data => ({ type: "ok" as const, data }))
        .catch(error => ({ type: "error" as const, error }))
        .then(response => {
            if (response.type === "error") {
                const responseAction = effect.command.adapters.toFailureAction(response.error)
                dispatch(responseAction)
            } else {
                const responseAction = effect.command.adapters.toSuccessAction(response.data as any)
                dispatch(responseAction)
            }
            return response
        })
}

export async function runTimeEffect(
    effect: TimeEffect<AppAction>,
    dispatch: Dispatcher<AppAction>
) {
    switch (effect.command.type) {
        case "timeout": {
            const originTime = performance.timeOrigin + performance.now()
            setTimeout(() => {
                const nowTime = performance.timeOrigin + performance.now()
                const deltaTime = nowTime - originTime
                const action = effect.command.adapters.toAction({ deltaTime })
                dispatch(action)
            }, effect.command.amount)
            break
        }
        case "interval": {
            const originTime = performance.timeOrigin + performance.now()
            setInterval(() => {
                const nowTime = performance.timeOrigin + performance.now()
                const deltaTime = nowTime - originTime
                const action = effect.command.adapters.toAction({ deltaTime })
                dispatch(action)
            }, effect.command.amount)
            break
        }
    }
}

export function runCustomEffect<
    Command extends CustomEffect<any, any, AppAction>
>(
    command: Command, dispatch: Dispatcher<AppAction>
) {
    return Effect.runPromise(command.commmand)
        .then(Either.right)
        .catch(Either.left)
        .then(result => {
            const action = command.adapters.toAction(result)
            dispatch(action)
        })
}
