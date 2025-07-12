import { Effect, Either } from "effect"
import { createRoot, type Root } from "react-dom/client"

import { createClientApi, type ClientApi } from "@app/client/api"
import type { Dispatcher } from "@app/client/framework"
import { stateRef, type RootState } from "@app/client/state"
import { type Store, AppRunner, type Effector } from "@app/client/store"

import * as appController from "@app/client/app/appController"
import type { AppEffect, RpcEffect, TimeEffect, CustomEffect } from "@app/client/app/appEffects"
import { RenderApp, type AppAction, type AppModel } from "@app/client/app/appView"

import "@radix-ui/themes/styles.css"
import "@app/client/client.css"

if (import.meta.hot) {
    import.meta.hot.accept()
}

//---
//--- Effects Runtime
//---

async function runRpcEffect(api: ClientApi, effect: RpcEffect, dispatch: Dispatcher<AppAction>) {
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

async function runTimeEffect(effect: TimeEffect<AppAction>, dispatch: Dispatcher<AppAction>) {
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

function runCustomEffect<Command extends CustomEffect<any, any, AppAction>>(
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

const forwardEffect: Effector<AppEffect, AppAction> = async (context, effectAction) => {
    switch (effectAction.effect.type) {
        case ":effects/rpc": {
            runRpcEffect(context.api, effectAction.effect, effectAction.dispatch)
            break
        }
        case ":effects/time": {
            runTimeEffect(effectAction.effect, effectAction.dispatch)
            break
        }
        case ":effects/custom": {
            runCustomEffect(effectAction.effect, effectAction.dispatch)
            break
        }
        default: {
            console.log("Warning: effect not implemented", effectAction.effect)
        }
    }

}

//---
//--- Client Main
//---

const rootElementId = "root"

function renderApp(rootElement: Root, store: Store<AppModel, AppAction>): void {
    rootElement.render(RenderApp({ store }))
}

function main(
    contextRef: { ref: RootState<AppModel, AppAction, AppEffect> | null },
    elementId: string
): void {
    try {
        if (contextRef.ref) {
            contextRef.ref.runner.controller = appController
            contextRef.ref.runner.forwardEffect = forwardEffect
            renderApp(contextRef.ref.rootElement, contextRef.ref.store)
        }
        else {
            const element = document.getElementById(elementId)
            if (!element) {
                const error = {
                    type: "error" as const,
                    message: `"Missing Element by ID" ${elementId}`
                }
                throw error
            }

            const runner = new AppRunner(createClientApi(), appController, forwardEffect)

            const initFlags = {}
            const { store } = runner.init(initFlags)
            const rootElement = createRoot(element)

            contextRef.ref = {
                rootElement,
                store,
                runner,
            }

            renderApp(contextRef.ref.rootElement, contextRef.ref.store)
        }
    }
    catch (error) {
        console.error(error)
    }
}

main(stateRef, rootElementId)
